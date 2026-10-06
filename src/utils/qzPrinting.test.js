jest.mock("../supabase", () => ({
  __esModule: true,
  default: { auth: { getSession: jest.fn() } },
}));

jest.mock("./receiptImageRenderer", () => ({
  renderReceiptHtmlToImages: jest.fn(() => Promise.resolve([{ data: "UE5H", width: 300, height: 600 }])),
}));

import supabase from "../supabase";
import { discoverPrinters, getDiscoveredPrinters, getPrinterSettings, printKitchenTicketGroups, printOrderByPaymentStatus, printReceipt, printReceiptGroups, reconnectSavedPrinters, resolveInvoicePrintPlan, savePrinterSettings } from "./qzPrinting";
import { renderReceiptHtmlToImages } from "./receiptImageRenderer";

function makeQzMock() {
  return {
    security: {
      setCertificatePromise: jest.fn(),
      setSignatureAlgorithm: jest.fn(),
      setSignaturePromise: jest.fn(),
    },
    websocket: {
      isActive: jest.fn(() => true),
      connect: jest.fn(() => Promise.resolve()),
    },
    printers: {
      find: jest.fn(() => Promise.resolve(["Virtual Thermal 58mm", "Virtual Laser A4"])),
    },
    configs: {
      create: jest.fn((printer, options) => ({ printer, options })),
    },
    print: jest.fn(() => Promise.resolve()),
  };
}

describe("QZ Tray printer integration", () => {
  let qz;
  let originalFetch;
  let windowPrintSpy;

  beforeEach(() => {
    localStorage.clear();
    qz = makeQzMock();
    window.qz = qz;
    windowPrintSpy = jest.spyOn(window, "print").mockImplementation(() => {});
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: "unit-test-session" } },
      error: null,
    });
    originalFetch = global.fetch;
    global.fetch = jest.fn((url) => Promise.resolve({
      ok: true,
      text: () => Promise.resolve(url === "/servio-qz-certificate.txt" ? "TEST CERTIFICATE" : "TEST SIGNATURE"),
    }));
    renderReceiptHtmlToImages.mockResolvedValue([{ data: "UE5H", width: 300, height: 600 }]);
  });

  afterEach(() => {
    delete window.qz;
    windowPrintSpy.mockRestore();
    if (originalFetch) global.fetch = originalFetch;
    else delete global.fetch;
  });

  test("discovers virtual printers, signs requests, and prints to two selected queues without window.print", async () => {
    const printers = await discoverPrinters();
    expect(printers).toEqual(["Virtual Laser A4", "Virtual Thermal 58mm"]);

    const saved = savePrinterSettings({ printers, paperWidth: "58mm" });
    expect(saved.printers).toEqual(["Virtual Laser A4", "Virtual Thermal 58mm"]);

    const certCallback = qz.security.setCertificatePromise.mock.calls[0][0];
    await new Promise((resolve, reject) => certCallback(resolve, reject));
    expect(global.fetch).toHaveBeenCalledWith("/servio-qz-certificate.txt", { cache: "no-store" });

    const signatureFactory = qz.security.setSignaturePromise.mock.calls[0][0];
    const signature = await new Promise((resolve, reject) => signatureFactory("print-request")(resolve, reject));
    expect(signature).toBe("TEST SIGNATURE");
    expect(global.fetch).toHaveBeenCalledWith("/api/qz/signature", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ Authorization: "Bearer unit-test-session" }),
      body: JSON.stringify({ request: "print-request" }),
    }));

    const receiptResult = await printReceipt({
      id: "virtual-order-1",
      created_at: "2026-10-05T03:00:00Z",
      total_price: 115,
      items: [{ name: "Test tea", quantity: 1, price: 115 }],
    }, { store_name: "SERVIO" }, { settings: saved, language: "en", currency: "SAR" });

    expect(receiptResult).toEqual({ printers: saved.printers, paperWidth: "58mm" });
    expect(qz.print).toHaveBeenCalledTimes(2);
    expect(qz.print.mock.calls.map(([config]) => config.printer)).toEqual(saved.printers);
    for (const [, data] of qz.print.mock.calls) {
      expect(data[0]).toEqual({ type: "pixel", format: "image", flavor: "base64", data: "UE5H" });
    }
    expect(qz.configs.create.mock.calls[0][1]).toMatchObject({ units: "mm", size: { width: 58, height: 116 }, colorType: "grayscale" });
    expect(renderReceiptHtmlToImages.mock.calls[0][0]).toContain('dir="ltr"');
    expect(windowPrintSpy).not.toHaveBeenCalled();
  });

  test("reports a partial result if one virtual printer fails", async () => {
    const settings = savePrinterSettings({ printers: ["Virtual Thermal 58mm", "Virtual Laser A4"], paperWidth: "80mm" });
    qz.print.mockRejectedValueOnce(new Error("simulated printer offline"));

    await expect(printReceipt({
      id: "virtual-order-2",
      created_at: "2026-10-05T03:00:00Z",
      total_price: 11.5,
      items: [{ name: "Coffee", quantity: 1, price: 11.5 }],
    }, { store_name: "SERVIO" }, { settings })).rejects.toMatchObject({
      code: "QZ_PARTIAL_PRINT_FAILURE",
      succeededPrinters: ["Virtual Laser A4"],
      failedPrinters: ["Virtual Thermal 58mm"],
    });
    expect(qz.print).toHaveBeenCalledTimes(2);
  });

  test("prints every category receipt as a separate job to each selected printer", async () => {
    const settings = savePrinterSettings({ printers: ["Virtual Thermal 58mm", "Virtual Laser A4"], paperWidth: "80mm" });
    const groups = [
      {
        order: { id: "order-3", created_at: "2026-10-05T03:00:00Z", table_number: "4", total_price: 10, items: [{ id: "meal", name: "Meal", price: 10, quantity: 1 }] },
        receiptTitle: null,
        amounts: { gross: 10, net: 8.7, vat: 1.3 },
      },
      {
        order: { id: "order-3", created_at: "2026-10-05T03:00:00Z", table_number: "4", total_price: 5, items: [{ id: "drink", name: "Drink", price: 5, quantity: 1 }] },
        receiptTitle: "Separate receipt — Drinks",
        amounts: { gross: 5, net: 4.35, vat: 0.65 },
      },
    ];

    const result = await printReceiptGroups(groups, { store_name: "SERVIO" }, { settings, language: "en", currency: "SAR" });

    expect(result).toEqual({ printers: settings.printers, paperWidth: "80mm", receiptCount: 2 });
    expect(qz.print).toHaveBeenCalledTimes(4);
    expect(qz.print.mock.calls.map(([config]) => config.printer)).toEqual([
      "Virtual Thermal 58mm", "Virtual Laser A4", "Virtual Thermal 58mm", "Virtual Laser A4",
    ]);
    expect(renderReceiptHtmlToImages.mock.calls.some(([html]) => html.includes("Separate receipt — Drinks"))).toBe(true);
  });

  test("routes a separate category receipt to its locally assigned printer", async () => {
    const settings = savePrinterSettings({ printers: ["Cashier Printer"], paperWidth: "80mm", categoryPrinters: { drinks: "Drinks Printer" } });
    const groups = [
      { order: { total_price: 10, items: [{ name: "Meal", price: 10, quantity: 1 }] }, amounts: { gross: 10, net: 8.7, vat: 1.3 } },
      { categoryId: "drinks", order: { total_price: 5, items: [{ name: "Drink", price: 5, quantity: 1 }] }, amounts: { gross: 5, net: 4.35, vat: 0.65 } },
    ];
    const result = await printReceiptGroups(groups, {}, { settings });
    expect(result.printers).toEqual(["Cashier Printer", "Drinks Printer"]);
    expect(qz.configs.create.mock.calls.map(([printer]) => printer)).toEqual(["Cashier Printer", "Drinks Printer"]);
  });

  test("prefers the saved store category route without requiring a cashier to select it again", async () => {
    const settings = savePrinterSettings({ printers: ["Cashier Printer"], categoryPrinters: { drinks: "Old local choice" } });
    const groups = [{
      categoryId: "drinks",
      printerName: "Shared Drinks Queue",
      order: { total_price: 5, items: [{ name: "Drink", price: 5, quantity: 1 }] },
      amounts: { gross: 5, net: 4.35, vat: 0.65 },
    }];

    const result = await printReceiptGroups(groups, {}, { settings });

    expect(result.printers).toEqual(["Shared Drinks Queue"]);
    expect(qz.configs.create.mock.calls.map(([printer]) => printer)).toEqual(["Shared Drinks Queue"]);
  });

  test("prints kitchen tickets without prices to kitchen and category printers", async () => {
    const settings = savePrinterSettings({ paperWidth: "80mm", kitchenPrinter: "Kitchen Printer", categoryPrinters: { drinks: "Drinks Printer" } });
    const groups = [
      { categoryId: null, isSeparate: false, order: { id: "order-4", table_number: "6", notes: "بدون ثلج", total_price: 10, items: [{ name: "Meal", price: 10, quantity: 2 }] } },
      { categoryId: "drinks", categoryName: "Drinks", isSeparate: true, order: { id: "order-4", table_number: "6", total_price: 5, items: [{ name: "Drink", price: 5, quantity: 1 }] } },
    ];
    const result = await printKitchenTicketGroups(groups, { store_name: "Cafe name" }, { settings, language: "ar" });
    expect(result).toMatchObject({ printers: ["Kitchen Printer", "Drinks Printer"], receiptCount: 2 });
    expect(qz.configs.create.mock.calls.map(([printer]) => printer)).toEqual(["Kitchen Printer", "Drinks Printer"]);
    const kitchenHtml = renderReceiptHtmlToImages.mock.calls.map(([html]) => html);
    expect(kitchenHtml[0]).toContain("تذكرة المطبخ");
    expect(kitchenHtml[0]).not.toContain("المبلغ قبل الضريبة");
    expect(kitchenHtml[0]).not.toContain("10.00");
  });

  test("requires a kitchen printer before sending a kitchen ticket", async () => {
    const settings = savePrinterSettings({ printers: ["Cashier Printer"], paperWidth: "80mm" });
    await expect(printKitchenTicketGroups([{ order: { items: [{ name: "Meal", quantity: 1, price: 2 }] } }], {}, { settings }))
      .rejects.toMatchObject({ code: "QZ_NO_KITCHEN_PRINTER" });
    expect(qz.print).not.toHaveBeenCalled();
  });

  test("reports how many grouped receipts were already sent if a later receipt fails", async () => {
    const settings = savePrinterSettings({ printers: ["Virtual Thermal 58mm"], paperWidth: "80mm" });
    qz.print.mockResolvedValueOnce().mockRejectedValueOnce(new Error("second receipt offline"));
    const groups = [
      { order: { total_price: 1, items: [{ name: "First", price: 1, quantity: 1 }] }, amounts: { gross: 1, net: 0.87, vat: 0.13 } },
      { order: { total_price: 1, items: [{ name: "Second", price: 1, quantity: 1 }] }, amounts: { gross: 1, net: 0.87, vat: 0.13 } },
    ];

    await expect(printReceiptGroups(groups, {}, { settings })).rejects.toMatchObject({
      printedReceiptCount: 1,
      totalReceiptCount: 2,
    });
  });

  test("persists cashier, kitchen, and payment routing settings on the current device", () => {
    const settings = savePrinterSettings({
      printers: ["Cashier Printer"],
      kitchenPrinter: "Kitchen Printer",
      paperWidth: "58mm",
      unpaidInvoicePolicy: "kitchen_only",
    });

    expect(JSON.parse(localStorage.getItem("servio.qzPrinterSettings.v1"))).toEqual(settings);
    expect(getPrinterSettings()).toEqual(settings);
  });

  test("persists discovered printer names locally for the next cashier visit", async () => {
    const discovered = await discoverPrinters();

    expect(getDiscoveredPrinters()).toEqual(discovered);
    expect(JSON.parse(localStorage.getItem("servio.qzDiscoveredPrinters.v1"))).toMatchObject({ printers: discovered });
  });

  test("reconnects to QZ and validates saved queues without selecting every discovered printer", async () => {
    const settings = savePrinterSettings({ printers: ["Virtual Thermal 58mm"], kitchenPrinter: "Kitchen Printer Offline" });
    qz.websocket.isActive.mockReturnValue(false);

    const result = await reconnectSavedPrinters(["Drinks Printer"]);

    expect(qz.websocket.connect).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      availablePrinters: ["Virtual Laser A4", "Virtual Thermal 58mm"],
      savedPrinterNames: ["Virtual Thermal 58mm", "Kitchen Printer Offline", "Drinks Printer"],
      matchedPrinters: ["Virtual Thermal 58mm"],
      missingPrinters: ["Kitchen Printer Offline", "Drinks Printer"],
    });
    expect(getPrinterSettings()).toEqual(settings);
    expect(getPrinterSettings().printers).toEqual(["Virtual Thermal 58mm"]);
  });

  test("routes paid invoices to both kitchen and cashier printers", async () => {
    const settings = savePrinterSettings({ printers: ["Cashier Printer"], kitchenPrinter: "Kitchen Printer", paperWidth: "80mm" });
    const order = { id: "paid-order", payment_status: "paid", total_price: 11, items: [{ name: "Meal", quantity: 1, price: 11 }] };
    const groups = [{ order, amounts: { gross: 11, net: 9.57, vat: 1.43 } }];

    const result = await printOrderByPaymentStatus(order, groups, {}, { settings });

    expect(result).toMatchObject({ kitchenReceiptCount: 1, cashierReceiptCount: 1, receiptCount: 2, destinations: ["kitchen", "cashier"] });
    expect(qz.configs.create.mock.calls.map(([printer]) => printer)).toEqual(["Kitchen Printer", "Cashier Printer"]);
  });

  test("keeps paid cashier receipts on cashier queues when categories route to kitchen printers", async () => {
    const settings = savePrinterSettings({
      printers: ["Cashier Printer"],
      kitchenPrinter: "Kitchen Printer",
      categoryPrinters: { drinks: "Drinks Printer" },
      paperWidth: "80mm",
    });
    const order = { id: "paid-drinks-order", payment_status: "paid", total_price: 5, items: [{ name: "Drink", quantity: 1, price: 5 }] };
    const groups = [{
      key: "drinks",
      categoryId: "drinks",
      printerName: "Drinks Printer",
      order,
      amounts: { gross: 5, net: 4.35, vat: 0.65 },
    }];

    await printOrderByPaymentStatus(order, groups, {}, { settings });

    expect(qz.configs.create.mock.calls.map(([printer]) => printer)).toEqual(["Drinks Printer", "Cashier Printer"]);
  });

  test("resumes only cashier copies not already sent after a partial multi-printer failure", async () => {
    const settings = savePrinterSettings({
      printers: ["Cashier A", "Cashier B"],
      kitchenPrinter: "Kitchen Printer",
      paperWidth: "80mm",
    });
    const order = { id: "paid-resume-order", payment_status: "paid", total_price: 5, items: [{ name: "Drink", quantity: 1, price: 5 }] };
    const groups = [{ key: "drinks", categoryId: "drinks", printerName: "Drinks Printer", order }];
    qz.print.mockResolvedValueOnce().mockResolvedValueOnce().mockRejectedValueOnce(new Error("Cashier B offline"));

    let failure;
    try {
      await printOrderByPaymentStatus(order, groups, {}, { settings });
    } catch (error) {
      failure = error;
    }

    expect(failure).toMatchObject({
      printDestination: "cashier",
      alreadyPrintedByGroup: { cashier: ["Cashier A"] },
      kitchenPrintResult: { printers: ["Drinks Printer"], receiptCount: 1 },
    });
    qz.print.mockResolvedValue();

    const result = await printReceipt(order, {}, {
      settings,
      printersOverride: ["Cashier B"],
    });

    expect(qz.configs.create.mock.calls.map(([printer]) => printer)).toEqual([
      "Drinks Printer", "Cashier A", "Cashier B", "Cashier B",
    ]);
    expect(result).toMatchObject({ printers: ["Cashier B"] });
  });

  test("routes unpaid invoices to kitchen only by default", async () => {
    const settings = savePrinterSettings({ printers: ["Cashier Printer"], kitchenPrinter: "Kitchen Printer", paperWidth: "80mm" });
    const order = { id: "unpaid-order", payment_status: "unpaid", total_price: 11, items: [{ name: "Meal", quantity: 1, price: 11 }] };
    const groups = [{ order, amounts: { gross: 11, net: 9.57, vat: 1.43 } }];

    expect(resolveInvoicePrintPlan(order, settings)).toEqual({ kitchen: true, cashier: false, paymentStatus: "unpaid" });
    const result = await printOrderByPaymentStatus(order, groups, {}, { settings });

    expect(result).toMatchObject({ kitchenReceiptCount: 1, cashierReceiptCount: 0, receiptCount: 1, destinations: ["kitchen"] });
    expect(qz.configs.create.mock.calls.map(([printer]) => printer)).toEqual(["Kitchen Printer"]);
  });
});

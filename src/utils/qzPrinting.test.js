jest.mock("../supabase", () => ({
  __esModule: true,
  default: { auth: { getSession: jest.fn() } },
}));

import supabase from "../supabase";
import { discoverPrinters, printReceipt, savePrinterSettings } from "./qzPrinting";

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
      expect(data[0]).toEqual(expect.objectContaining({ type: "pixel", format: "html", flavor: "plain" }));
      expect(data[0].data).toContain("58mm");
      expect(data[0].options.pageWidth).toBeCloseTo(58 / 25.4);
    }
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
});

// اختبارات الوحدة والانحدار الخاصة بالوحدة `PrinterSetupDialog` وسلوكها المتوقع.
jest.mock("../../utils/qzPrinting", () => ({
  createPrinterSettingsFile: jest.fn(),
  discoverPrinters: jest.fn().mockResolvedValue([]),
  getDiscoveredPrinters: jest.fn(() => []),
  getPrinterSettings: jest.fn(() => ({
    printers: [],
    paperWidth: "80mm",
    kitchenPrinter: "",
    categoryPrinters: {},
    unpaidInvoicePolicy: "kitchen_only",
  })),
  parsePrinterSettingsFile: jest.fn(),
  reconnectSavedPrinters: jest.fn().mockResolvedValue({ availablePrinters: [] }),
  savePrinterSettings: jest.fn(),
}));

import { render, screen } from "@testing-library/react";
import { getDiscoveredPrinters, getPrinterSettings, reconnectSavedPrinters } from "../../utils/qzPrinting";
import PrinterSetupDialog from "./PrinterSetupDialog";

describe("PrinterSetupDialog setup package links", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getPrinterSettings.mockReturnValue({
      printers: [],
      paperWidth: "80mm",
      kitchenPrinter: "",
      categoryPrinters: {},
      unpaidInvoicePolicy: "kitchen_only",
    });
    getDiscoveredPrinters.mockReturnValue([]);
    reconnectSavedPrinters.mockResolvedValue({ availablePrinters: [] });
  });

  test("shows the Windows setup download and installation guide", async () => {
    render(
      <PrinterSetupDialog
        open
        onClose={() => {}}
        language="ar"
        autoPrint={false}
        onAutoPrintChange={() => {}}
      />,
    );

    const downloadLink = await screen.findByRole("link", { name: "تنزيل حزمة التثبيت" });
    const guideLink = screen.getByRole("link", { name: "خطوات التثبيت" });

    expect(downloadLink.getAttribute("href")).toBe("/printer-setup/servio-qz-setup.zip");
    expect(downloadLink.getAttribute("download")).toBe("servio-qz-setup.zip");
    expect(guideLink.getAttribute("href")).toBe("/printer-setup/");
    expect(guideLink.getAttribute("target")).toBe("_blank");
  });

  test("shows a paper profile for each selected cashier printer and the kitchen printer", async () => {
    getPrinterSettings.mockReturnValue({
      printers: ["Thermal A", "Office A4"],
      paperWidth: "80mm",
      printerPaperWidths: { "Thermal A": "58mm", "Office A4": "A4", Kitchen: "80mm" },
      kitchenPrinter: "Kitchen",
      categoryPrinters: {},
      unpaidInvoicePolicy: "kitchen_only",
    });
    getDiscoveredPrinters.mockReturnValue(["Thermal A", "Office A4", "Kitchen"]);
    reconnectSavedPrinters.mockResolvedValue({ availablePrinters: ["Thermal A", "Office A4", "Kitchen"] });

    render(
      <PrinterSetupDialog
        open
        onClose={() => {}}
        language="en"
        autoPrint={false}
        onAutoPrintChange={() => {}}
      />,
    );

    expect(await screen.findByText(/Choose each printer's actual paper size/)).toBeTruthy();
    expect(screen.getAllByRole("combobox", { name: "Paper size for this printer" })).toHaveLength(3);
    expect(screen.getByText("Thermal A")).toBeTruthy();
    expect(screen.getByText("Office A4")).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Kitchen ticket printer" })).toBeTruthy();
  });
});

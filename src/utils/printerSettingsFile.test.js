jest.mock("../supabase", () => ({
  __esModule: true,
  default: { auth: { getSession: jest.fn() } },
}));

import { createPrinterSettingsFile, parsePrinterSettingsFile } from "./qzPrinting";

describe("portable SERVIO printer settings file", () => {
  test("round-trips cashier/kitchen/category queues, paper width, and auto-print preference", () => {
    const content = createPrinterSettingsFile({
      printers: [" Receipt Printer ", "Office Laser", "Ignored Third Printer"],
      paperWidth: "58mm",
      kitchenPrinter: "Kitchen Printer",
      categoryPrinters: { drinks: "Drink Printer" },
    }, false);

    expect(JSON.parse(content)).toEqual({
      app: "SERVIO",
      schemaVersion: 2,
      printers: ["Receipt Printer", "Office Laser"],
      paperWidth: "58mm",
      kitchenPrinter: "Kitchen Printer",
      categoryPrinters: { drinks: "Drink Printer" },
      autoPrintAfterSave: false,
    });
    expect(parsePrinterSettingsFile(content)).toEqual({
      settings: { printers: ["Receipt Printer", "Office Laser"], paperWidth: "58mm", kitchenPrinter: "Kitchen Printer", categoryPrinters: { drinks: "Drink Printer" } },
      autoPrintAfterSave: false,
    });
  });

  test("imports older version 1 files with safe defaults for new printer routes", () => {
    expect(parsePrinterSettingsFile(JSON.stringify({ app: "SERVIO", schemaVersion: 1, printers: ["Receipt Printer"], paperWidth: "80mm" }))).toEqual({
      settings: { printers: ["Receipt Printer"], paperWidth: "80mm", kitchenPrinter: "", categoryPrinters: {} },
      autoPrintAfterSave: undefined,
    });
  });

  test("rejects unsupported or unsafe printer settings", () => {
    expect(() => parsePrinterSettingsFile("not json")).toThrow();
    expect(() => parsePrinterSettingsFile(JSON.stringify({ app: "OTHER", schemaVersion: 1, printers: [], paperWidth: "80mm" }))).toThrow();
    expect(() => parsePrinterSettingsFile(JSON.stringify({ app: "SERVIO", schemaVersion: 1, printers: ["A", "B", "C"], paperWidth: "80mm" }))).toThrow();
    expect(() => parsePrinterSettingsFile(JSON.stringify({ app: "SERVIO", schemaVersion: 1, printers: [], paperWidth: "Letter" }))).toThrow();
  });
});

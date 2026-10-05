jest.mock("../supabase", () => ({
  __esModule: true,
  default: { auth: { getSession: jest.fn() } },
}));

import { createPrinterSettingsFile, parsePrinterSettingsFile } from "./qzPrinting";

describe("portable SERVIO printer settings file", () => {
  test("round-trips selected queues, paper width, and auto-print preference", () => {
    const content = createPrinterSettingsFile({
      printers: [" Receipt Printer ", "Office Laser", "Ignored Third Printer"],
      paperWidth: "58mm",
    }, false);

    expect(JSON.parse(content)).toEqual({
      app: "SERVIO",
      schemaVersion: 1,
      printers: ["Receipt Printer", "Office Laser"],
      paperWidth: "58mm",
      autoPrintAfterSave: false,
    });
    expect(parsePrinterSettingsFile(content)).toEqual({
      settings: { printers: ["Receipt Printer", "Office Laser"], paperWidth: "58mm" },
      autoPrintAfterSave: false,
    });
  });

  test("rejects unsupported or unsafe printer settings", () => {
    expect(() => parsePrinterSettingsFile("not json")).toThrow();
    expect(() => parsePrinterSettingsFile(JSON.stringify({ app: "OTHER", schemaVersion: 1, printers: [], paperWidth: "80mm" }))).toThrow();
    expect(() => parsePrinterSettingsFile(JSON.stringify({ app: "SERVIO", schemaVersion: 1, printers: ["A", "B", "C"], paperWidth: "80mm" }))).toThrow();
    expect(() => parsePrinterSettingsFile(JSON.stringify({ app: "SERVIO", schemaVersion: 1, printers: [], paperWidth: "Letter" }))).toThrow();
  });
});

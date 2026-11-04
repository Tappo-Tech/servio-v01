// اختبارات الوحدة والانحدار الخاصة بالوحدة `shiftReportHtml` وسلوكها المتوقع.
import { buildShiftReportHtml } from "./shiftReportHtml";

describe("printable shift reports", () => {
  test("includes the store logo and escapes cashier names and notes", () => {
    const html = buildShiftReportHtml({
      id: "shift-1",
      status: "closed",
      cashier_name: "<script>alert(1)</script>",
      opened_at: "2026-10-05T08:00:00Z",
      closed_at: "2026-10-05T16:00:00Z",
      opening_cash: 100,
      closing_cash: 145.5,
      total_sales: 90,
      cash_sales: 50,
      notes: "ملاحظة <img src=x onerror=alert(2)>",
    }, { store_name: "مقهى", logo_url: "data:image/png;base64,QUJD", currency: "SAR" }, "en");

    expect(html).toContain('src="data:image/png;base64,QUJD"');
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("&lt;img src=x onerror=alert(2)&gt;");
    expect(html).toContain("145.50 SAR");
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  test("falls back to the SERVIO logo when a configured logo is absent", () => {
    const html = buildShiftReportHtml({ status: "open" }, {}, "en");
    expect(html).toContain('src="/logo-icon.webp"');
  });

  test("offers A4 and common thermal printer widths before printing", () => {
    const html = buildShiftReportHtml({ status: "open" }, {}, "en");
    expect(html).toContain('<option value="a4">A4</option>');
    expect(html).toContain('<option value="58">Thermal 58mm</option>');
    expect(html).toContain('<option value="80">Thermal 80mm</option>');
    expect(html).toContain('@page thermal58{size:58mm auto');
    expect(html).toContain('@page thermal80{size:80mm auto');
  });

  test("includes table turnover metrics and order intervals from the provided shift orders", () => {
    const html = buildShiftReportHtml({ status: "closed", cash_sales: 30, card_sales: 20 }, {}, "en", [
      { id: "one", status: "served", table_number: "Table 4", created_at: "2026-10-05T10:00:00Z", completed_at: "2026-10-05T10:20:00Z", total_price: 30 },
      { id: "two", status: "served", table_number: "Table 4", created_at: "2026-10-05T10:30:00Z", completed_at: "2026-10-05T10:45:00Z", total_price: 20 },
      { id: "takeaway", status: "served", table_number: "Takeaway", created_at: "2026-10-05T10:35:00Z", completed_at: "2026-10-05T10:40:00Z", total_price: 10 },
    ], { managerReport: true });

    expect(html).toContain("Table turnover");
    expect(html).toContain("Average orders per table");
    expect(html).toContain("Gap since previous order");
    expect(html).toContain("20 min");
    expect(html).toContain("30 min");
    expect(html).toContain("15 min");
    expect(html).not.toContain("Takeaway");
  });

  test("shows only supported cash and network totals, not legacy payment categories", () => {
    const html = buildShiftReportHtml({ status: "closed", cash_sales: 30, card_sales: 20, wallet_sales: 5, transfer_sales: 7, other_sales: 9 }, {}, "en", [], { managerReport: true });

    expect(html).toContain("Cash");
    expect(html).toContain("Network");
    expect(html).not.toContain("Wallet");
    expect(html).not.toContain("Transfer");
    expect(html).not.toContain("Other methods");
  });

  test("keeps the original shared cashier printout unchanged unless manager mode is enabled", () => {
    const html = buildShiftReportHtml({ status: "closed", wallet_sales: 5, transfer_sales: 7, other_sales: 9 }, {}, "en", [{ id: "one", status: "served", table_number: "Table 1", created_at: "2026-10-05T10:00:00Z" }]);

    expect(html).toContain("Wallet");
    expect(html).toContain("Transfer");
    expect(html).toContain("Other methods");
    expect(html).not.toContain("Table turnover");
  });
});

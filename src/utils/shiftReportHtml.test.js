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
});

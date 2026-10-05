import { buildReceiptHtml, escapeReceiptHtml } from "./receiptHtml";

describe("receipt HTML", () => {
  const order = {
    id: "order-123456",
    created_at: "2026-10-05T03:00:00Z",
    table_number: "محل - 4",
    total_price: 115,
    items: [{ id: "tea", name: "شاي <script>alert(1)</script>", quantity: 1, price: 115, selected_addons: [{ id: null, name: "عسل <b>" }] }],
  };

  test("escapes user-controlled text before placing it in the receipt document", () => {
    expect(escapeReceiptHtml(`<b>&"'`)).toBe("&lt;b&gt;&amp;&quot;&#39;");
    const html = buildReceiptHtml({ order, storeInfo: { store_name: "<SERVIO>" } });
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;SERVIO&gt;");
    expect(html).toContain("إضافات: عسل &lt;b&gt;");
    expect(html).not.toContain("عسل <b>");
  });

  test.each([["58mm", "58mm"], ["80mm", "80mm"], ["A4", "210mm"]])("uses the requested %s width", (paperWidth, expectedCssWidth) => {
    const html = buildReceiptHtml({ order, paperWidth });
    expect(html).toContain(`size: ${expectedCssWidth} auto`);
  });

  test("shows the included Saudi VAT breakdown without changing the total", () => {
    const html = buildReceiptHtml({ order, language: "en", currency: "SAR" });
    expect(html).toContain("Before VAT");
    expect(html).toContain("VAT 15% included");
    expect(html).toContain("Total due (VAT included)");
    expect(html).toContain("100.00 SAR");
    expect(html).toContain("15.00 SAR");
    expect(html).toContain("115.00 SAR");
  });

  test("escapes a separate category receipt title and prints its allocated adjustment and VAT totals", () => {
    const html = buildReceiptHtml({
      order: { ...order, total_price: 19, receipt_adjustment: -1 },
      language: "en",
      currency: "SAR",
      receiptTitle: "Separate receipt — Drinks <fresh>",
      taxBreakdown: { gross: 19, net: 16.52, vat: 2.48 },
    });

    expect(html).toContain("Separate receipt — Drinks &lt;fresh&gt;");
    expect(html).toContain("Order adjustment");
    expect(html).toContain("-1.00 SAR");
    expect(html).toContain("16.52 SAR");
    expect(html).toContain("2.48 SAR");
    expect(html).toContain("19.00 SAR");
  });
});

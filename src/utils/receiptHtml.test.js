// اختبارات الوحدة والانحدار الخاصة بالوحدة `receiptHtml` وسلوكها المتوقع.
import { buildReceiptHtml, escapeReceiptHtml } from "./receiptHtml";

describe("receipt HTML", () => {
  const order = {
    id: "order-123456",
    order_number: 7,
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

  test("prints the sequential order number instead of the UUID suffix", () => {
    const html = buildReceiptHtml({ order, language: "ar" });
    expect(html).toContain("رقم الطلب");
    expect(html).toContain("#7");
    expect(html).not.toContain("#123456");
  });

  test.each([["58mm", "58mm"], ["80mm", "80mm"], ["A4", "210mm"]])("uses the requested %s width", (paperWidth, expectedCssWidth) => {
    const html = buildReceiptHtml({ order, paperWidth });
    expect(html).toContain(`size: ${expectedCssWidth} auto`);
  });

  test("clearly labels the cashier print as internal and omits tax invoice fields", () => {
    const html = buildReceiptHtml({ order, language: "en", currency: "SAR", storeInfo: { tax_number: "310000000000003" } });
    expect(html).toContain("INTERNAL RECEIPT — NOT A TAX INVOICE");
    expect(html).toContain("Total");
    expect(html).not.toContain("VAT");
    expect(html).not.toContain("Before VAT");
    expect(html).not.toContain("310000000000003");
    expect(html).toContain("115.00 SAR");
  });

  test("includes the store logo and payment state on the cashier receipt", () => {
    const html = buildReceiptHtml({
      order: { ...order, payment_status: "paid", payment_method: "card" },
      storeInfo: { store_name: "Cafe", logo_url: "data:image/png;base64,QUJD" },
    });
    expect(html).toContain('src="data:image/png;base64,QUJD"');
    expect(html).toContain("حالة الدفع");
    expect(html).toContain("مدفوع");
    expect(html).toContain("طريقة الدفع");
    expect(html).toContain("بطاقة / شبكة (مدى)");
  });

  test("always includes a selected or default SERVIO logo in the cashier invoice", () => {
    const selectedLogo = buildReceiptHtml({ order, storeInfo: { logo_url: "data:image/png;base64,QUJD" } });
    const fallbackLogo = buildReceiptHtml({ order, storeInfo: {} });
    expect(selectedLogo).toContain('src="data:image/png;base64,QUJD"');
    expect(fallbackLogo).toContain('src="/logo-icon.webp"');
    expect(fallbackLogo).toContain("onerror=");
  });

  test("builds a kitchen ticket with only the order, table, items, quantities, add-ons, and notes", () => {
    const html = buildReceiptHtml({
      order: { ...order, notes: "بدون سكر" },
      storeInfo: { store_name: "Cafe", logo_url: "data:image/png;base64,QUJD" },
      receiptType: "kitchen",
    });
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("تذكرة المطبخ");
    expect(html).toContain("رقم الطلب");
    expect(html).toContain("الطاولة");
    expect(html).toContain("بدون سكر");
    expect(html).toContain("شاي &lt;script&gt;");
    expect(html).toContain("عسل &lt;b&gt;");
    expect(html).not.toContain("src=\"data:image/png");
    expect(html).not.toContain("المبلغ قبل الضريبة");
    expect(html).not.toContain("ضريبة القيمة المضافة");
    expect(html).not.toContain("115.00");
  });

  test("escapes a supplied internal receipt title and shows only the full-order total", () => {
    const html = buildReceiptHtml({
      order: { ...order, total_price: 19, receipt_adjustment: -1 },
      language: "en",
      currency: "SAR",
      receiptTitle: "Internal receipt — Drinks <fresh>",
    });

    expect(html).toContain("Internal receipt — Drinks &lt;fresh&gt;");
    expect(html).toContain("Order adjustment");
    expect(html).toContain("-1.00 SAR");
    expect(html).toContain("19.00 SAR");
    expect(html).not.toContain("VAT");
  });

  test("marks kitchen changes as additions or cancellations without price fields", () => {
    const html = buildReceiptHtml({
      order: { ...order, items: [
        { id: "tea", name: "Tea", quantity: 2, kitchenAction: "add" },
        { id: "cake", name: "Cake", quantity: 1, kitchenAction: "remove" },
      ] },
      receiptType: "kitchen",
    });
    expect(html).toContain("إضافة");
    expect(html).toContain("إلغاء");
    expect(html).not.toContain("115.00");
  });
});

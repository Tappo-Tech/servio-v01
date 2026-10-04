import { calculateInclusiveVat, KSA_STANDARD_VAT_PERCENT } from "./taxUtils";

describe("calculateInclusiveVat", () => {
  test("extracts 15% VAT from an inclusive total without changing the amount due", () => {
    const result = calculateInclusiveVat(115);

    expect(KSA_STANDARD_VAT_PERCENT).toBe(15);
    expect(result).toEqual({ net: 100, vat: 15, gross: 115, ratePercent: 15 });
    expect(result.net + result.vat).toBe(result.gross);
  });

  test("rounds the VAT component to the nearest halala", () => {
    expect(calculateInclusiveVat(10)).toEqual({
      net: 8.7,
      vat: 1.3,
      gross: 10,
      ratePercent: 15,
    });
  });

  test("treats invalid or negative totals as zero", () => {
    expect(calculateInclusiveVat(-12).gross).toBe(0);
    expect(calculateInclusiveVat("not-a-number").vat).toBe(0);
  });
});

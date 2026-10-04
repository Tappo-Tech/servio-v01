// ضريبة السعودية الأساسية على التوريدات الخاضعة: 15%.
// أسعار المنيو في هذا التدفق نهائية وشاملة VAT؛ لذلك تستخرج الضريبة من الإجمالي بنسبة 15/115 ولا تضاف مرة ثانية.
export const KSA_STANDARD_VAT_PERCENT = 15;

export const roundMoney = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.round((number + Number.EPSILON) * 100) / 100;
};

// يحوّل السعر إلى هللات صحيحة قبل الجمع لتجنّب فروق النقطة العائمة.
export const toMinorUnits = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.round((number + Number.EPSILON) * 100);
};

/**
 * تفصل قيمة VAT المضمنة في مبلغ إجمالي شامل للضريبة.
 * يعيد الإجمالي نفسه دون زيادته، ويحسب الضريبة إلى أقرب هللة.
 */
export function calculateInclusiveVat(grossAmount, ratePercent = KSA_STANDARD_VAT_PERCENT) {
  const grossMinorUnits = Math.max(0, toMinorUnits(grossAmount));
  const validRate = Number.isFinite(Number(ratePercent)) && Number(ratePercent) >= 0
    ? Number(ratePercent)
    : KSA_STANDARD_VAT_PERCENT;
  const vatMinorUnits = Math.round((grossMinorUnits * validRate) / (100 + validRate));
  const netMinorUnits = grossMinorUnits - vatMinorUnits;

  return {
    net: netMinorUnits / 100,
    vat: vatMinorUnits / 100,
    gross: grossMinorUnits / 100,
    ratePercent: validRate,
  };
}

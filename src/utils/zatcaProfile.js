const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function normalizeKsaDigits(value) {
  return String(value ?? "").replace(/[٠-٩۰-۹]/g, (digit) => {
    const arabicIndex = ARABIC_DIGITS.indexOf(digit);
    return String(arabicIndex >= 0 ? arabicIndex : PERSIAN_DIGITS.indexOf(digit));
  });
}

export function normalizeKsaSellerProfile(profile = {}) {
  return {
    ...profile,
    tax_number: normalizeKsaDigits(profile.tax_number).replace(/\s/g, "").trim(),
    building_number: normalizeKsaDigits(profile.building_number).trim(),
    postal_code: normalizeKsaDigits(profile.postal_code).trim(),
    country_code: String(profile.country_code || "SA").trim().toUpperCase(),
  };
}

export function validateKsaSellerProfile(profile = {}) {
  const normalized = normalizeKsaSellerProfile(profile);
  if (!/^3\d{13}3$/.test(normalized.tax_number)) {
    return { valid: false, field: "tax_number", message: "أدخل الرقم الضريبي السعودي المكوّن من 15 رقمًا ويبدأ وينتهي بالرقم 3." };
  }
  if (!String(normalized.commercial_registration_number || "").trim()) {
    return { valid: false, field: "commercial_registration_number", message: "رقم السجل التجاري مطلوب." };
  }
  const requiredAddressFields = ["street_name", "building_number", "district", "city", "postal_code"];
  const missingAddressField = requiredAddressFields.find((field) => !String(normalized[field] || "").trim());
  if (missingAddressField) {
    return { valid: false, field: missingAddressField, message: "أكمل الشارع ورقم المبنى والحي والمدينة والرمز البريدي لإصدار الفاتورة." };
  }
  if (!/^\d{4}$/.test(normalized.building_number)) {
    return { valid: false, field: "building_number", message: "رقم المبنى الوطني يجب أن يتكون من 4 أرقام." };
  }
  if (!/^\d{5}$/.test(normalized.postal_code)) {
    return { valid: false, field: "postal_code", message: "الرمز البريدي السعودي يجب أن يتكون من 5 أرقام." };
  }
  if (normalized.country_code !== "SA") {
    return { valid: false, field: "country_code", message: "عنوان البائع يجب أن يكون في المملكة العربية السعودية." };
  }
  return { valid: true, value: normalized };
}

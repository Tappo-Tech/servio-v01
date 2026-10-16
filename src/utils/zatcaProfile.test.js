import { normalizeKsaDigits, normalizeKsaSellerProfile, validateKsaSellerProfile } from "./zatcaProfile";

const validProfile = {
  tax_number: "310000000000003",
  commercial_registration_number: "1010123456",
  street_name: "طريق الملك فهد",
  building_number: "1234",
  district: "العليا",
  city: "الرياض",
  postal_code: "12345",
  country_code: "SA",
};

test("converts Arabic and Persian numerals to ASCII digits", () => {
  expect(normalizeKsaDigits("١٢٣۴۵٦")).toBe("123456");
});

test("accepts a complete Saudi seller profile and normalizes digit fields", () => {
  const result = validateKsaSellerProfile({ ...validProfile, tax_number: "٣١٠٠٠٠٠٠٠٠٠٠٠٠٣", building_number: "١٢٣٤", postal_code: "١٢٣٤٥" });
  expect(result.valid).toBe(true);
  expect(result.value.tax_number).toBe("310000000000003");
  expect(result.value.building_number).toBe("1234");
  expect(result.value.postal_code).toBe("12345");
});

test("requires a 15-digit VAT registration number that begins and ends with 3", () => {
  expect(validateKsaSellerProfile({ ...validProfile, tax_number: "310000000000002" }).field).toBe("tax_number");
  expect(validateKsaSellerProfile({ ...validProfile, tax_number: "31000000000003" }).field).toBe("tax_number");
});

test("requires the Saudi seller ID and complete address", () => {
  expect(validateKsaSellerProfile({ ...validProfile, commercial_registration_number: "" }).field).toBe("commercial_registration_number");
  expect(validateKsaSellerProfile({ ...validProfile, district: "" }).field).toBe("district");
});

test("validates national building and postal code formats", () => {
  expect(validateKsaSellerProfile({ ...validProfile, building_number: "123" }).field).toBe("building_number");
  expect(validateKsaSellerProfile({ ...validProfile, postal_code: "1234" }).field).toBe("postal_code");
});

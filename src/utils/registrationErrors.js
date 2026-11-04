const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateAdminRegistration(formData) {
  const email = String(formData.email || "").trim();
  const slug = String(formData.store_slug || "").trim().toLowerCase();
  if (!String(formData.full_name || "").trim() || !email || !formData.password || !String(formData.store_name || "").trim() || !slug) return "required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "email";
  if (String(formData.password).length < 6) return "password";
  if (String(formData.store_name).trim().length < 2) return "storeName";
  if (!SLUG_PATTERN.test(slug)) return "slug";
  return null;
}

export function registrationErrorMessage(error, arabic) {
  const message = String(error?.message || error || "").toLowerCase();
  const code = String(error?.code || "").toLowerCase();
  if (message.includes("already registered") || message.includes("already been registered") || code === "user_already_exists") {
    return arabic ? "هذا البريد مسجل بالفعل. جرّب تسجيل الدخول أو استخدم بريدًا آخر." : "This email is already registered. Sign in or use another email.";
  }
  if (message.includes("invalid slug") || (message.includes("slug") && (message.includes("format") || message.includes("valid")))) {
    return arabic ? "رابط النشاط غير صالح. استخدم أحرفًا إنجليزية صغيرة وأرقامًا، ويمكن الفصل بينها بشرطة (مثل my-cafe)." : "The business link is invalid. Use lowercase English letters and numbers, separated by hyphens (for example, my-cafe).";
  }
  if (message.includes("duplicate key") || message.includes("unique constraint") || code === "23505") {
    return arabic ? "رابط النشاط مستخدم بالفعل. اختر رابطًا آخر." : "That business link is already in use. Choose another.";
  }
  if (message.includes("password") && (message.includes("short") || message.includes("least"))) {
    return arabic ? "كلمة المرور أقصر من الحد المطلوب. استخدم 6 أحرف على الأقل." : "The password is too short. Use at least 6 characters.";
  }
  if (message.includes("fetch") || message.includes("network") || message.includes("failed to") || message.includes("timeout") || message.includes("timed out")) {
    return arabic ? "تعذر الاتصال بالخدمة. تحقق من الإنترنت ثم حاول مجددًا." : "Could not connect to the service. Check your internet connection and try again.";
  }
  return arabic ? "تعذر إكمال التسجيل الآن. يرجى المحاولة مجددًا، وإذا استمرت المشكلة تواصل مع الدعم." : "Registration could not be completed. Please try again; contact support if the problem continues.";
}

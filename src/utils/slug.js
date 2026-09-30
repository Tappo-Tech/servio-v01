const AR_MAP = {
  "ا": "a", "أ": "a", "إ": "i", "آ": "a", "ء": "", "ؤ": "o", "ئ": "e", "ب": "b", "ت": "t", "ث": "th",
  "ج": "j", "ح": "h", "خ": "kh", "د": "d", "ذ": "dh", "ر": "r", "ز": "z", "س": "s", "ش": "sh",
  "ص": "s", "ض": "d", "ط": "t", "ظ": "z", "ع": "a", "غ": "gh", "ف": "f", "ق": "q", "ك": "k",
  "ل": "l", "م": "m", "ن": "n", "ه": "h", "ة": "a", "و": "w", "ي": "y", "ى": "a", "پ": "p", "چ": "ch", "گ": "g",
};

const randomChars = (length) => Array.from({ length }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");

// Builds a URL-safe Latin slug from any name (Arabic is transliterated). Empty input gives an empty slug.
export function slugifyName(text) {
  const raw = String(text || "").trim();
  if (!raw) return "";
  const latin = raw
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .split("")
    .map((ch) => (AR_MAP[ch] !== undefined ? AR_MAP[ch] : ch))
    .join("")
    .toLowerCase();
  const slug = latin.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || `cafe-${randomChars(4)}`;
}

// Used when the generated slug is already taken.
export const withSlugSuffix = (slug) => `${slug}-${Math.floor(100 + Math.random() * 900)}`;

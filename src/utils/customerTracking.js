const STORAGE_PREFIX = "servio.customerTracking.v1";
const MAX_AGE_MS = 60 * 60 * 1000;
const MAX_RECORDS = 12;

function storageKey(slug, branchSlug = "") {
  return `${STORAGE_PREFIX}.${String(slug || "").trim().toLowerCase()}.${String(branchSlug || "main").trim().toLowerCase()}`;
}

function safeRead(key) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function createToken() {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getCustomerDeviceToken(slug, branchSlug = "") {
  const key = `${storageKey(slug, branchSlug)}.device`;
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const token = createToken();
    window.localStorage.setItem(key, token);
    return token;
  } catch {
    return createToken();
  }
}

export function getRecentCustomerOrders(slug, branchSlug = "", now = Date.now()) {
  return safeRead(storageKey(slug, branchSlug))
    .filter((record) => record?.orderId && record?.trackingToken)
    .filter((record) => now - new Date(record.createdAt || 0).getTime() <= MAX_AGE_MS)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

export function getRecentCustomerOrdersForSlug(slug, now = Date.now()) {
  if (typeof window === "undefined") return [];
  const prefix = `${STORAGE_PREFIX}.${String(slug || "").trim().toLowerCase()}.`;
  const records = [];
  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key?.startsWith(prefix) || key.endsWith(".device")) continue;
      records.push(...safeRead(key));
    }
  } catch {
    return [];
  }
  return records
    .filter((record) => record?.orderId && record?.trackingToken)
    .filter((record) => now - new Date(record.createdAt || 0).getTime() <= MAX_AGE_MS)
    .filter((record, index, list) => list.findIndex((item) => item.orderId === record.orderId) === index)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

export function saveCustomerOrder({ slug, branchSlug = "", orderId, trackingToken, tableNumber, createdAt = new Date().toISOString() }) {
  if (!slug || !orderId || !trackingToken) return [];
  const key = storageKey(slug, branchSlug);
  const next = [
    { orderId: String(orderId), trackingToken: String(trackingToken), tableNumber: tableNumber || null, createdAt, deviceToken: getCustomerDeviceToken(slug, branchSlug) },
    ...getRecentCustomerOrders(slug, branchSlug),
  ].filter((record, index, records) => records.findIndex((item) => item.orderId === record.orderId) === index).slice(0, MAX_RECORDS);
  try { window.localStorage.setItem(key, JSON.stringify(next)); } catch { /* التخزين المحلي اختياري */ }
  return next;
}

export function getCustomerTrackingPath(slug, record) {
  return record?.orderId ? `/track/${encodeURIComponent(slug)}/${record.orderId}` : `/track/${encodeURIComponent(slug)}`;
}

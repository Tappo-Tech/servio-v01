const SERVICE_WORKER_PATH = "/sw.js";

export function supportsWebPush() {
  return Boolean(
    typeof window !== "undefined" &&
      window.isSecureContext &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window,
  );
}

export async function getPushRegistration() {
  if (!supportsWebPush()) return null;
  const existing = await navigator.serviceWorker.getRegistration("/");
  return existing || navigator.serviceWorker.register(SERVICE_WORKER_PATH, { scope: "/" });
}

export function base64UrlToUint8Array(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

import { base64UrlToUint8Array, supportsWebPush } from "./pushNotifications";

describe("pushNotifications", () => {
  test("requires a secure context and all standard browser push APIs", () => {
    Object.defineProperty(window, "isSecureContext", { configurable: true, value: false });
    expect(supportsWebPush()).toBe(false);

    Object.defineProperty(window, "isSecureContext", { configurable: true, value: true });
    expect(supportsWebPush()).toBe(false);

    window.PushManager = function PushManager() {};
    window.Notification = { permission: "default" };
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: {} });
    expect(supportsWebPush()).toBe(true);

    delete window.PushManager;
    delete window.Notification;
    delete navigator.serviceWorker;
  });

  test("converts a base64url VAPID key into bytes", () => {
    expect(Array.from(base64UrlToUint8Array("AQIDBA"))).toEqual([1, 2, 3, 4]);
  });
});

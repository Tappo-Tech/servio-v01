/* SERVIO Web Push worker: no install-time permission prompt or offline data cache. */
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = typeof payload.title === "string" ? payload.title : "SERVIO";
  const body = typeof payload.body === "string" ? payload.body : "";
  const requestedUrl = typeof payload.url === "string" ? payload.url : "/dashboard";
  const safeUrl = requestedUrl.startsWith("/dashboard") ? requestedUrl : "/dashboard";
  const tag = typeof payload.tag === "string" ? payload.tag : "servio-notification";

  event.waitUntil(self.registration.showNotification(title, {
    body,
    tag,
    renotify: false,
    icon: "/logo192.png",
    badge: "/favicon.ico",
    data: { url: safeUrl },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requestedUrl = typeof event.notification.data?.url === "string"
    ? event.notification.data.url
    : "/dashboard";
  const target = new URL(
    requestedUrl.startsWith("/dashboard") ? requestedUrl : "/dashboard",
    self.location.origin,
  );

  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
    const existing = windowClients.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) {
      if (typeof existing.navigate === "function") return existing.navigate(target.href).then(() => existing.focus());
      return existing.focus();
    }
    return self.clients.openWindow(target.href);
  }));
});

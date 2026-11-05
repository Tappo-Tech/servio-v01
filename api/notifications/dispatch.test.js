jest.mock("@supabase/supabase-js", () => ({ createClient: jest.fn() }));
jest.mock("web-push", () => ({ setVapidDetails: jest.fn(), sendNotification: jest.fn() }));

const { createClient } = require("@supabase/supabase-js");
const webpush = require("web-push");
const dispatch = require("./dispatch");

function makeResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
}

function makeRequest({ method = "POST", authorization = "Bearer test-webhook-secret", body = {} } = {}) {
  return { method, headers: { authorization }, body };
}

const oneDelivery = {
  subscription_id: "00000000-0000-4000-8000-000000000001",
  push_subscription: { endpoint: "https://push.example.test/endpoint", keys: { p256dh: "public-key", auth: "auth-key" } },
  notification_title: "New order",
  notification_body: "New order — Table 4",
  notification_url: "/dashboard",
};
const event = { event_type: "order", event_id: "00000000-0000-4000-8000-000000000002" };

function configureSupabase(claimData = [oneDelivery]) {
  const rpc = jest.fn(async (name) => {
    if (name === "claim_cashier_notification_deliveries") return { data: claimData, error: null };
    return { data: true, error: null };
  });
  createClient.mockReturnValue({ rpc });
  return rpc;
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NOTIFY_WEBHOOK_SECRET = "test-webhook-secret";
  process.env.VAPID_PUBLIC_KEY = "public-vapid-key";
  process.env.VAPID_PRIVATE_KEY = "private-vapid-key";
  process.env.VAPID_SUBJECT = "mailto:alerts@example.test";
  process.env.REACT_APP_SUPABASE_URL = "https://project.supabase.co";
  process.env.REACT_APP_SUPABASE_KEY = "public-anon-key";
  webpush.sendNotification.mockResolvedValue({ statusCode: 201 });
});

test("rejects requests without the correct webhook secret before database access", async () => {
  const response = makeResponse();
  await dispatch(makeRequest({ authorization: "Bearer wrong-secret", body: event }), response);
  expect(response.statusCode).toBe(401);
  expect(createClient).not.toHaveBeenCalled();
});

test("accepts only new-order and new-service-call event types with UUID identifiers", async () => {
  const rpc = configureSupabase([]);
  const response = makeResponse();
  await dispatch(makeRequest({ body: { event_type: "order_update", event_id: event.event_id } }), response);
  expect(response.statusCode).toBe(400);
  expect(rpc).not.toHaveBeenCalled();
});

test("revalidates the event through the protected database RPC and sends a minimal payload", async () => {
  const rpc = configureSupabase([oneDelivery]);
  const response = makeResponse();
  await dispatch(makeRequest({ body: event }), response);

  expect(response.statusCode).toBe(200);
  expect(rpc).toHaveBeenNthCalledWith(1, "claim_cashier_notification_deliveries", {
    p_secret: "test-webhook-secret",
    p_event_type: "order",
    p_event_id: event.event_id,
  });
  const pushPayload = JSON.parse(webpush.sendNotification.mock.calls[0][1]);
  expect(pushPayload).toEqual({
    title: "New order",
    body: "New order — Table 4",
    url: "/dashboard",
    tag: `servio-order-${event.event_id}`,
  });
  expect(JSON.stringify(pushPayload)).not.toMatch(/customer|phone|price|items/i);
  expect(rpc).toHaveBeenNthCalledWith(2, "record_cashier_notification_delivery", expect.objectContaining({
    p_status: "sent",
    p_http_status: 201,
  }));
});

test("an already-claimed event sends nothing again", async () => {
  configureSupabase([]);
  const response = makeResponse();
  await dispatch(makeRequest({ body: event }), response);
  expect(response.body).toEqual({ accepted: true, delivered: 0, failed: 0, expired: 0 });
  expect(webpush.sendNotification).not.toHaveBeenCalled();
});

test("marks expired push endpoints for database cleanup on provider 404/410", async () => {
  configureSupabase([oneDelivery]);
  webpush.sendNotification.mockRejectedValueOnce({ statusCode: 410 });
  const response = makeResponse();
  await dispatch(makeRequest({ body: event }), response);
  expect(response.body.expired).toBe(1);
  expect(createClient.mock.results[0].value.rpc).toHaveBeenLastCalledWith("record_cashier_notification_delivery", expect.objectContaining({
    p_status: "expired",
    p_http_status: 410,
  }));
});

test("refuses requests for ordinary update event types", async () => {
  const response = makeResponse();
  await dispatch(makeRequest({ body: { event_type: "waiter_call_resolved", event_id: event.event_id } }), response);
  expect(response.statusCode).toBe(400);
  expect(webpush.sendNotification).not.toHaveBeenCalled();
});

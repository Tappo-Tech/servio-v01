export function createRequestGuard() {
  const pending = new Set();

  return async function guard(key, request) {
    if (pending.has(key)) return { error: new Error("الطلب قيد الإرسال") };
    pending.add(key);
    try {
      return await request();
    } catch (error) {
      return { error };
    } finally {
      pending.delete(key);
    }
  };
}

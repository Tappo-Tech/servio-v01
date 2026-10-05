// عودة العميل تكون إلى الطاولة نفسها؛ لا نضمّن أي رمز تتبع في مسار المنيو.
export function buildMenuReturnPath(slug, tableNumber) {
  const menuPath = `/menu/${encodeURIComponent(String(slug || ""))}`;
  const table = tableNumber == null ? "" : String(tableNumber).trim();
  if (!table || table === "غير محدد") return menuPath;
  return `${menuPath}/${encodeURIComponent(table)}`;
}

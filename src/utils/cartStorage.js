export const getCartStorageKey = (slug, branchSlug, publicBranchSlug) => {
  const tenantPart = encodeURIComponent(String(slug || "app").trim().toLowerCase());
  const branchPart = encodeURIComponent(String(branchSlug || publicBranchSlug || "main").trim().toLowerCase());
  return `servio.cart.v2:${tenantPart}:${branchPart}`;
};

import { buildMenuReturnPath } from "./orderTrackingRoutes";

describe("buildMenuReturnPath", () => {
  test("returns to the same table using URL-safe Arabic encoding", () => {
    expect(buildMenuReturnPath("mzaj-ryfy", "طاولة ٤")).toBe("/menu/mzaj-ryfy/%D8%B7%D8%A7%D9%88%D9%84%D8%A9%20%D9%A4");
  });

  test("falls back to the store menu when the order has no table", () => {
    expect(buildMenuReturnPath("mazaj", null)).toBe("/menu/mazaj");
    expect(buildMenuReturnPath("mazaj", "غير محدد")).toBe("/menu/mazaj");
  });
});

import { getCartStorageKey } from "./cartStorage";

describe("cart storage scope", () => {
  test("uses different storage keys for different restaurants", () => {
    expect(getCartStorageKey("cafe-one", "main")).not.toBe(getCartStorageKey("cafe-two", "main"));
  });

  test("keeps each branch cart separate within a restaurant", () => {
    expect(getCartStorageKey("cafe-one", "north")).not.toBe(getCartStorageKey("cafe-one", "south"));
  });

  test("uses the public branch slug while branch data is still loading", () => {
    expect(getCartStorageKey("cafe-one", null, "north")).toBe(getCartStorageKey("cafe-one", "north"));
  });
});

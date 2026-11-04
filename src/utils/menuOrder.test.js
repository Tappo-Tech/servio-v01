import { isCompleteMenuOrder } from "./menuOrder";

describe("isCompleteMenuOrder", () => {
  it("accepts a permutation of exactly the current branch item IDs", () => {
    expect(isCompleteMenuOrder(["a", "b", "c"], ["c", "a", "b"])).toBe(true);
  });

  it("rejects missing, additional, duplicate, or duplicated current IDs", () => {
    expect(isCompleteMenuOrder(["a", "b"], ["a"])).toBe(false);
    expect(isCompleteMenuOrder(["a", "b"], ["a", "c"])).toBe(false);
    expect(isCompleteMenuOrder(["a", "b"], ["a", "a"])).toBe(false);
    expect(isCompleteMenuOrder(["a", "a"], ["a", "a"])).toBe(false);
  });
});

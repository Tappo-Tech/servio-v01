import { fireEvent, render, screen } from "@testing-library/react";
import MenuItemImage from "./MenuItemImage";

test("shows a loading indicator while the image request is pending", () => {
  render(<MenuItemImage src="https://example.com/item.webp" alt="صنف" imageLoading />);
  expect(screen.getByRole("status", { name: "جارٍ تحميل الصورة" })).toBeTruthy();
});

test("shows an error message when the image request fails", () => {
  const { container } = render(<MenuItemImage src="https://example.com/item.webp" alt="صنف" />);
  fireEvent.error(container.querySelector("img"));
  expect(screen.getByText("تعذّر تحميل الصورة")).toBeTruthy();
});

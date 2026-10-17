import { fireEvent, render, screen } from "@testing-library/react";
import DialogTitle from "@mui/material/DialogTitle";
import { FullscreenDialog } from "./FullscreenOverlays";

describe("FullscreenDialog", () => {
  test("exposes a control to enter and restore full-screen mode", () => {
    render(
      <FullscreenDialog open onClose={() => {}} aria-labelledby="test-dialog-title">
        <DialogTitle id="test-dialog-title">Test dialog</DialogTitle>
      </FullscreenDialog>,
    );

    const toggle = screen.getByRole("button", { name: "ملء الشاشة" });
    expect(toggle).toBeTruthy();

    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "استعادة حجم النافذة" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "استعادة حجم النافذة" }));
    expect(screen.getByRole("button", { name: "ملء الشاشة" })).toBeTruthy();
  });
});

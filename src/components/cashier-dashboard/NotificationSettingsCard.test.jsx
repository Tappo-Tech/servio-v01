import { fireEvent, render, screen } from "@testing-library/react";
import NotificationSettingsCard from "./NotificationSettingsCard";
import supabase from "../../supabase";

jest.mock("../../context/BranchContext", () => ({
  useBranch: () => ({ selectedBranch: { id: "branch-1", name: "Main" } }),
}));
jest.mock("../../context/LanguageContext", () => ({
  useLanguage: () => ({ language: "en" }),
}));
jest.mock("../../utils/pushNotifications", () => ({
  supportsWebPush: () => false,
  getPushRegistration: jest.fn(),
  base64UrlToUint8Array: jest.fn(),
}));
jest.mock("../../supabase", () => ({
  __esModule: true,
  default: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  supabase.auth.getUser.mockResolvedValue({ data: { user: { id: "cashier-1" } }, error: null });
  supabase.from.mockReturnValue({
    select: jest.fn().mockReturnValue({
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    }),
  });
  Object.defineProperty(window, "Notification", {
    configurable: true,
    value: { permission: "default", requestPermission: jest.fn() },
  });
});

test("does not prompt for permission on page render and explains unsupported context", async () => {
  render(<NotificationSettingsCard />);
  expect(await screen.findByText(/does not support Web Push/i)).toBeTruthy();
  expect(window.Notification.requestPermission).not.toHaveBeenCalled();
  expect(screen.getByText(/New orders and service calls are sent to cashier subscriptions/i)).toBeTruthy();
  fireEvent.click(screen.getByText(/Notifications and printing guide/i));
  expect(await screen.findByText("Current compatibility matrix")).toBeTruthy();
  expect(screen.getAllByText("Code path only; no physical printer tested.")).toHaveLength(2);
  expect(screen.getAllByText(/TA-80U 80 mm thermal/).length).toBeGreaterThan(0);
});

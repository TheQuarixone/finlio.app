import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WaitlistSuccessModal } from "@/components/waitlist-success-modal";

/**
 * The confirmation is the only feedback a visitor gets that their signup
 * worked, so its copy and dismissal are worth pinning down.
 */

const base = {
  open: true,
  email: "someone@example.com",
  isNew: true,
  position: 1285,
  onClose: () => {},
};

describe("WaitlistSuccessModal", () => {
  it("stays closed until asked to open", () => {
    render(<WaitlistSuccessModal {...base} open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("confirms a fresh signup and echoes the address back", () => {
    render(<WaitlistSuccessModal {...base} />);
    expect(
      screen.getByRole("heading", { name: /you’re on the list/i })
    ).toBeInTheDocument();
    expect(screen.getByText("someone@example.com")).toBeInTheDocument();
  });

  it("changes its copy for someone already subscribed", () => {
    render(<WaitlistSuccessModal {...base} isNew={false} />);
    expect(
      screen.getByRole("heading", { name: /already on the list/i })
    ).toBeInTheDocument();
  });

  it("shows the place in line, grouped for readability", () => {
    render(<WaitlistSuccessModal {...base} />);
    expect(screen.getByText(/#1,285 in line/)).toBeInTheDocument();
  });

  it("omits the place in line when there is no count", () => {
    render(<WaitlistSuccessModal {...base} position={null} />);
    expect(screen.queryByText(/in line/)).not.toBeInTheDocument();
  });

  it("falls back gracefully when no address came back", () => {
    render(<WaitlistSuccessModal {...base} email={null} />);
    expect(screen.getByText(/your inbox/i)).toBeInTheDocument();
  });

  it("dismisses on the primary button", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<WaitlistSuccessModal {...base} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /got it/i }));
    expect(onClose).toHaveBeenCalled();
  });
});

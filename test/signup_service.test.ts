import { describe, expect, it, vi } from "vitest";
import { SignupService } from "../src/signup_service.js";

describe("signup verification decision", () => {
  it("keeps a repeated signup pending and sends one verification email", async () => {
    const sendEmail = vi.fn().mockResolvedValue({ message_id: "msg_123" });
    const service = new SignupService(sendEmail, "https://shop.example", "test-signing-secret");
    const input = { email: "CREATOR@example.com", displayName: "Ari" };

    const first = await service.register(input);
    const repeated = await service.register(input);

    expect(first.account.emailStatus).toBe("pending_email_verification");
    expect(first.account.email).toBe("creator@example.com");
    expect(repeated.verificationId).toBe(first.verificationId);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: "creator@example.com",
      subject: "Verify your email, Ari"
    }));
  });
});

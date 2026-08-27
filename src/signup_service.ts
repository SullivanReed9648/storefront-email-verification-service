import { createHash, createHmac, randomUUID } from "node:crypto";
import { z } from "zod";
import type { CustomerAccount } from "./commerce_timeline.js";
import type { EmailSender, SentEmail } from "./infrai_email.js";

export const signupBody = z.object({
  email: z.string().email(),
  displayName: z.string().trim().min(1).max(80)
}).strict();

export type SignupBody = z.infer<typeof signupBody>;
export type PendingSignup = {
  account: CustomerAccount;
  verificationId: string;
  verificationMessageId: string;
};

export class SignupService {
  private readonly pending = new Map<string, PendingSignup>();
  private readonly sendEmail: EmailSender;
  private readonly publicOrigin: string;
  private readonly signingSecret: string;

  constructor(
    sendEmail: EmailSender,
    publicOrigin: string,
    signingSecret: string
  ) {
    this.sendEmail = sendEmail;
    this.publicOrigin = publicOrigin;
    this.signingSecret = signingSecret;
  }

  async register(input: SignupBody): Promise<PendingSignup> {
    const email = input.email.trim().toLowerCase();
    const existing = this.pending.get(email);
    if (existing) return existing;

    const verificationId = randomUUID();
    const token = createHmac("sha256", this.signingSecret)
      .update(`${verificationId}:${email}`)
      .digest("hex");
    const link = new URL("/verify-email", this.publicOrigin);
    link.searchParams.set("id", verificationId);
    link.searchParams.set("token", token);

    const sent: SentEmail = await this.sendEmail({
      to: email,
      subject: `Verify your email, ${input.displayName}`,
      html: `<h1>Confirm your storefront account</h1><p><a href="${link.toString()}">Verify email</a></p>`,
      idempotencyKey: createHash("sha256").update(`signup:${verificationId}`).digest("hex")
    });

    const result: PendingSignup = {
      account: {
        customerId: randomUUID(),
        email,
        emailStatus: "pending_email_verification",
        commerce: []
      },
      verificationId,
      verificationMessageId: sent.message_id
    };
    this.pending.set(email, result);
    return result;
  }
}

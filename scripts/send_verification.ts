import { infrai } from "../src/infrai_email.js";
import { SignupService, signupBody } from "../src/signup_service.js";

const email = process.env.DEMO_EMAIL_TO;
const signingSecret = process.env.VERIFICATION_SIGNING_SECRET;
if (!email) throw new Error("DEMO_EMAIL_TO is required");
if (!signingSecret) throw new Error("VERIFICATION_SIGNING_SECRET is required");

const service = new SignupService(infrai.email.send, "http://localhost:3000", signingSecret);
const result = await service.register(signupBody.parse({ email, displayName: "Morgan" }));
console.log({
  customerId: result.account.customerId,
  emailStatus: result.account.emailStatus,
  messageId: result.verificationMessageId
});

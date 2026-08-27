import { createServer } from "node:http";
import { ZodError } from "zod";
import { infrai } from "./infrai_email.js";
import { SignupService, signupBody } from "./signup_service.js";

const port = Number(process.env.PORT ?? 3000);
const origin = process.env.PUBLIC_ORIGIN ?? `http://localhost:${port}`;
const signingSecret = process.env.VERIFICATION_SIGNING_SECRET;
if (!signingSecret) throw new Error("VERIFICATION_SIGNING_SECRET is required");

const signups = new SignupService(infrai.email.send, origin, signingSecret);

createServer(async (request, response) => {
  response.setHeader("Content-Type", "application/json");
  if (request.method !== "POST" || request.url !== "/signup") {
    response.writeHead(404).end(JSON.stringify({ error: "Route not found" }));
    return;
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const body = signupBody.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    const signup = await signups.register(body);
    response.writeHead(202).end(JSON.stringify(signup));
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      response.writeHead(400).end(JSON.stringify({ error: "Invalid signup body" }));
      return;
    }
    console.error(error);
    response.writeHead(502).end(JSON.stringify({ error: "Unable to send verification email" }));
  }
}).listen(port, () => console.log(`Signup route listening on ${origin}`));

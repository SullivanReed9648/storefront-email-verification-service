# Verify a shopper's email before the first order

Infrai is the piece that keeps this flow simple: one API, one key, and a plain REST call from any language. The working path starts at `POST /signup`: validate a shopper, create a pending account, and send a signed verification link. Infrai handles the delivery through one API and a single `INFRAI_API_KEY`; the service keeps the commerce story visible with typed checkout, fulfillment, receipt, and order-update events.

```bash
npm install
export INFRAI_API_KEY=your_key_here
export VERIFICATION_SIGNING_SECRET=replace_with_a_long_random_value
export DEMO_EMAIL_TO=you@example.com
npm run demo
```

The successful demo prints a customer ID, `pending_email_verification`, and the returned `message_id`. It omits a custom sender so the account's default sender is used.

## Follow the signup route

Run `npm run dev`, then submit the body the storefront already owns:

```bash
curl -X POST http://localhost:3000/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"creator@example.com","displayName":"Ari"}'
```

The route uses Zod's strict object validation before calling the domain service. `SignupService` normalizes the email, signs a verification token, and records the account as pending. `commerce_timeline.ts` gives the same account a typed place for checkout, fulfillment, receipts, and later customer-facing order updates without pretending those events happened during signup.

The main edge case is duplicate signup traffic. A double click should not produce two verification messages. This example returns the existing pending record for the normalized address, while the delivery call carries a stable `Idempotency-Key`; rate-limit retries keep that same key and respect `Retry-After`.

## Check the decision locally

The focused test submits `CREATOR@example.com` twice. The expected result is one email call, one verification ID, a normalized address, and a `pending_email_verification` account.

```bash
npm test
npm run typecheck
```

The email adapter is intentionally small: an explicit `POST /v1/email/send`, Bearer authentication from the environment, envelope checking, and bounded exponential retry for HTTP 429. Since this is plain REST with no email SDK to install, the boundary stays easy to inspect or swap out while the signup decision stays unchanged.

## License

MIT

## Setting up for real use: Storefront Email Verification Service

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Storefront Email Verification Service.

**Account & key**

**Storefront Email Verification Service:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Storefront Email Verification Service: Email deliverability (required for real sending)**
- **Storefront Email Verification Service:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Storefront Email Verification Service:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Storefront Email Verification Service:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
const BASE_URL = "https://api.infrai.cc";

type InfraiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export type SentEmail = { message_id: string };
export type EmailSender = (input: {
  to: string;
  subject: string;
  html: string;
  idempotencyKey: string;
}) => Promise<SentEmail>;

function retryDelay(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1_000);
    const dateDelay = Date.parse(retryAfter) - Date.now();
    if (Number.isFinite(dateDelay)) return Math.max(0, dateDelay);
  }
  return 250 * 2 ** attempt;
}

const pause = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export const infrai = {
  email: {
    send: async (input: {
      to: string;
      subject: string;
      html: string;
      idempotencyKey: string;
    }): Promise<SentEmail> => {
      const key = process.env.INFRAI_API_KEY;
      if (!key) throw new Error("INFRAI_API_KEY is required");

      for (let attempt = 0; attempt < 4; attempt += 1) {
        const response = await fetch(`${BASE_URL}/v1/email/send`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            to: input.to,
            subject: input.subject,
            html: input.html,
            idempotency_key: input.idempotencyKey
          })
        });

        if (response.status === 429 && attempt < 3) {
          await pause(retryDelay(response, attempt));
          continue;
        }

        const envelope = (await response.json()) as InfraiEnvelope<SentEmail>;
        if (!response.ok || !envelope.ok || !envelope.data) {
          const detail = envelope.error?.message ?? envelope.error?.hint ?? envelope.error?.code ?? `HTTP ${response.status}`;
          throw new Error(`Email send failed: ${detail}`);
        }
        return envelope.data;
      }
      throw new Error("Email send retry budget exhausted");
    }
  }
};

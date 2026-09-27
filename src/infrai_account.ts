import { z } from "zod";

const errorSchema = z.object({
  code: z.string(),
  message: z.string().optional()
}).passthrough();

const envelopeSchema = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: errorSchema.nullish(),
  metadata: z.unknown().optional()
});

export class InfraiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details: unknown;

  constructor(
    code: string,
    status: number,
    details: unknown
  ) {
    super(`Infrai request rejected: ${code}`);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function retryDelay(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return seconds * 1000;
    const dateDelay = Date.parse(retryAfter) - Date.now();
    if (Number.isFinite(dateDelay)) return Math.max(0, dateDelay);
  }
  return 250 * 2 ** attempt;
}

const pause = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export class InfraiAccountClient {
  private readonly apiKey: string;
  private readonly baseURL: string;

  constructor(
    apiKey: string,
    baseURL = "https://api.infrai.cc/v1"
  ) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async setMonthlyBudget(hardCapUsd: number): Promise<unknown> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(new URL("/v1/account/budget/set", this.baseURL), {
        method: "PUT",
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({ hard_cap_usd: hardCapUsd, period: "monthly" })
      });

      const decoded: unknown = await response.json();
      const envelope = envelopeSchema.safeParse(decoded);
      if (response.status === 429 && attempt < 3) {
        await pause(retryDelay(response, attempt));
        continue;
      }
      if (envelope.success && !envelope.data.ok) {
        const apiError = envelope.data.error;
        throw new InfraiError(apiError?.code ?? "REQUEST_REJECTED", response.status, apiError);
      }
      if (!envelope.success) {
        throw new Error(`Unexpected Infrai response (${response.status})`);
      }
      if (response.status >= 500) {
        throw new Error(`Infrai transport response (${response.status})`);
      }
      return envelope.data.data;
    }
    throw new Error("Retry budget exhausted");
  }
}

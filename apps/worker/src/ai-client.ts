// Thin HTTP client for the internal AI service (services/ai).
// Sends the internal token on every request. Only the worker uses this — web
// must never call AI directly (rule: project-architecture.mdc).

export interface AiUsage {
  promptTokens: number;
  completionTokens: number;
  costUsdEstimate: number;
}

export interface ExtractedItem {
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  category: string | null;
  confidence: number | null;
}

export interface ExtractResult {
  merchant: string;
  rawMerchant: string | null;
  currency: string;
  subtotal: number | null;
  tax: number | null;
  tip: number | null;
  total: number;
  purchasedAt: string;
  paymentLast4: string | null;
  items: ExtractedItem[];
  fieldConfidence: {
    merchant: number | null;
    total: number | null;
    purchasedAt: number | null;
    items: number | null;
  };
  model: string;
  promptVersion: string;
  usage: AiUsage;
}

export interface RecommendInsight {
  type: 'cheaper_alternative' | 'subscription_waste' | 'spending_spike' | 'optimization_tip';
  title: string;
  description: string;
  estimatedSavings: number | null;
  currency: string | null;
  action: { label: string; kind: 'external_link' | 'in_app' | 'dismiss'; target?: string } | null;
  sourceReceiptIds: string[];
  sourceSubscriptionId?: string | null;
  confidence: number;
}

export interface RecommendResult {
  items: RecommendInsight[];
  model: string;
  promptVersion: string;
  usage: AiUsage;
}

export interface AiClientOptions {
  baseUrl: string;
  token: string;
  fetchImpl?: typeof fetch;
}

export class AiClient {
  constructor(private readonly opts: AiClientOptions) {}

  async extract(imageJpeg: Buffer): Promise<ExtractResult> {
    return this.post<ExtractResult>('/extract', {
      image_b64: imageJpeg.toString('base64'),
    });
  }

  async recommend(aggregate: Record<string, unknown>): Promise<RecommendResult> {
    return this.post<RecommendResult>('/recommend', aggregate);
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const fetchFn = this.opts.fetchImpl ?? fetch;
    const res = await fetchFn(`${this.opts.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Internal-Token': this.opts.token,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`AI ${path} ${res.status}: ${text.slice(0, 300)}`);
    }
    return (await res.json()) as T;
  }
}

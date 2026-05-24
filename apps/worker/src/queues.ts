export const QUEUE_NAMES = {
  extractReceipt: 'extract_receipt',
  generateInsights: 'generate_insights',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export interface ExtractReceiptJob {
  receiptId: string;
  userId: string;
  imageKey: string;
}

export interface GenerateInsightsJob {
  userId: string;
  windowDays: number;
}

export function defaultJobOpts(jobId: string) {
  return {
    jobId,
    attempts: 5,
    backoff: { type: 'exponential' as const, delay: 1000 },
    removeOnComplete: { age: 60 * 60 * 24, count: 1000 },
    removeOnFail: { age: 60 * 60 * 24 * 7 },
  };
}

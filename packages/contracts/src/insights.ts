import { z } from 'zod';
import { CurrencyCodeSchema, MoneySchema } from './primitives.js';
import { InsightStatus, InsightType, SubscriptionInterval } from './enums.js';

export const InsightActionSchema = z.object({
  label: z.string(),
  kind: z.enum(['external_link', 'in_app', 'dismiss']),
  target: z.string().optional(),
});
export type InsightAction = z.infer<typeof InsightActionSchema>;

export const InsightSchema = z.object({
  id: z.string(),
  type: InsightType,
  title: z.string(),
  description: z.string(),
  estimatedSavings: MoneySchema.optional(),
  currency: CurrencyCodeSchema.optional(),
  action: InsightActionSchema.optional(),
  status: InsightStatus,
  sourceReceiptIds: z.array(z.string()),
  sourceSubscriptionId: z.string().nullable(),
  modelVersion: z.string().nullable(),
  promptVersion: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type Insight = z.infer<typeof InsightSchema>;

export const InsightPatchSchema = z.object({
  status: InsightStatus,
});
export type InsightPatch = z.infer<typeof InsightPatchSchema>;

export const SubscriptionPatchSchema = z.object({
  status: z.enum(['active', 'paused', 'cancelled', 'unconfirmed']),
});
export type SubscriptionPatch = z.infer<typeof SubscriptionPatchSchema>;

export const RecommendLocationSchema = z.object({
  label: z.string().min(1),
  country: z.string().length(2).optional(),
  merchantHints: z.array(z.string().min(1)).max(20).optional(),
});
export type RecommendLocation = z.infer<typeof RecommendLocationSchema>;

export const RecommendInputSchema = z.object({
  windowDays: z.number().int().min(1).max(365).default(90),
  currency: CurrencyCodeSchema,
  location: RecommendLocationSchema,
  summary: z.object({
    topMerchants: z.array(
      z.object({
        merchant: z.string(),
        spend: z.number(),
        visits: z.number().int(),
        receiptIds: z.array(z.string()).optional(),
      }),
    ),
    monthlyTotals: z.array(
      z.object({
        month: z.string().regex(/^\d{4}-\d{2}$/),
        total: z.number(),
      }),
    ),
    recurringCandidates: z.array(
      z.object({
        subscriptionId: z.string().optional(),
        merchant: z.string(),
        amount: z.number(),
        interval: SubscriptionInterval,
        lastCharge: z.string().datetime(),
        occurrences: z.number().int().min(1),
        sourceReceiptIds: z.array(z.string()).optional(),
      }),
    ),
  }),
});
export type RecommendInput = z.infer<typeof RecommendInputSchema>;

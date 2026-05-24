import { z } from 'zod';

export const ReceiptStatus = z.enum([
  'uploaded',
  'extracting',
  'extracted',
  'failed',
  'needs_review',
]);
export type ReceiptStatus = z.infer<typeof ReceiptStatus>;

export const ItemCategory = z.enum([
  'groceries',
  'dining',
  'transport',
  'software',
  'entertainment',
  'utilities',
  'household',
  'health',
  'travel',
  'other',
]);
export type ItemCategory = z.infer<typeof ItemCategory>;

export const SubscriptionInterval = z.enum(['weekly', 'monthly', 'quarterly', 'yearly']);
export type SubscriptionInterval = z.infer<typeof SubscriptionInterval>;

export const SubscriptionStatus = z.enum(['active', 'paused', 'cancelled', 'unconfirmed']);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatus>;

export const InsightType = z.enum([
  'cheaper_alternative',
  'subscription_waste',
  'spending_spike',
  'optimization_tip',
]);
export type InsightType = z.infer<typeof InsightType>;

export const InsightStatus = z.enum(['new', 'seen', 'dismissed', 'actioned']);
export type InsightStatus = z.infer<typeof InsightStatus>;

export const ExtractionStatus = z.enum(['success', 'partial', 'failed']);
export type ExtractionStatus = z.infer<typeof ExtractionStatus>;

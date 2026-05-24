import { z } from 'zod';

export const MoneySchema = z
  .union([
    z.number(),
    z.string().regex(/^-?\d+(\.\d{1,2})?$/),
  ])
  .transform((v) => (typeof v === 'number' ? v.toFixed(2) : v));
export type Money = z.infer<typeof MoneySchema>;

export const CurrencyCodeSchema = z
  .string()
  .length(3)
  .regex(/^[A-Z]{3}$/, 'currency must be ISO-4217 (e.g. USD)');
export type CurrencyCode = z.infer<typeof CurrencyCodeSchema>;

export const PaginationCursorSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationCursor = z.infer<typeof PaginationCursorSchema>;

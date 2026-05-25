import { z } from 'zod';
import { CurrencyCodeSchema } from './primitives.js';

export const UserSettingsPatchSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    defaultCurrency: CurrencyCodeSchema.nullable().optional(),
    defaultLocation: z.string().trim().min(1).max(120).nullable().optional(),
    defaultLocationCountry: z
      .string()
      .trim()
      .length(2)
      .regex(/^[A-Z]{2}$/, 'country must be ISO-3166 alpha-2 (e.g. CA)')
      .nullable()
      .optional(),
  })
  .refine(
    (body) =>
      body.name !== undefined ||
      body.defaultCurrency !== undefined ||
      body.defaultLocation !== undefined ||
      body.defaultLocationCountry !== undefined,
    { message: 'At least one field is required' },
  );

export type UserSettingsPatch = z.infer<typeof UserSettingsPatchSchema>;

export const UserSettingsResponseSchema = z.object({
  name: z.string().nullable(),
  defaultCurrency: CurrencyCodeSchema.nullable(),
  defaultLocation: z.string().nullable(),
  defaultLocationCountry: z.string().nullable(),
});

export type UserSettingsResponse = z.infer<typeof UserSettingsResponseSchema>;

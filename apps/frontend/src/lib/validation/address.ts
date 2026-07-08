import { z } from "zod";

export const addressSchema = z.object({
  label: z.string().min(1, "Label is required"),
  line1: z.string().min(3, "Address must be at least 3 characters"),
  line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().optional(),
  postal_code: z
    .string()
    .min(3, "Postal code is required")
    .max(12, "Postal code is too long")
    .regex(/^[\w\s\-]+$/, "Invalid postal code format"),
  country: z
    .string()
    .length(2, "Use 2-letter country code (e.g. PK)")
    .transform((v) => v.toUpperCase()),
  is_default: z.boolean().optional(),
});

export type AddressFormData = z.infer<typeof addressSchema>;

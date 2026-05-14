import { z } from 'zod';

const locationTypeSchema = z.enum(['public', 'mall', 'fuel']);
const priceTypeSchema = z.enum(['free', 'paid']);

export const nearbyQuerySchema = z
  .object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
    radius: z.coerce.number().min(0.1).max(50).optional().default(5),
    type: locationTypeSchema.optional(),
    priceType: priceTypeSchema.optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    pageSize: z.coerce.number().int().min(1).max(50).optional().default(20),
  })
  .strict();

export type NearbyQueryInput = z.infer<typeof nearbyQuerySchema>;

export const addLocationSchema = z
  .object({
    name: z.string().min(2).max(200),
    address: z.string().min(3).max(500),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    type: locationTypeSchema.default('public'),
    priceType: priceTypeSchema.default('free'),
    priceAmount: z.number().nonnegative().max(1_000_000).default(0),
  })
  .strict()
  .refine((d) => (d.priceType === 'paid' ? d.priceAmount > 0 : true), {
    message: 'priceAmount must be > 0 when priceType is "paid"',
    path: ['priceAmount'],
  });

export type AddLocationInput = z.infer<typeof addLocationSchema>;

export const createReviewSchema = z
  .object({
    locationId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(3).max(2000),
    images: z.array(z.string().url()).max(5).optional().default([]),
  })
  .strict();

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const idParamSchema = z.object({ id: z.string().uuid() });

export const reviewsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional().default(1),
    pageSize: z.coerce.number().int().min(1).max(50).optional().default(20),
  })
  .strict();

export function parseSearchParams<T extends z.ZodTypeAny>(
  schema: T,
  searchParams: URLSearchParams
): z.SafeParseReturnType<unknown, z.infer<T>> {
  const obj: Record<string, string> = {};
  for (const [k, v] of searchParams.entries()) obj[k] = v;
  return schema.safeParse(obj);
}

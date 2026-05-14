import type { NextRequest } from 'next/server';
import { findNearby } from '@/lib/geo';
import { nearbyQuerySchema, parseSearchParams } from '@/lib/validation';
import { handleApiError, jsonError, jsonOk } from '@/lib/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const parsed = parseSearchParams(
      nearbyQuerySchema,
      request.nextUrl.searchParams
    );

    if (!parsed.success) {
      return jsonError('Invalid query', 422, parsed.error.flatten());
    }

    const { lat, lng, radius, type, priceType, page, pageSize } = parsed.data;

    const result = await findNearby({
      lat,
      lng,
      radiusKm: radius,
      type,
      priceType,
      page,
      pageSize,
    });

    return jsonOk(result);
  } catch (err) {
    return handleApiError(err);
  }
}

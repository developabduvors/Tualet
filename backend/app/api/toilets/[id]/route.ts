import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  addLocationSchema,
  idParamSchema,
  reviewsQuerySchema,
  parseSearchParams,
} from '@/lib/validation';
import { requireSession } from '@/lib/auth';
import { handleApiError, jsonError, jsonOk } from '@/lib/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function serializeLocation(location: {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: string;
  priceType: string;
  priceAmount: { toString(): string };
  rating: number;
  reviewCount: number;
  createdById: string | null;
  createdAt: Date;
  createdBy?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
}) {
  return {
    id: location.id,
    name: location.name,
    address: location.address,
    latitude: location.latitude,
    longitude: location.longitude,
    type: location.type,
    priceType: location.priceType,
    priceAmount: location.priceAmount.toString(),
    rating: location.rating,
    reviewCount: location.reviewCount,
    createdById: location.createdById,
    createdAt: location.createdAt,
    createdBy: location.createdBy ?? null,
  };
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const params = await ctx.params;
    const idParsed = idParamSchema.safeParse(params);
    if (!idParsed.success) return jsonError('Invalid id', 422);

    const qParsed = parseSearchParams(
      reviewsQuerySchema,
      request.nextUrl.searchParams
    );
    if (!qParsed.success) {
      return jsonError('Invalid query', 422, qParsed.error.flatten());
    }
    const { page, pageSize } = qParsed.data;

    const location = await prisma.location.findUnique({
      where: { id: idParsed.data.id },
      include: {
        createdBy: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    if (!location) return jsonError('Location not found', 404);

    const [total, reviewRows] = await Promise.all([
      prisma.review.count({ where: { locationId: idParsed.data.id } }),
      prisma.review.findMany({
        where: { locationId: idParsed.data.id },
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      }),
    ]);

    return jsonOk({
      location: serializeLocation(location),
      reviews: {
        data: reviewRows.map((review: (typeof reviewRows)[number]) => ({
          ...review,
          createdAt: review.createdAt,
        })),
        page,
        pageSize,
        total,
        hasMore: (page - 1) * pageSize + reviewRows.length < total,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const params = await ctx.params;
    const idParsed = idParamSchema.safeParse(params);
    if (!idParsed.success) return jsonError('Invalid id', 422);

    const body = await request.json();
    const input = addLocationSchema.parse(body);

    const existing = await prisma.location.findUnique({
      where: { id: idParsed.data.id },
      select: { createdById: true },
    });

    if (!existing) return jsonError('Location not found', 404);
    if (existing.createdById !== session.user.id) {
      return jsonError('Forbidden', 403);
    }

    const updated = await prisma.location.update({
      where: { id: idParsed.data.id },
      data: {
        name: input.name,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        type: input.type,
        priceType: input.priceType,
        priceAmount: input.priceAmount,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return jsonOk(serializeLocation(updated));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const params = await ctx.params;
    const idParsed = idParamSchema.safeParse(params);
    if (!idParsed.success) return jsonError('Invalid id', 422);

    const existing = await prisma.location.findUnique({
      where: { id: idParsed.data.id },
      select: { createdById: true },
    });

    if (!existing) return jsonError('Location not found', 404);
    if (existing.createdById !== session.user.id) {
      return jsonError('Forbidden', 403);
    }

    await prisma.location.delete({
      where: { id: idParsed.data.id },
    });

    return jsonOk({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}

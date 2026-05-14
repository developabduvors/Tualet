import type { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createReviewSchema } from '@/lib/validation';
import { requireSession } from '@/lib/auth';
import { handleApiError, jsonError, jsonOk } from '@/lib/api';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const input = createReviewSchema.parse(body);

    const location = await prisma.location.findUnique({
      where: { id: input.locationId },
      select: { id: true },
    });
    if (!location) return jsonError('Location not found', 404);

    const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const review = await tx.review.create({
        data: {
          locationId: input.locationId,
          userId: session.user.id,
          rating: input.rating,
          comment: input.comment,
          images: input.images,
        },
      });

      const agg = await tx.review.aggregate({
        where: { locationId: input.locationId },
        _avg: { rating: true },
        _count: { _all: true },
      });

      await tx.location.update({
        where: { id: input.locationId },
        data: {
          rating: agg._avg.rating ?? 0,
          reviewCount: agg._count._all,
        },
      });

      return review;
    });

    return jsonOk(created, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

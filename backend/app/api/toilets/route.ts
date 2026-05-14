import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { addLocationSchema } from '@/lib/validation';
import { handleApiError, jsonError, jsonOk } from '@/lib/api';

export const runtime = 'nodejs';

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
  };
}

export async function GET(request: NextRequest) {
  try {
    const ownerId = request.nextUrl.searchParams.get('ownerId');
    const mine = request.nextUrl.searchParams.get('mine');

    let createdById: string | undefined;
    if (mine === '1' || mine === 'true') {
      const session = await requireSession();
      createdById = session.user.id;
    } else if (ownerId) {
      createdById = ownerId;
    }

    const locations = await prisma.location.findMany({
      where: createdById ? { createdById } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return jsonOk(locations.map(serializeLocation));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const input = addLocationSchema.parse(body);

    const created = await prisma.location.create({
      data: {
        name: input.name,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        type: input.type,
        priceType: input.priceType,
        priceAmount: input.priceAmount,
        createdById: session.user.id,
      },
    });

    if (!created) return jsonError('Failed to create location', 500);

    return jsonOk(serializeLocation(created), 201);
  } catch (err) {
    return handleApiError(err);
  }
}

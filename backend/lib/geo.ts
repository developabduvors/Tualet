import { prisma } from '@/lib/prisma';
import type { LocationType, PriceType } from '@/types';

export const EARTH_RADIUS_KM = 6371;
export const DEFAULT_RADIUS_KM = 5;
export const MAX_RADIUS_KM = 50;

export interface NearbyQuery {
  lat: number;
  lng: number;
  radiusKm?: number;
  type?: LocationType;
  priceType?: PriceType;
  page?: number;
  pageSize?: number;
}

export interface NearbyResult {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: LocationType;
  priceType: PriceType;
  priceAmount: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
}

export interface PagedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

type DbLocation = Awaited<ReturnType<typeof prisma.location.findMany>>[number];

export function haversineKm(
  lat1: number, lng1: number, lat2: number, lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.asin(Math.sqrt(a));
}

export async function findNearby(
  q: NearbyQuery
): Promise<PagedResult<NearbyResult>> {
  const radiusKm = Math.min(q.radiusKm ?? DEFAULT_RADIUS_KM, MAX_RADIUS_KM);
  const page = Math.max(1, q.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, q.pageSize ?? 20));

  const locations = await prisma.location.findMany({
    where: {
      ...(q.type ? { type: q.type } : {}),
      ...(q.priceType ? { priceType: q.priceType } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  const mapped: NearbyResult[] = locations
    .map((location: DbLocation) => ({
      id: location.id,
      name: location.name,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      type: location.type as LocationType,
      priceType: location.priceType as PriceType,
      priceAmount: location.priceAmount.toString(),
      rating: location.rating,
      reviewCount: location.reviewCount,
      distanceKm: haversineKm(q.lat, q.lng, location.latitude, location.longitude),
    }));

  const nearby = mapped
    .filter((location: NearbyResult) => location.distanceKm <= radiusKm)
    .sort((a: NearbyResult, b: NearbyResult) => a.distanceKm - b.distanceKm);

  const total = nearby.length;
  const start = (page - 1) * pageSize;
  const data = nearby.slice(start, start + pageSize).map((location) => ({
    ...location,
    distanceKm: Number(location.distanceKm.toFixed(3)),
  }));

  return {
    data,
    page,
    pageSize,
    total,
    hasMore: start + data.length < total,
  };
}

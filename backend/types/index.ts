export type LocationType = 'public' | 'mall' | 'fuel';
export type PriceType = 'free' | 'paid';

export interface UserPublic {
  id: string;
  name: string | null;
  image: string | null;
}

export interface Review {
  id: string;
  locationId: string;
  userId: string;
  rating: number;
  comment: string;
  images: string[];
  createdAt: string | Date;
  user?: UserPublic;
}

export interface Toilet {
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
  createdById: string | null;
  createdAt: string | Date;
}

export interface Paged<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface Coords {
  lat: number;
  lng: number;
}

export interface NearbyFilters {
  radiusKm: number;
  type?: LocationType;
  priceType?: PriceType;
}

export type NearbyResponse = Paged<
  Toilet & {
    distanceKm: number;
  }
>;

export interface ToiletByIdResponse {
  location: Toilet;
  reviews: Paged<Review>;
}

export interface AddToiletRequest {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type?: LocationType;
  priceType?: PriceType;
  priceAmount?: number;
}

export type AddToiletResponse = Toilet;

export interface CreateReviewRequest {
  locationId: string;
  rating: number;
  comment: string;
  images?: string[];
}

export type CreateReviewResponse = Review;

export type ToiletFull = ToiletByIdResponse;
export type ToiletDetail = ToiletByIdResponse;

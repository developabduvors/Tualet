import type {
  AddToiletRequest,
  AddToiletResponse,
  Coords,
  CreateReviewRequest,
  CreateReviewResponse,
  NearbyFilters,
  NearbyResponse,
  ToiletByIdResponse,
} from '@/types';

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail: unknown;
    try {
      detail = await res.json();
    } catch {
      /* ignore */
    }
    const msg =
      detail && typeof detail === 'object' && 'error' in detail
        ? (detail as { error: string }).error
        : res.statusText;
    throw new Error(`API ${res.status}: ${msg}`);
  }
  const body = (await res.json()) as { data: T };
  return body.data;
}

export const api = {
  async nearby(
    coords: Coords,
    filters: NearbyFilters,
    page = 1,
    pageSize = 20
  ): Promise<NearbyResponse> {
    const params = new URLSearchParams({
      lat: String(coords.lat),
      lng: String(coords.lng),
      radius: String(filters.radiusKm),
      page: String(page),
      pageSize: String(pageSize),
    });
    if (filters.type) params.set('type', filters.type);
    if (filters.priceType) params.set('priceType', filters.priceType);
    const res = await fetch(`/api/toilets/nearby?${params.toString()}`);
    return unwrap<NearbyResponse>(res);
  },

  async getById(id: string, page = 1): Promise<ToiletByIdResponse> {
    const res = await fetch(`/api/toilets/${id}?page=${page}`);
    return unwrap<ToiletByIdResponse>(res);
  },

  async addToilet(input: AddToiletRequest): Promise<AddToiletResponse> {
    const res = await fetch('/api/toilets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return unwrap<AddToiletResponse>(res);
  },

  async createReview(
    input: CreateReviewRequest
  ): Promise<CreateReviewResponse> {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return unwrap<CreateReviewResponse>(res);
  },
};

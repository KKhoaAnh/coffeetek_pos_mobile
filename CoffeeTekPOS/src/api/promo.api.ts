import axiosClient from './axiosClient';

export type DiscountType = 'percent' | 'fixed';
export type ApplyTo = 'BILL' | 'CATEGORY' | 'PRODUCT';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface PromotionDto {
  promo_id: number;
  promo_name: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  apply_to: ApplyTo;
  min_order_amount: number;
  start_date: string;
  end_date: string;
  days_of_week: number[] | null;
  time_start: string | null;
  time_end: string | null;
  is_active: boolean | number;
  // Danh sách liên kết
  product_ids: number[];
  category_ids: number[];
}

export interface PromotionPayload {
  promo_name: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  apply_to: ApplyTo;
  min_order_amount?: number;
  product_ids?: number[];
  category_ids?: number[];
  start_date: string;
  end_date: string;
  days_of_week: DayOfWeek[];
  time_start: string | null;
  time_end: string | null;
  is_active: boolean;
}

export const promoApi = {
  getAll: () => axiosClient.get<PromotionDto[]>('/promotions'),

  getById: (id: number | string) => axiosClient.get<PromotionDto>(`/promotions/${id}`),

  create: (payload: PromotionPayload) => axiosClient.post('/promotions', payload),

  update: (id: number | string, payload: PromotionPayload) =>
    axiosClient.put(`/promotions/${id}`, payload),

  toggleActive: (id: number | string, isActive: boolean) =>
    axiosClient.patch(`/promotions/${id}/active`, { is_active: isActive }),
};

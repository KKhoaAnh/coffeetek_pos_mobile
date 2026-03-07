import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { promoApi, DiscountType, ApplyTo, DayOfWeek, PromotionDto, PromotionPayload } from '../api/promo.api';

export type { DiscountType, ApplyTo, DayOfWeek };

export interface Promotion {
  id: string;
  name: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  /** Phạm vi: 'BILL' = tổng đơn, 'CATEGORY' = nhóm món, 'PRODUCT' = món cụ thể */
  applyTo: ApplyTo;
  /** Đơn tối thiểu (chỉ cho BILL) */
  minOrderAmount: number;
  /** Danh sách product_id được áp dụng (khi applyTo = 'PRODUCT') */
  productIds: number[];
  /** Danh sách category_id được áp dụng (khi applyTo = 'CATEGORY') */
  categoryIds: number[];
  /** ISO date YYYY-MM-DD */
  startDate: string;
  /** ISO date YYYY-MM-DD */
  endDate: string;
  /** Rỗng = áp dụng mọi ngày */
  daysOfWeek: DayOfWeek[];
  /** HH:mm hoặc null = cả ngày */
  timeStart: string | null;
  /** HH:mm hoặc null = cả ngày */
  timeEnd: string | null;
  is_active: boolean;
}

const DAY_LABELS: Record<DayOfWeek, string> = {
  0: 'CN',
  1: 'T2',
  2: 'T3',
  3: 'T4',
  4: 'T5',
  5: 'T6',
  6: 'T7',
};

interface PromoState {
  promotions: Promotion[];
  loading: boolean;
  error: string | null;
  fetchPromotions: () => Promise<void>;
  addPromo: (p: Omit<Promotion, 'id'>) => Promise<void>;
  updatePromo: (id: string, p: Omit<Promotion, 'id'>) => Promise<void>;
  toggleActive: (id: string) => Promise<void>;
  getPromo: (id: string) => Promotion | undefined;
  getDayLabel: (d: DayOfWeek) => string;
}

export const getDayLabel = (d: DayOfWeek) => DAY_LABELS[d];

const mapDtoToPromotion = (dto: PromotionDto): Promotion => {
  return {
    id: String(dto.promo_id),
    name: dto.promo_name,
    description: dto.description || '',
    discountType: dto.discount_type,
    discountValue: dto.discount_value,
    applyTo: dto.apply_to || 'BILL',
    minOrderAmount: dto.min_order_amount || 0,
    productIds: dto.product_ids || [],
    categoryIds: dto.category_ids || [],
    startDate: dto.start_date,
    endDate: dto.end_date,
    daysOfWeek: (dto.days_of_week || []) as DayOfWeek[],
    timeStart: dto.time_start,
    timeEnd: dto.time_end,
    is_active: dto.is_active === true || dto.is_active === 1,
  };
};

const mapPromotionToPayload = (p: Omit<Promotion, 'id'>): PromotionPayload => {
  return {
    promo_name: p.name,
    description: p.description,
    discount_type: p.discountType,
    discount_value: p.discountValue,
    apply_to: p.applyTo || 'BILL',
    min_order_amount: p.minOrderAmount || 0,
    product_ids: p.productIds || [],
    category_ids: p.categoryIds || [],
    start_date: p.startDate,
    end_date: p.endDate,
    days_of_week: p.daysOfWeek,
    time_start: p.timeStart,
    time_end: p.timeEnd,
    is_active: p.is_active,
  };
};

export const usePromoStore = create<PromoState>()(
  persist(
    (set, get) => ({
      promotions: [],
      loading: false,
      error: null,

      fetchPromotions: async () => {
        try {
          set({ loading: true, error: null });
          const res = await promoApi.getAll();
          const data = Array.isArray(res.data) ? res.data : [];
          set({
            promotions: data.map(mapDtoToPromotion),
            loading: false,
            error: null,
          });
        } catch (error: any) {
          set({ loading: false, error: error?.message || 'Lỗi tải khuyến mãi' });
        }
      },

      addPromo: async (p) => {
        try {
          const payload = mapPromotionToPayload(p);
          const res = await promoApi.create(payload);
          const created = mapDtoToPromotion(res.data as PromotionDto);
          set((s) => ({ promotions: [created, ...s.promotions] }));
        } catch (error: any) {
          set({ error: error?.message || 'Lỗi tạo khuyến mãi' });
        }
      },

      updatePromo: async (id, p) => {
        try {
          const payload = mapPromotionToPayload(p);
          const numericId = Number(id);
          const res = await promoApi.update(numericId, payload);
          const updated = mapDtoToPromotion(res.data as PromotionDto);
          set((s) => ({
            promotions: s.promotions.map((x) => (x.id === id ? updated : x)),
          }));
        } catch (error: any) {
          set({ error: error?.message || 'Lỗi cập nhật khuyến mãi' });
        }
      },

      toggleActive: async (id) => {
        try {
          const current = get().getPromo(id);
          if (!current) return;
          const nextActive = !current.is_active;
          await promoApi.toggleActive(Number(id), nextActive);
          set((s) => ({
            promotions: s.promotions.map((x) =>
              x.id === id ? { ...x, is_active: nextActive } : x
            ),
          }));
        } catch (error: any) {
          set({ error: error?.message || 'Lỗi cập nhật trạng thái khuyến mãi' });
        }
      },

      getPromo: (id) => get().promotions.find((x) => x.id === id),
      getDayLabel: (d) => DAY_LABELS[d],
    }),
    { name: 'promo-storage', storage: createJSONStorage(() => AsyncStorage) }
  )
);

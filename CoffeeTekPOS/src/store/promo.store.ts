import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type DiscountType = 'percent' | 'fixed';

/** 0=CN, 1=T2, 2=T3, ... 6=T7 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Promotion {
  id: string;
  name: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  /** ISO date YYYY-MM-DD */
  startDate: string;
  /** ISO date YYYY-MM-DD */
  endDate: string;
  /** Rỗng = áp dụng mọi ngày; có phần tử = chỉ áp dụng các thứ đã chọn */
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

const today = new Date();
const nextMonth = new Date(today);
nextMonth.setMonth(nextMonth.getMonth() + 1);

const formatDate = (d: Date) => d.toISOString().slice(0, 10);

const DEFAULT_PROMOS: Promotion[] = [
  {
    id: '1',
    name: 'Happy Hour 14h-17h',
    description: 'Giảm 20% từ 14h đến 17h các ngày trong tuần',
    discountType: 'percent',
    discountValue: 20,
    startDate: formatDate(today),
    endDate: formatDate(nextMonth),
    daysOfWeek: [1, 2, 3, 4, 5],
    timeStart: '14:00',
    timeEnd: '17:00',
    is_active: true,
  },
  {
    id: '2',
    name: 'Cuối tuần Free size M',
    description: 'Mua 2 tặng 1 size M vào thứ 7, Chủ nhật',
    discountType: 'percent',
    discountValue: 33,
    startDate: formatDate(today),
    endDate: formatDate(nextMonth),
    daysOfWeek: [6, 0],
    timeStart: null,
    timeEnd: null,
    is_active: true,
  },
];

interface PromoState {
  promotions: Promotion[];
  addPromo: (p: Omit<Promotion, 'id'>) => void;
  updatePromo: (id: string, p: Partial<Promotion>) => void;
  removePromo: (id: string) => void;
  toggleActive: (id: string) => void;
  getPromo: (id: string) => Promotion | undefined;
  getDayLabel: (d: DayOfWeek) => string;
}

export const getDayLabel = (d: DayOfWeek) => DAY_LABELS[d];

export const usePromoStore = create<PromoState>()(
  persist(
    (set, get) => ({
      promotions: DEFAULT_PROMOS,

      addPromo: (p) => {
        const id = Date.now().toString();
        set((s) => ({ promotions: [...s.promotions, { ...p, id }] }));
      },

      updatePromo: (id, p) => {
        set((s) => ({
          promotions: s.promotions.map((x) => (x.id === id ? { ...x, ...p } : x)),
        }));
      },

      removePromo: (id) => {
        set((s) => ({ promotions: s.promotions.filter((x) => x.id !== id) }));
      },

      toggleActive: (id) => {
        set((s) => ({
          promotions: s.promotions.map((x) =>
            x.id === id ? { ...x, is_active: !x.is_active } : x
          ),
        }));
      },

      getPromo: (id) => get().promotions.find((x) => x.id === id),
      getDayLabel: (d) => DAY_LABELS[d],
    }),
    { name: 'promo-storage', storage: createJSONStorage(() => AsyncStorage) }
  )
);

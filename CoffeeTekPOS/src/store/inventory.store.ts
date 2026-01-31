import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type InventoryUnit = 'goi' | 'bich' | 'kg' | 'gam';

export interface RawInventoryItem {
  id: string;
  name: string;
  unit: InventoryUnit;
  quantity: number;
  icon?: string; // MaterialCommunityIcons name
}

const UNIT_LABELS: Record<InventoryUnit, string> = {
  goi: 'Gói',
  bich: 'Bịch',
  kg: 'Kg',
  gam: 'Gam',
};

const DEFAULT_ITEMS: RawInventoryItem[] = [
  { id: '1', name: 'Sữa tươi', unit: 'bich', quantity: 24, icon: 'cup' },
  { id: '2', name: 'Sữa đặc', unit: 'bich', quantity: 12, icon: 'bottle-tonic-plus' },
  { id: '3', name: 'Cà phê rang xay', unit: 'kg', quantity: 5, icon: 'coffee' },
  { id: '4', name: 'Cà phê hòa tan', unit: 'goi', quantity: 20, icon: 'coffee-outline' },
  { id: '5', name: 'Đường', unit: 'kg', quantity: 10, icon: 'sack-percent' },
  { id: '6', name: 'Syrup', unit: 'bich', quantity: 8, icon: 'bottle-tonic' },
  { id: '7', name: 'Trà sữa bột', unit: 'goi', quantity: 15, icon: 'tea' },
  { id: '8', name: 'Kem béo', unit: 'bich', quantity: 6, icon: 'ice-cream' },
];

interface InventoryState {
  items: RawInventoryItem[];
  addItem: (item: Omit<RawInventoryItem, 'id'>) => boolean;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  setQuantity: (id: string, value: number) => void;
  getUnitLabel: (unit: InventoryUnit) => string;
  hasItemByName: (name: string) => boolean;
}

export const getUnitLabel = (unit: InventoryUnit) => UNIT_LABELS[unit];

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      items: DEFAULT_ITEMS,

      hasItemByName: (name) => {
        const n = name.trim().toLowerCase();
        return get().items.some((i) => i.name.trim().toLowerCase() === n);
      },

      addItem: (item) => {
        const n = item.name.trim().toLowerCase();
        if (get().items.some((i) => i.name.trim().toLowerCase() === n)) {
          return false;
        }
        const id = Date.now().toString();
        set((state) => ({
          items: [...state.items, { ...item, id }],
        }));
        return true;
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      updateQuantity: (id, delta) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
          ),
        }));
      },

      setQuantity: (id, value) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(0, value) } : i
          ),
        }));
      },

      getUnitLabel: (unit) => UNIT_LABELS[unit],
    }),
    {
      name: 'inventory-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

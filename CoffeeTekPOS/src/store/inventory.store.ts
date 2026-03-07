import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { inventoryApi, InventoryItemDto, InventoryItemPayload, InventoryTransactionDto } from '../api/inventory.api';

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;               // Đơn vị cơ bản (lon, chai, kg...)
  importUnit: string | null;   // Đơn vị nhập (Thùng, Bao, Lốc)
  conversionFactor: number;    // 1 importUnit = ? unit
  minStockLevel: number;       // Mức tối thiểu
  linkedProductId: number | null;
  linkedProductName: string | null;
  quantity: number;
  isLowStock: boolean;
  isActive: boolean;
}

export interface InventoryTransaction {
  id: number;
  itemId: number;
  itemName: string;
  type: 'IMPORT' | 'EXPORT_MANUAL' | 'EXPORT_AUTO' | 'ADJUST';
  quantity: number;
  importUnit: string | null;
  importQuantity: number | null;
  stockAfter: number;
  orderRef: number | null;
  userName: string | null;
  note: string | null;
  createdAt: string;
}

// Label đơn vị cơ bản
const UNIT_LABELS: Record<string, string> = {
  goi: 'Gói', lon: 'Lon', chai: 'Chai', kg: 'Kg', gam: 'Gam',
  hop: 'Hộp', cai: 'Cái', lit: 'Lít',
};

// Label đơn vị nhập
const IMPORT_UNIT_LABELS: Record<string, string> = {
  thung: 'Thùng', bao: 'Bao', loc: 'Lốc', ket: 'Két', binh: 'Bình',
};

// Label loại giao dịch
const TYPE_LABELS: Record<string, string> = {
  IMPORT: 'Nhập kho',
  EXPORT_MANUAL: 'Xuất thủ công',
  EXPORT_AUTO: 'Xuất tự động',
  ADJUST: 'Điều chỉnh',
};

interface InventoryState {
  items: InventoryItem[];
  lowStockItems: InventoryItem[];
  loading: boolean;
  error: string | null;

  fetchItems: () => Promise<void>;
  fetchLowStock: () => Promise<void>;
  addItem: (payload: InventoryItemPayload) => Promise<boolean>;
  updateItem: (id: string, payload: InventoryItemPayload) => Promise<boolean>;
  importStock: (id: string, qty: number, useImportUnit: boolean, note: string, userId?: number) => Promise<string | null>;
  exportStock: (id: string, qty: number, note: string, userId?: number) => Promise<string | null>;
  getHistory: (id: string) => Promise<InventoryTransaction[]>;
  getUnitLabel: (unit: string) => string;
  getImportUnitLabel: (unit: string) => string;
  getTypeLabel: (type: string) => string;
}

export const getUnitLabel = (unit: string) => UNIT_LABELS[unit] || unit;
export const getImportUnitLabel = (unit: string) => IMPORT_UNIT_LABELS[unit] || unit;
export const getTypeLabel = (type: string) => TYPE_LABELS[type] || type;

const mapDtoToItem = (dto: InventoryItemDto): InventoryItem => ({
  id: String(dto.item_id),
  name: dto.item_name,
  unit: dto.unit,
  importUnit: dto.import_unit,
  conversionFactor: dto.conversion_factor || 1,
  minStockLevel: dto.min_stock_level || 0,
  linkedProductId: dto.linked_product_id,
  linkedProductName: dto.linked_product_name,
  quantity: Number(dto.quantity || 0),
  isLowStock: dto.is_low_stock === true,
  isActive: dto.is_active === true,
});

const mapTransaction = (dto: InventoryTransactionDto): InventoryTransaction => ({
  id: dto.transaction_id,
  itemId: dto.item_id,
  itemName: dto.item_name,
  type: dto.type,
  quantity: dto.quantity,
  importUnit: dto.import_unit,
  importQuantity: dto.import_quantity,
  stockAfter: dto.stock_after,
  orderRef: dto.reference_order_id,
  userName: dto.user_name,
  note: dto.note,
  createdAt: dto.created_at,
});

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      items: [],
      lowStockItems: [],
      loading: false,
      error: null,

      fetchItems: async () => {
        try {
          set({ loading: true, error: null });
          const res = await inventoryApi.getAll(false);
          const data = Array.isArray(res.data) ? res.data : [];
          set({ items: data.map(mapDtoToItem), loading: false });
        } catch (error: any) {
          set({ loading: false, error: error?.message || 'Lỗi tải kho' });
        }
      },

      fetchLowStock: async () => {
        try {
          const res = await inventoryApi.getLowStock();
          const data = Array.isArray(res.data) ? res.data : [];
          set({ lowStockItems: data.map(mapDtoToItem) });
        } catch (error: any) {
          console.error('Lỗi fetchLowStock:', error);
        }
      },

      addItem: async (payload) => {
        try {
          const res = await inventoryApi.create(payload);
          const created = mapDtoToItem(res.data as InventoryItemDto);
          set((s) => ({ items: [created, ...s.items] }));
          return true;
        } catch (error: any) {
          set({ error: error?.response?.data?.message || 'Lỗi tạo mặt hàng' });
          return false;
        }
      },

      updateItem: async (id, payload) => {
        try {
          const res = await inventoryApi.update(Number(id), payload);
          const updated = mapDtoToItem(res.data as InventoryItemDto);
          set((s) => ({
            items: s.items.map((i) => (i.id === id ? updated : i)),
          }));
          return true;
        } catch (error: any) {
          set({ error: error?.response?.data?.message || 'Lỗi cập nhật' });
          return false;
        }
      },

      importStock: async (id, qty, useImportUnit, note, userId) => {
        try {
          const res = await inventoryApi.importStock(Number(id), {
            quantity: qty,
            use_import_unit: useImportUnit,
            note,
            user_id: userId,
          });
          const updatedItem = mapDtoToItem(res.data.item as InventoryItemDto);
          set((s) => ({
            items: s.items.map((i) => (i.id === id ? updatedItem : i)),
          }));
          return res.data.message || 'Nhập kho thành công';
        } catch (error: any) {
          return null;
        }
      },

      exportStock: async (id, qty, note, userId) => {
        try {
          const res = await inventoryApi.exportStock(Number(id), {
            quantity: qty,
            note,
            user_id: userId,
          });
          const updatedItem = mapDtoToItem(res.data.item as InventoryItemDto);
          set((s) => ({
            items: s.items.map((i) => (i.id === id ? updatedItem : i)),
          }));
          return res.data.message || 'Xuất kho thành công';
        } catch (error: any) {
          return null;
        }
      },

      getHistory: async (id) => {
        try {
          const res = await inventoryApi.getHistory(Number(id));
          const data = Array.isArray(res.data) ? res.data : [];
          return data.map(mapTransaction);
        } catch (error: any) {
          return [];
        }
      },

      getUnitLabel: (unit) => UNIT_LABELS[unit] || unit,
      getImportUnitLabel: (unit) => IMPORT_UNIT_LABELS[unit] || unit,
      getTypeLabel: (type) => TYPE_LABELS[type] || type,
    }),
    {
      name: 'inventory-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items, lowStockItems: state.lowStockItems }),
    }
  )
);

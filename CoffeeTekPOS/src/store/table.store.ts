import { create } from 'zustand';
import { tableApi } from '../api/table.api';

// Interface khớp với DB MySQL bạn cung cấp
export interface Table {
  table_id: number;
  table_name: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING'; // AVAILABLE: Trống, OCCUPIED: Có khách
  current_order_id?: number;
  shape?: 'SQUARE' | 'CIRCLE' | 'RECTANGLE';
  color?: string; // Mã màu hex (nếu user set)
  width?: number;
  height?: number;
}

interface TableState {
  tables: Table[];
  isLoading: boolean;
  loadTables: () => Promise<void>;
}

export const useTableStore = create<TableState>((set) => ({
  tables: [],
  isLoading: false,

  loadTables: async () => {
    set({ isLoading: true });
    try {
      const res = await tableApi.getTables();
      set({ tables: res.data });
    } catch (error) {
      console.error("Lỗi load bàn:", error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
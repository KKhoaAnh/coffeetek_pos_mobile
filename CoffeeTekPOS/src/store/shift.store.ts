import { create } from 'zustand';
import { shiftApi } from '../api/shift.api';

// Định nghĩa kiểu dữ liệu Ca làm việc (Khớp với DB)
export interface Shift {
  shift_id: number;
  user_id: number;
  user_name?: string;
  start_time: string;
  end_time?: string;
  initial_float: number;
  status: 'OPEN' | 'CLOSED';
  total_cash_sales?: number;
  expected_cash?: number;
  actual_cash?: number;
  difference?: number;
  note?: string;
}

interface ShiftState {
  todayShifts: Shift[];     // Danh sách lịch sử ca
  currentShift: Shift | null; // Ca đang mở (nếu có)
  isLoading: boolean;
  
  // Actions
  loadTodayShifts: (userId: number) => Promise<void>;
  openShift: (userId: number, float: number, note: string) => Promise<boolean>;
  closeShift: (actualCash: number, note: string) => Promise<any>; // Trả về data để in
}

export const useShiftStore = create<ShiftState>((set, get) => ({
  todayShifts: [],
  currentShift: null,
  isLoading: false,

  loadTodayShifts: async (userId: number) => {
    set({ isLoading: true });
    try {
      const res = await shiftApi.getTodayShifts(userId);
      const shifts: Shift[] = res.data;
      
      // Tìm ca đang mở (nếu có)
      const openOne = shifts.find(s => s.status === 'OPEN') || null;
      
      set({ todayShifts: shifts, currentShift: openOne });
    } catch (error) {
      console.error("Lỗi load ca:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  openShift: async (userId, float, note) => {
    set({ isLoading: true });
    try {
      await shiftApi.openShift(userId, float, note);
      await get().loadTodayShifts(userId); // Reload lại danh sách
      return true;
    } catch (error) {
      console.error("Lỗi mở ca:", error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  closeShift: async (actualCash, note) => {
    const current = get().currentShift;
    if (!current) return null;

    set({ isLoading: true });
    try {
      const res = await shiftApi.closeShift(current.shift_id, actualCash, note);
      
      // Reload lại danh sách sau khi đóng
      await get().loadTodayShifts(current.user_id);
      
      return res.data; // Trả về cục data (gồm user_name, sales...) để In Bill
    } catch (error) {
      console.error("Lỗi đóng ca:", error);
      return null;
    } finally {
      set({ isLoading: false });
    }
  }
}));
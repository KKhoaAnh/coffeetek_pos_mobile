import axiosClient from './axiosClient';

export const shiftApi = {
  // 1. Lấy danh sách ca trong ngày
  getTodayShifts: (userId: number) => {
    return axiosClient.get(`/shifts/today?userId=${userId}`);
  },

  // 2. Lấy thông tin tóm tắt (để chốt ca)
  getShiftSummary: (shiftId: number) => {
    return axiosClient.get(`/shifts/summary?shiftId=${shiftId}`);
  },

  // 3. Mở ca
  openShift: (userId: number, initialFloat: number, note?: string) => {
    return axiosClient.post('/shifts/open', {
      user_id: userId,
      initial_float: initialFloat,
      note: note
    });
  },

  // 4. Đóng ca
  closeShift: (shiftId: number, actualCash: number, note?: string) => {
    return axiosClient.post('/shifts/close', {
      shift_id: shiftId,
      actual_cash: actualCash,
      note: note
    });
  }
};
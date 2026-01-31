import axiosClient from './axiosClient';

export const reportApi = {
  // Lấy tổng quan (Revenue, Orders...)
  getSummary: (startDate: string, endDate: string) => {
    return axiosClient.get('/reports/summary', { params: { startDate, endDate } });
  },

  // Lấy báo cáo theo danh mục
  getByCategory: (startDate: string, endDate: string) => {
    return axiosClient.get('/reports/category', { params: { startDate, endDate } });
  },

  // Lấy báo cáo theo món ăn
  getByProduct: (startDate: string, endDate: string) => {
    return axiosClient.get('/reports/product', { params: { startDate, endDate } });
  }
};
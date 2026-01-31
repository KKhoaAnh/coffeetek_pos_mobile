import axiosClient from './axiosClient';

export const tableApi = {
  getTables: () => {
    return axiosClient.get('/tables?active_only=true');
  },

  moveTable: (orderId: number, targetTableId: number) => {
    return axiosClient.post('/tables/move', { orderId, targetTableId });
  },

  mergeTable: (sourceOrderId: number, targetTableId: number) => {
    return axiosClient.post('/tables/merge', { sourceOrderId, targetTableId });
  }
};
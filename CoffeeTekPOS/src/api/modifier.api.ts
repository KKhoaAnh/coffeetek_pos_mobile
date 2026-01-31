import axiosClient from './axiosClient';

export const modifierApi = {
  // Lấy toàn bộ (Dạng cây Group -> Modifiers)
  getAll: () => {
    return axiosClient.get('/modifiers');
  },

  // Tạo nhóm mới
  createGroup: (data: { group_name: string; is_multi_select: boolean; is_required: boolean }) => {
    return axiosClient.post('/modifiers/groups', data);
  },

  // Tạo topping mới
  createModifier: (data: { modifier_name: string; group_id: number; extra_price: number; is_input_required?: boolean }) => {
    return axiosClient.post('/modifiers', data);
  },

  // Cập nhật topping
  updateModifier: (id: number, data: { modifier_name: string; extra_price: number }) => {
    return axiosClient.put(`/modifiers/${id}`, data);
  },

  // Xóa topping
  deleteModifier: (id: number) => {
    return axiosClient.delete(`/modifiers/${id}`);
  }
};
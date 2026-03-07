import axiosClient from './axiosClient';

// Đơn vị cơ bản (lưu kho)
export type InventoryUnit = 'goi' | 'lon' | 'chai' | 'kg' | 'gam' | 'hop' | 'cai';

export interface InventoryItemDto {
  item_id: number;
  item_name: string;
  unit: string;              // Đơn vị cơ bản
  import_unit: string | null; // Đơn vị nhập (Thùng, Bao, Lốc)
  conversion_factor: number;  // 1 import_unit = ? unit
  min_stock_level: number;    // Cảnh báo khi <= giá trị này 
  linked_product_id: number | null;
  linked_product_name: string | null;
  quantity: number;
  is_low_stock: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryItemPayload {
  item_name: string;
  unit: string;
  import_unit?: string | null;
  conversion_factor?: number;
  min_stock_level?: number;
  linked_product_id?: number | null;
  quantity?: number;
  is_active?: boolean;
}

export interface InventoryTransactionDto {
  transaction_id: number;
  item_id: number;
  item_name: string;
  type: 'IMPORT' | 'EXPORT_MANUAL' | 'EXPORT_AUTO' | 'ADJUST';
  quantity: number;
  import_unit: string | null;
  import_quantity: number | null;
  stock_after: number;
  reference_order_id: number | null;
  created_by_user_id: number | null;
  user_name: string | null;
  note: string | null;
  created_at: string;
}

export const inventoryApi = {
  // Danh sách mặt hàng
  getAll: (activeOnly = false) =>
    axiosClient.get<InventoryItemDto[]>('/inventory', {
      params: activeOnly ? { activeOnly: true } : undefined,
    }),

  // Danh sách hàng sắp hết (cảnh báo)
  getLowStock: () =>
    axiosClient.get<InventoryItemDto[]>('/inventory/low-stock'),

  // Tạo mặt hàng mới
  create: (payload: InventoryItemPayload) =>
    axiosClient.post('/inventory', payload),

  // Cập nhật thông tin mặt hàng (không đổi số lượng)
  update: (id: number | string, payload: InventoryItemPayload) =>
    axiosClient.put(`/inventory/${id}`, payload),

  // Bật/tắt
  toggleStatus: (id: number | string, isActive: boolean) =>
    axiosClient.patch(`/inventory/${id}/status`, { is_active: isActive }),

  // NHẬP KHO (có hỗ trợ quy đổi đơn vị)
  importStock: (id: number | string, data: {
    quantity: number;
    use_import_unit?: boolean;
    note?: string;
    user_id?: number;
  }) => axiosClient.post(`/inventory/${id}/import`, data),

  // XUẤT KHO THỦ CÔNG
  exportStock: (id: number | string, data: {
    quantity: number;
    note?: string;
    user_id?: number;
  }) => axiosClient.post(`/inventory/${id}/export`, data),

  // Lịch sử giao dịch
  getHistory: (id: number | string, limit = 50) =>
    axiosClient.get<InventoryTransactionDto[]>(`/inventory/${id}/history`, {
      params: { limit },
    }),
};

import axiosClient from './axiosClient';

export const managerApi = {
  // --- QUẢN LÝ BÀN ---
  getTables: () => axiosClient.get('/tables'),
  
  createTable: (data: any) => axiosClient.post('/tables', data),
  
  // [SỬA] Route update bàn phải là /:id/info
  updateTable: (id: number, data: any) => axiosClient.put(`/tables/${id}/info`, data),
  
  deleteTable: (id: number) => axiosClient.delete(`/tables/${id}`),

  // --- QUẢN LÝ NHÂN VIÊN ---
  
  // [SỬA] Mapping dữ liệu từ Backend (user_id -> id, full_name -> fullName)
  getEmployees: async () => {
    const res = await axiosClient.get('/users');
    // Chuyển đổi dữ liệu ngay khi nhận về
    const mappedData = res.data.map((u: any) => ({
        id: u.user_id,            // Backend trả user_id
        fullName: u.full_name,    // Backend trả full_name
        username: u.username,
        role: u.role,
        pin: u.pin_code,          // Backend trả pin_code
        is_active: u.is_active
    }));
    return { data: mappedData }; // Giả lập cấu trúc response của axios
  },

  // [SỬA] Payload gửi lên phải dùng snake_case (full_name, pin_code)
  createEmployee: (data: any) => {
    const payload = {
        full_name: data.fullName,
        pin_code: data.pin,
        role: data.role,
        username: data.fullName // Tạm dùng tên làm username
    };
    return axiosClient.post('/users', payload);
  },

  updateEmployee: (id: number, data: any) => {
    const payload = {
        full_name: data.fullName,
        pin_code: data.pin,
        role: data.role
    };
    return axiosClient.put(`/users/${id}`, payload);
  },

  // [SỬA] Dùng PATCH và route /status
  toggleEmployeeStatus: (id: number, isActive: boolean) => {
    return axiosClient.patch(`/users/${id}/status`, { is_active: isActive });
  },
};
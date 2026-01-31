import axiosClient from './axiosClient';

export const authApi = {
  // Gọi endpoint login-pin chúng ta vừa tạo ở Bước 1
  loginWithPin: (pin: string) => {
    return axiosClient.post('/auth/login', { pin });
  },
};
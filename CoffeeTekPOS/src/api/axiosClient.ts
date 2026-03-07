import axios from 'axios';
import { AppConstants } from '../constants/app.constant';
import { useAuthStore } from '../store/auth.store';

const axiosClient = axios.create({
  baseURL: AppConstants.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Gắn JWT vào mọi request (trừ khi chưa đăng nhập)
axiosClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor để xử lý lỗi chung; 401 → logout để user phải đăng nhập lại
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    if (error.response) {
      console.log('API Error:', error.response.data);
    } else {
      console.log('Network Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
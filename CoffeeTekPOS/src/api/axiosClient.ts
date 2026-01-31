import axios from 'axios';
import { AppConstants } from '../constants/app.constant';

const axiosClient = axios.create({
  baseURL: AppConstants.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor để xử lý lỗi chung
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      console.log('API Error:', error.response.data);
    } else {
      console.log('Network Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
import axiosClient from './axiosClient';

export const menuApi = {
  // Lấy danh sách danh mục
  getCategories: () => {
    return axiosClient.get('/categories');
  },
  
  // Lấy toàn bộ sản phẩm (Backend của bạn đã join sẵn category, rất tiện!)
  getProducts: () => {
    return axiosClient.get('/products');
  }
};
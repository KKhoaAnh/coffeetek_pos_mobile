import axiosClient from './axiosClient';
import { Platform } from 'react-native';

const createProductFormData = (data: any, imageFile?: any) => {
    const formData = new FormData();
    formData.append('product_name', data.product_name);
    formData.append('price', data.price.toString());
    formData.append('category_id', data.category_id);
    formData.append('description', data.description || '');

    // Xử lý Modifier IDs (Gửi dạng chuỗi "1,2,3" để backend dễ parse)
    if (data.modifier_ids && data.modifier_ids.length > 0) {
        formData.append('modifier_ids', data.modifier_ids.join(','));
    }

    if (imageFile) {
        const fileData: any = {
            uri: Platform.OS === 'android' ? imageFile.uri : imageFile.uri.replace('file://', ''),
            type: 'image/jpeg',
            name: 'product_image.jpg',
        };
        formData.append('image', fileData);
    }
    return formData;
};

export const productApi = {
  getProductModifiers: (productId: string) => {
    return axiosClient.get(`/products/${productId}/modifiers`);
  },

  getProducts: () => axiosClient.get('/products'),

  toggleStatus: (productId: number | string, isActive: boolean) => {
    return axiosClient.put(`/products/${productId}/status`, { is_active: isActive });
  },

  updateProduct: (productId: number | string, data: any, imageFile?: any) => {
      const formData = createProductFormData(data, imageFile);
      return axiosClient.put(`/products/${productId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });
  },

  getProductModifierIds: (productId: number | string) => {
      return axiosClient.get(`/products/${productId}/modifier-ids`); 
      // Backend controller đã có hàm này: getProductModifierIds (trả về mảng [1, 5])
  },

  // [MỚI] Tạo món mới
  createProduct: (data: any, imageFile?: any) => {
      const formData = createProductFormData(data, imageFile);
      return axiosClient.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });
  },


};
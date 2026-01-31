import { create } from 'zustand';
import { menuApi } from '../api/menu.api';

export interface Category {
  category_id: number;
  category_name: string;
  image_url?: string;
  grid_column_count?: number; // Backend có trả về cái này
}

export interface Product {
  product_id: string; // Controller convert toString()
  product_name: string;
  category_id: string;
  category_name: string;
  description?: string;
  image_url?: string;
  price_value: number;
  is_active: number;
  has_modifiers: boolean; // Để hiện badge "Có topping"
}

interface MenuState {
  categories: Category[];
  products: Product[];
  filteredProducts: Product[]; // Dùng để hiển thị
  isLoading: boolean;
  activeCategoryId: number | 'ALL';
  
  loadMenu: () => Promise<void>;
  filterByCategory: (categoryId: number | 'ALL') => void;
  searchProduct: (keyword: string) => void;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  categories: [],
  products: [],
  filteredProducts: [],
  isLoading: false,
  activeCategoryId: 'ALL',

  loadMenu: async () => {
    set({ isLoading: true });
    try {
      // Gọi song song cả 2 API cho nhanh
      const [resCat, resProd] = await Promise.all([
        menuApi.getCategories(),
        menuApi.getProducts()
      ]);

      set({ 
        categories: resCat.data, 
        products: resProd.data,
        filteredProducts: resProd.data // Mặc định hiện tất cả
      });
    } catch (error) {
      console.error("Lỗi load menu:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  filterByCategory: (categoryId) => {
    const { products } = get();
    set({ activeCategoryId: categoryId });
    
    if (categoryId === 'ALL') {
      set({ filteredProducts: products });
    } else {
      const filtered = products.filter(p => p.category_id === categoryId.toString());
      set({ filteredProducts: filtered });
    }
  },

  searchProduct: (keyword) => {
    const { products, activeCategoryId } = get();
    const lowerKey = keyword.toLowerCase();
    
    let baseList = products;
    // Nếu đang chọn danh mục thì chỉ tìm trong danh mục đó (hoặc tìm tất cả tùy logic bạn muốn)
    // Ở đây tôi cho tìm trong tất cả để tiện lợi nhất
    
    const filtered = baseList.filter(p => 
      p.product_name.toLowerCase().includes(lowerKey) || 
      (p.description && p.description.toLowerCase().includes(lowerKey))
    );
    set({ filteredProducts: filtered, activeCategoryId: 'ALL' }); // Reset tab về ALL khi search
  }
}));
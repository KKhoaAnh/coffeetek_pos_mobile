import { create } from 'zustand';
import { Product } from './menu.store';

export interface SelectedModifier {
  modifier_id: number;
  modifier_name: string;
  extra_price: number;
  quantity: number; 
  group_name?: string;
}

export interface CartItem {
  cartItemId: string; 
  product: Product;
  quantity: number;
  modifiers: SelectedModifier[];
  note: string;
  totalPrice: number; 
}

interface CartState {
  items: CartItem[];
  currentOrderId: number | null;
  addToCart: (item: CartItem) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  setCartFromOrder: (orderData: any) => void;
  totalAmount: () => number;
  totalQuantity: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  currentOrderId: null,
  
  addToCart: (newItem) => {
    const { items } = get();
    const modIds = newItem.modifiers.map(m => m.modifier_id).sort().join('-');
    const uniqueKey = `${newItem.product.product_id}_${modIds}_${newItem.note.trim()}`;
    const existingIndex = items.findIndex(i => i.cartItemId === uniqueKey);

    if (existingIndex > -1) {
      const updatedItems = [...items];
      updatedItems[existingIndex].quantity += newItem.quantity;
      updatedItems[existingIndex].totalPrice += newItem.totalPrice;
      set({ items: updatedItems });
    } else {
      newItem.cartItemId = uniqueKey;
      set({ items: [...items, newItem] });
    }
  },

  removeFromCart: (id) => {
    set({ items: get().items.filter(i => i.cartItemId !== id) });
  },

  updateQuantity: (id, delta) => {
    const { items } = get();
    const newItems = items.map(item => {
      if (item.cartItemId === id) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null; 
        
        // [AN TOÀN] Tránh chia cho 0 hoặc NaN
        const unitPrice = item.quantity > 0 ? (item.totalPrice / item.quantity) : 0;
        return { 
          ...item, 
          quantity: newQty, 
          totalPrice: unitPrice * newQty 
        };
      }
      return item;
    }).filter(Boolean) as CartItem[];
    
    set({ items: newItems });
  },

  clearCart: () => set({ items: [], currentOrderId: null }),

  setCartFromOrder: (orderData: any) => {
    // Kiểm tra an toàn
    if (!orderData || !orderData.items) return;

    const mappedItems: CartItem[] = orderData.items.map((item: any) => {
        
        const product: Product = {
            product_id: item.product_id.toString(),
            product_name: item.product_name || 'Món ăn',
            // [FIX NaN] Parse an toàn
            price_value: parseFloat(item.price || 0),
            image_url: item.image_url || null, 
            category_id: '0', 
            category_name: '',
            is_active: 1,
            has_modifiers: true 
        };

        const modifiers = (item.modifiers || []).map((m: any) => ({
            modifier_id: Number(m.modifier_id), 
            modifier_name: m.modifier_name,
            // [FIX NaN] Parse an toàn, nếu null thì là 0
            extra_price: parseFloat(m.extra_price || 0),
            quantity: m.quantity || 1,
            group_name: '' 
        }));

        const modIds = modifiers.map((m:any) => m.modifier_id).sort().join('-');
        const uniqueKey = `${item.product_id}_${modIds}_${(item.note || '').trim()}`;

        return {
            cartItemId: uniqueKey,
            product: product,
            quantity: item.quantity,
            note: item.note || '',
            // [FIX NaN] Parse an toàn
            totalPrice: parseFloat(item.total_line_amount || 0),
            modifiers: modifiers
        };
    });

    set({ 
        items: mappedItems, 
        currentOrderId: orderData.order_id 
    });
  },

  totalAmount: () => get().items.reduce((sum, item) => sum + item.totalPrice, 0),
  totalQuantity: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
}));
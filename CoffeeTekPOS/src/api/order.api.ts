import axiosClient from './axiosClient';
import { CartItem } from '../store/cart.store';

const generateOrderCode = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

export const orderApi = {
  createOrder: (tableId: number, userId: number, items: CartItem[], totalAmount: number) => {
    
    const formattedItems = items.map(item => ({
      product_id: item.product.product_id,
      product_name: item.product.product_name,
      price: item.product.price_value,
      quantity: item.quantity,
      total_line_amount: item.totalPrice,
      note: item.note || '',
      
      modifiers: item.modifiers.map(mod => ({
        id: mod.modifier_id,      
        name: mod.modifier_name,  
        extraPrice: mod.extra_price, 
        userInput: null,           
        quantity: 1               
      }))
    }));

    const payload = {
      order_code: generateOrderCode(),
      table_id: tableId,
      order_type: 'DINE_IN',
      status: 'PENDING',
      payment_status: 'UNPAID',
      total_amount: totalAmount,
      discount_amount: 0,
      tax_amount: 0,
      note: '', 
      created_by_user_id: userId,
      items: formattedItems
    };

    console.log("Payload gửi đi:", JSON.stringify(payload, null, 2));
    return axiosClient.post('/orders', payload);
  },

  getAllPendingOrders: () => {
    return axiosClient.get('/orders/pending');
  },

  getOrderDetail: (orderId: number) => {
    return axiosClient.get(`/orders/${orderId}`);
  },

  completeOrder: (
      orderId: number, 
      paymentMethod: string, 
      userId: number,
      discountAmount: number, // Tiền giảm giá
      finalAmount: number,    // Tiền khách phải trả sau giảm
      customerPay: number     // Tiền khách đưa (Lưu vào note hoặc field riêng nếu backend hỗ trợ, tạm thời ta chỉ gửi để log)
  ) => {
    return axiosClient.put(`/orders/${orderId}`, {
        status: 'COMPLETED',
        payment_status: 'PAID',
        table_id: null,
        order_type: 'DINE_IN',
        created_by_user_id: userId,
        
        // Cập nhật các trường tài chính
        total_amount: finalAmount,      // Cập nhật tổng tiền cuối cùng
        discount_amount: discountAmount,
        note: `Khách đưa: ${customerPay}` // Lưu tạm vào note nếu DB chưa có cột customer_pay
    });
  },
  
  cleanTable: (tableId: number) => {
      return axiosClient.put(`/tables/${tableId}/clear`);
  },

  printOrder: (orderId: number) => {
      return axiosClient.post(`/orders/${orderId}/print`);
  }
};
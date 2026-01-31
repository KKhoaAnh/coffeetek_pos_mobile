import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { Text, Surface, IconButton, Button, Divider } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ManagerHeader } from '../../components/ManagerHeader';
import { Colors } from '../../constants/app.constant';
import { useCartStore, CartItem } from '../../store/cart.store';
import { formatCurrency } from '../../utils/format';
import { useAuthStore } from '../../store/auth.store';
import { orderApi } from '../../api/order.api';
import { ProductDetailModal } from '../../components/ProductDetailModal';

export const CartScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  
  // Lấy param từ màn hình trước
  const { tableId, tableName } = route.params as { tableId?: number, tableName?: string } || {};

  const user = useAuthStore(state => state.user);
  const { items, updateQuantity, removeFromCart, totalAmount, clearCart, currentOrderId } = useCartStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  // [MỚI] State quản lý việc sửa món
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [isEditModalVisible, setEditModalVisible] = useState(false);

  // --- LOGIC GỬI ĐƠN & ĐIỀU HƯỚNG ---
  const handleSubmitOrder = async () => {
    if (items.length === 0) return;
    if (!tableId || !user) {
      Alert.alert("Lỗi", "Thiếu thông tin Bàn hoặc Nhân viên.");
      return;
    }

    Alert.alert(
      "Xác nhận",
      `Gửi đơn cho bàn ${tableName || 'này'} xuống bếp?`,
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Gửi ngay", 
          onPress: async () => {
            setIsSubmitting(true);
            try {
              const res = await orderApi.createOrder(
                tableId, 
                user.id, 
                items, 
                totalAmount()
              );

              if (res.status === 201 || res.status === 200) {
                 clearCart();
                 Alert.alert("Thành công", "Đơn hàng đã được gửi!", [
                    { 
                      text: "Về Sơ đồ bàn", 
                      onPress: () => {
                        // Điều hướng về Tab Main -> Màn hình Tables
                        navigation.navigate('Main', { 
                          screen: 'Tables'
                        });
                      } 
                    }
                 ]);
              }
            } catch (error: any) {
              console.error(error);
              Alert.alert("Lỗi", "Không thể gửi đơn hàng. Kiểm tra kết nối.");
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const handlePayment = () => {
      navigation.navigate('PaymentScreen', {
          tableId: tableId,
          tableName: tableName,
          orderId: currentOrderId,
          totalAmount: totalAmount()
      });
  };

  const handleReprint = async () => {
      if (!currentOrderId) return;
      try {
          // Gọi API tăng số lần in (Backend đã có hàm này: incrementPrintCount)
          // Bạn cần thêm hàm này vào order.api.ts nếu muốn gọi
          // await orderApi.reprintOrder(currentOrderId); 
          Alert.alert("Thành công", "Đã gửi lệnh in lại xuống bếp.");
      } catch (e) {
          Alert.alert("Lỗi", "Không thể in lại.");
      }
  };

  // [MỚI] Hàm mở Modal sửa món
  const handleEditItem = (item: CartItem) => {
    setEditingItem(item);
    setEditModalVisible(true);
  };

  const renderItem = ({ item }: { item: CartItem }) => {
    return (
      <Surface style={styles.itemCard} elevation={1}>
        <View style={styles.itemRow}>
          
          {/* CỘT TRÁI: Thông tin món (Click được để sửa) */}
          <TouchableOpacity 
            style={styles.leftColumn} 
            onPress={() => handleEditItem(item)}
            activeOpacity={0.7}
          >
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
               <Text style={styles.itemName}>{item.product.product_name}</Text>
               <MaterialCommunityIcons name="pencil-outline" size={14} color={Colors.primary} style={{marginLeft: 6, opacity: 0.7}} />
            </View>
            
            {/* Topping */}
            {item.modifiers.length > 0 && (
              <View style={styles.modifierContainer}>
                {item.modifiers.map((mod, index) => (
                  <Text key={index} style={styles.modifierText}>
                    + {mod.modifier_name} ({formatCurrency(mod.extra_price)})
                  </Text>
                ))}
              </View>
            )}

            {/* Ghi chú */}
            {item.note ? (
               <Text style={styles.noteText}>Ghi chú: {item.note}</Text>
            ) : null}

            <Text style={styles.itemPrice}>{formatCurrency(item.totalPrice)}</Text>
          </TouchableOpacity>

          {/* CỘT PHẢI: Các nút hành động */}
          <View style={styles.rightColumn}>
            
            {/* Nút Xóa */}
            <TouchableOpacity 
               style={styles.deleteBtnWrapper}
               onPress={() => removeFromCart(item.cartItemId)}
               hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            >
               <MaterialCommunityIcons name="trash-can-outline" size={22} color={Colors.red} />
            </TouchableOpacity>

            {/* Bộ điều khiển số lượng */}
            <View style={styles.qtyContainer}>
              <TouchableOpacity onPress={() => updateQuantity(item.cartItemId, -1)} style={styles.qtyBtn}>
                 <MaterialCommunityIcons name="minus" size={16} color="#333" />
              </TouchableOpacity>
              
              <Text style={styles.qtyText}>{item.quantity}</Text>
              
              <TouchableOpacity onPress={() => updateQuantity(item.cartItemId, 1)} style={[styles.qtyBtn, {backgroundColor: Colors.primary}]}>
                 <MaterialCommunityIcons name="plus" size={16} color="white" />
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Surface>
    );
  };

  return (
    <View style={styles.container}>
      <ManagerHeader title="Giỏ Hàng" subtitle="Chạm vào món để chỉnh sửa" />

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="cart-off" size={60} color="#DDD" />
          <Text style={{color: '#999', marginTop: 10}}>Giỏ hàng đang trống</Text>
          <Button mode="outlined" style={{marginTop: 20}} onPress={() => navigation.goBack()}>
            Quay lại Menu
          </Button>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={item => item.cartItemId}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />

          <Surface style={styles.footer} elevation={5}>
            <View style={styles.billRow}>
              <Text style={{color: '#666'}}>Tạm tính:</Text>
              <Text style={{fontWeight: 'bold'}}>{formatCurrency(totalAmount())}</Text>
            </View>
            
            <Divider style={{marginVertical: 10}} />
            
            <View style={styles.billRow}>
              <Text variant="titleLarge" style={{fontWeight: 'bold'}}>Tổng cộng:</Text>
              <Text variant="headlineSmall" style={{fontWeight: 'bold', color: Colors.primary}}>
                {formatCurrency(totalAmount())}
              </Text>
            </View>

            {currentOrderId ? (
                // TRƯỜNG HỢP: ĐƠN CŨ (Đang xem lại)
                <View style={{flexDirection: 'row', gap: 10}}>
                    <Button 
                        mode="outlined" 
                        style={{flex: 1, borderColor: Colors.primary}} 
                        textColor={Colors.primary}
                        icon="printer"
                        onPress={handleReprint}
                        contentStyle={{height: 50}}
                    >
                        IN LẠI
                    </Button>
                    <Button 
                        mode="contained" 
                        style={{flex: 1, backgroundColor: Colors.green}} 
                        icon="cash-register"
                        onPress={handlePayment}
                        contentStyle={{height: 50}}
                    >
                        THANH TOÁN
                    </Button>
                </View>
            ) : (
                // TRƯỜNG HỢP: ĐƠN MỚI
                <Button 
                  mode="contained" 
                  style={styles.submitBtn} 
                  contentStyle={{height: 56}}
                  onPress={handleSubmitOrder}
                  loading={isSubmitting}
                  icon="chef-hat"
                >
                  GỬI BẾP
                </Button>
            )}
          </Surface>
        </>
      )}

      {/* [MỚI] Modal Sửa Món nằm ở cuối view */}
      <ProductDetailModal 
        isVisible={isEditModalVisible}
        product={editingItem?.product || null} 
        editingCartItem={editingItem}
        onClose={() => {
          setEditModalVisible(false);
          setEditingItem(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6F8' },
  listContent: { padding: 16, paddingBottom: 20 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  itemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
  },
  itemRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'flex-start' 
  },
  
  // Cột trái
  leftColumn: {
    flex: 1,
    paddingRight: 10,
  },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  itemPrice: { color: Colors.primary, fontWeight: 'bold', marginTop: 6 },
  modifierContainer: { marginTop: 2, marginBottom: 4 },
  modifierText: { fontSize: 12, color: '#666', fontStyle: 'italic' },
  noteText: { fontSize: 12, color: '#FF9800', marginTop: 2 },

  // Cột phải
  rightColumn: {
    alignItems: 'flex-end', 
    justifyContent: 'space-between',
    minHeight: 70, 
  },
  deleteBtnWrapper: {
    padding: 4,
    marginBottom: 15, 
  },

  // Quantity Control
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 20, 
    padding: 2,
  },
  qtyBtn: { 
    width: 28, 
    height: 28, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderRadius: 14,
  },
  qtyText: { 
    fontWeight: 'bold', 
    marginHorizontal: 10, 
    fontSize: 14,
    minWidth: 16,
    textAlign: 'center'
  },

  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  submitBtn: {
    marginTop: 15,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  }
});
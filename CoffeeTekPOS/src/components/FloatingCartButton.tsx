import React from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/app.constant';
import { useCartStore } from '../store/cart.store';
import { formatCurrency } from '../utils/format';

interface Props {
  tableId?: number;
  tableName?: string;
}
export const FloatingCartButton = ({ tableId, tableName }: Props) => {
  const navigation = useNavigation<any>();
  const totalAmount = useCartStore(state => state.totalAmount());
  const totalQuantity = useCartStore(state => state.totalQuantity());

  // Nếu giỏ hàng trống thì ẩn nút đi
  if (totalQuantity === 0) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => navigation.navigate('CartScreen', { tableId, tableName })}
      >
        <Surface style={styles.button} elevation={4}>
          {/* Icon Giỏ Hàng + Badge Số lượng */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="cart-outline" size={28} color="white" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalQuantity}</Text>
            </View>
          </View>

          {/* Thông tin Tổng tiền */}
          <View style={styles.infoContainer}>
            <Text style={styles.label}>Xem giỏ hàng</Text>
            <Text style={styles.total}>{formatCurrency(totalAmount)}</Text>
          </View>

          {/* Mũi tên chỉ dẫn */}
          <MaterialCommunityIcons name="chevron-right" size={24} color="white" />
        </Surface>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    zIndex: 100, // Luôn nổi lên trên
  },
  button: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    height: 64,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.red,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  total: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
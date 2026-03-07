import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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

  if (totalQuantity === 0) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('CartScreen', { tableId, tableName })}
      >
        <LinearGradient
          colors={['#8D6E63', '#A1887F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.button}
        >
          {/* Icon Giỏ Hàng + Badge Số lượng */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="cart-outline" size={26} color="white" />
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
          <View style={styles.arrowCircle}>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#8D6E63" />
          </View>
        </LinearGradient>
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
    zIndex: 100,
  },
  button: {
    flexDirection: 'row',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    height: 64,
    // Bóng nhẹ nhàng
    shadowColor: '#5D4037',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#D32F2F',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#8D6E63',
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
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '500',
  },
  total: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: -0.3,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
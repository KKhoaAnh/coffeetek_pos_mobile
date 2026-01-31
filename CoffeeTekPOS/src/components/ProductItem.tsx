import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/app.constant';
import { getImageUrl } from '../constants/app.constant';
import { Product } from '../store/menu.store';
import { formatCurrency } from '../utils/format';

const { width } = Dimensions.get('window');

interface Props {
  product: Product;
  onPress: (product: Product) => void;
  numColumns: number;
}

export const ProductItem = ({ product, onPress, numColumns }: Props) => {
  // Tính chiều rộng item
  const totalGap = (numColumns - 1) * 10;
  const availableWidth = width - 32 - totalGap;
  const itemWidth = availableWidth / numColumns;

  return (
    <TouchableOpacity 
      onPress={() => onPress(product)} 
      activeOpacity={0.7}
      style={{ width: itemWidth, marginBottom: 12 }} // [FIX] Bỏ height: '100%' ở đây
    >
      {/* Lớp 1: Surface chịu trách nhiệm Đổ Bóng (Shadow) */}
      <Surface style={styles.surface} elevation={2}>
        
        {/* Lớp 2: View chịu trách nhiệm Bo Góc và Cắt Ảnh (Overflow Hidden) */}
        <View style={styles.innerContainer}>
          
          {/* Ảnh món */}
          <View style={styles.imageContainer}>
            {product.image_url ? (
              <Image source={{ uri: getImageUrl(product.image_url) }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={[styles.image, styles.placeholder]}>
                <MaterialCommunityIcons name="coffee" size={30} color="#E0E0E0" />
              </View>
            )}
            
            {/* Badge Topping */}
            {product.has_modifiers && (
              <View style={styles.modifierBadge}>
                <MaterialCommunityIcons name="plus" size={14} color="white" />
              </View>
            )}
          </View>

          {/* Thông tin */}
          <View style={styles.info}>
            <Text variant="labelLarge" numberOfLines={2} style={styles.name}>
              {product.product_name}
            </Text>
            <Text variant="bodyMedium" style={styles.price}>
              {formatCurrency(product.price_value)}
            </Text>
          </View>

        </View>
      </Surface>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Style cho bóng đổ (Không được có overflow: hidden)
  surface: {
    borderRadius: 12,
    backgroundColor: 'white',
    // Đảm bảo Surface có nền trắng để đổ bóng
  },
  // Style để cắt ảnh bo góc (Phải nằm bên trong Surface)
  innerContainer: {
    borderRadius: 12,
    overflow: 'hidden', // [FIX] Chuyển overflow vào đây để không mất shadow
    backgroundColor: 'white',
  },
  imageContainer: {
    height: 110, // [FIX] Tăng chiều cao ảnh cố định lên chút cho đẹp
    width: '100%',
    backgroundColor: '#F5F5F5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    padding: 10,
    justifyContent: 'space-between',
    minHeight: 60, // Đảm bảo phần thông tin có chiều cao tối thiểu cho đều
  },
  name: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },
  price: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  modifierBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: Colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'white', // Thêm viền trắng cho badge nổi bật
  }
});
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
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
  const totalGap = (numColumns - 1) * 12;
  const availableWidth = width - 32 - totalGap;
  const itemWidth = availableWidth / numColumns;

  return (
    <TouchableOpacity
      onPress={() => onPress(product)}
      activeOpacity={0.8}
      style={{ width: itemWidth, marginBottom: 12 }}
    >
      <View style={styles.card}>
        {/* Ảnh món - bo góc mềm */}
        <View style={styles.imageContainer}>
          {product.image_url ? (
            <Image source={{ uri: getImageUrl(product.image_url) }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <MaterialCommunityIcons name="coffee" size={26} color="#D5CFC9" />
            </View>
          )}

          {/* Badge Topping */}
          {product.has_modifiers && (
            <View style={styles.modifierBadge}>
              <MaterialCommunityIcons name="plus" size={12} color="white" />
            </View>
          )}
        </View>

        {/* Thông tin */}
        <View style={styles.info}>
          <Text numberOfLines={2} style={styles.name}>
            {product.product_name}
          </Text>
          <Text style={styles.price}>
            {formatCurrency(product.price_value)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#EFECE8',
    borderRadius: 18,
    overflow: 'hidden',
    // Shadow cực nhẹ - gần như không thấy, chỉ tạo chiều sâu rất nhẹ
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  imageContainer: {
    height: 105,
    width: '100%',
    backgroundColor: '#E8E4DF',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8E4DF',
  },
  info: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 56,
    justifyContent: 'space-between',
  },
  name: {
    fontWeight: '600',
    color: '#4A4540',
    marginBottom: 3,
    fontSize: 13,
    lineHeight: 17,
  },
  price: {
    color: '#6D4C41',
    fontWeight: '700',
    fontSize: 13,
  },
  modifierBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: '#8D6E63',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EFECE8',
  },
});
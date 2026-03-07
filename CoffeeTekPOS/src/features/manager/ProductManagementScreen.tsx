import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert, Image, TouchableOpacity } from 'react-native';
import { Text, Switch, FAB, Searchbar } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ManagerHeader } from '../../components/ManagerHeader';
import { Colors, getImageUrl } from '../../constants/app.constant';
import { productApi } from '../../api/product.api';
import { formatCurrency } from '../../utils/format';

export const ProductManagementScreen = () => {
  const navigation = useNavigation<any>();
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await productApi.getProducts();
      setProducts(res.data);
      setFilteredProducts(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadProducts();
    }, [])
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredProducts(products);
    } else {
      const lower = query.toLowerCase();
      setFilteredProducts(products.filter(p =>
        p.product_name.toLowerCase().includes(lower)
      ));
    }
  };

  const handleToggleStatus = async (item: any) => {
    const newValue = !item.is_active;
    const updatedList = products.map(p =>
      p.product_id === item.product_id ? { ...p, is_active: newValue } : p
    );
    setProducts(updatedList);
    setFilteredProducts(updatedList.filter(p =>
      p.product_name.toLowerCase().includes(searchQuery.toLowerCase())
    ));

    try {
      await productApi.toggleStatus(item.product_id, newValue);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái");
      loadProducts();
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const active = Boolean(item.is_active);
    return (
      <TouchableOpacity
        style={styles.gridItem}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('ProductEditScreen', { product: item })}
      >
        <View style={[styles.card, !active && styles.cardInactive]}>
          <Image
            source={item.image_url ? { uri: getImageUrl(item.image_url) } : require('../../../assets/welcome-background.jpg')}
            style={[styles.image, !active && { opacity: 0.5 }]}
          />

          <View style={styles.info}>
            <Text
              variant="titleMedium"
              style={{ fontWeight: '600', fontSize: 15, color: active ? '#4A4540' : '#B5AEA7' }}
              numberOfLines={1}
            >
              {item.product_name}
            </Text>
            <Text style={{ color: '#6D4C41', fontWeight: '600', fontSize: 13, marginTop: 2 }}>
              {formatCurrency(item.price_value)}
            </Text>
          </View>

          <View style={styles.switchWrap}>
            <Switch
              value={active}
              onValueChange={() => handleToggleStatus(item)}
              color={'#8D6E63'}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ManagerHeader title="Quản lý thực đơn" subtitle="Bật/Tắt món & Chỉnh sửa" />

      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
        <Searchbar
          placeholder="Tìm tên món..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={{ minHeight: 0, color: '#4A4540' }}
          iconColor="#A09B94"
          placeholderTextColor="#A09B94"
          theme={{
            colors: {
              elevation: { level3: '#ECEAE6' },
            }
          }}
        />
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.product_id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshing={loading}
        onRefresh={loadProducts}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        icon="plus"
        color="#FFF"
        style={styles.fab}
        onPress={() => {
          navigation.navigate('ProductEditScreen', { product: null });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F3F1' },
  searchBar: {
    marginBottom: 4,
    backgroundColor: '#ECEAE6',
    borderRadius: 14,
    elevation: 0,
    shadowOpacity: 0,
  },
  gridItem: { marginBottom: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    backgroundColor: '#ffffffff',
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardInactive: { opacity: 0.75, backgroundColor: '#EAE7E3' },
  image: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#E8E4DF' },
  info: { flex: 1, marginLeft: 12 },
  switchWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#8D6E63',
    borderRadius: 28,
  },
});
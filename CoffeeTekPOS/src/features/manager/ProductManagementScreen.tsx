import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert, Image, TouchableOpacity } from 'react-native';
import { Text, Switch, IconButton, Surface, FAB, Searchbar } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

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

  // Load danh sách sản phẩm
  const loadProducts = async () => {
    setLoading(true);
    try {
        // Gọi API lấy tất cả (bao gồm cả ẩn)
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
    // Optimistic Update (Cập nhật giao diện trước cho mượt)
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
        loadProducts(); // Revert lại nếu lỗi
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <Surface style={styles.itemCard} elevation={1}>
        <Image 
            source={item.image_url ? { uri: getImageUrl(item.image_url) } : require('../../../assets/welcome-background.jpg')} 
            style={[styles.image, !item.is_active && { opacity: 0.5 }]} 
        />
        
        <View style={styles.info}>
            <Text variant="titleMedium" style={{fontWeight: 'bold', color: item.is_active ? '#333' : '#999'}}>
                {item.product_name}
            </Text>
            <Text style={{color: Colors.primary, fontWeight: '600'}}>
                {formatCurrency(item.price_value)} 
            </Text>
        </View>

        <View style={styles.actions}>
            <Switch 
                value={Boolean(item.is_active)} 
                onValueChange={() => handleToggleStatus(item)} 
                color={Colors.primary}
            />
            <IconButton 
                icon="pencil" 
                iconColor="#666"
                onPress={() => navigation.navigate('ProductEditScreen', { product: item })}
            />
        </View>
    </Surface>
  );

  return (
    <View style={styles.container}>
      <ManagerHeader title="Quản lý Thực đơn" subtitle="Bật/Tắt món & Chỉnh sửa" />
      
      <View style={{padding: 16, paddingBottom: 0}}>
        <Searchbar
            placeholder="Tìm tên món..."
            onChangeText={handleSearch}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={{minHeight: 0}} // Fix lỗi chiều cao searchbar trên android
        />
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.product_id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{padding: 16}}
      />

      <FAB
        icon="plus"
        color={Colors.white}
        style={styles.fab}
        onPress={() => {
            navigation.navigate('ProductEditScreen', { product: null });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6F8' },
  searchBar: { marginBottom: 10, backgroundColor: 'white', borderRadius: 10 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 10,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  image: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#EEE' },
  info: { flex: 1, marginLeft: 12 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
  },
});
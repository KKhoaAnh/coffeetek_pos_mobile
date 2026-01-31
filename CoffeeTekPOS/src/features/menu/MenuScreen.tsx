import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Text, ActivityIndicator, IconButton } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProductDetailModal } from '../../components/ProductDetailModal';
import { ManagerHeader } from '../../components/ManagerHeader';
import { Colors } from '../../constants/app.constant';
import { useMenuStore, Product } from '../../store/menu.store';
import { ProductItem } from '../../components/ProductItem';
import { FloatingCartButton } from '../../components/FloatingCartButton';
import { useAuthStore } from '../../store/auth.store';
import { ProductManagementScreen } from '../../features/manager/ProductManagementScreen';

export const MenuScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const user = useAuthStore(state => state.user);
  const isManager = user?.role === 'manager';

  const handleManagerPress = () => {
    Alert.alert(
      "Quản trị viên",
      "Bạn muốn quản lý nội dung gì?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Món ăn (Menu)", 
          onPress: () => navigation.navigate('ProductManagementScreen' as never) 
        },
        { 
          text: "Tùy chọn (Modifier)", 
          onPress: () => navigation.navigate('ModifierManagementScreen' as never) 
        }
      ]
    );
  };

  const { tableId, tableName } = route.params as { tableId?: number, tableName?: string } || {};

  const { 
    categories, filteredProducts, isLoading, activeCategoryId,
    loadMenu, filterByCategory, searchProduct 
  } = useMenuStore();

  const [searchText, setSearchText] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadMenu();
  }, []);

  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const renderCategoryTab = (cat: { id: number | 'ALL', name: string }) => {
    const isActive = activeCategoryId === cat.id;
    return (
      <TouchableOpacity 
        key={cat.id}
        onPress={() => filterByCategory(cat.id)}
        style={[
          styles.catTab, 
          isActive && styles.catTabActive
        ]}
      >
        <Text style={[
          styles.catText, 
          isActive && styles.catTextActive
        ]}>
          {cat.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header: Hiển thị bàn đang chọn */}
      <ManagerHeader 
        title={tableName ? `Order: ${tableName}` : "Thực Đơn"} 
        subtitle="Chọn món để thêm vào giỏ"

        rightIcon={isManager ? "cog" : undefined}
          onRightPress={isManager ? handleManagerPress : undefined}
      />

      {/* Thanh Tìm Kiếm */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#888" style={{marginLeft: 10}} />
          <TextInput 
            placeholder="Tìm tên món ăn, đồ uống..."
            style={styles.searchInput}
            value={searchText}
            onChangeText={(text) => {
              setSearchText(text);
              searchProduct(text);
            }}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchText(''); searchProduct(''); }}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#CCC" style={{marginRight: 10}} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Danh sách Danh Mục (Trượt ngang) */}
      <View style={{ height: 50 }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center' }}
        >
          {renderCategoryTab({ id: 'ALL', name: 'Tất cả' })}
          {categories.map(cat => renderCategoryTab({ id: cat.category_id, name: cat.category_name }))}
        </ScrollView>
      </View>

      {/* Lưới Sản Phẩm */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.product_id}
          key={`grid-2`} 
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          renderItem={({ item }) => (
            <ProductItem 
              product={item} 
              onPress={handleProductPress}
              numColumns={2}
            />
          )}
          ListEmptyComponent={
             <View style={styles.center}>
               <MaterialCommunityIcons name="food-off" size={40} color="#DDD" />
               <Text style={{color: '#999', marginTop: 10}}>Không tìm thấy món nào</Text>
             </View>
          }
        />
      )}

      <FloatingCartButton tableId={tableId} tableName={tableName} />
      
      <ProductDetailModal 
        isVisible={isModalVisible}
        product={selectedProduct}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6F8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  
  searchContainer: {
    padding: 12,
    backgroundColor: 'white',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 8,
    height: 40,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 8,
    fontSize: 14,
  },

  catTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'white',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  catTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catText: {
    fontWeight: '600',
    color: '#666',
  },
  catTextActive: {
    color: 'white',
  },

  listContent: {
    padding: 16,
    paddingBottom: 80,
  }
});
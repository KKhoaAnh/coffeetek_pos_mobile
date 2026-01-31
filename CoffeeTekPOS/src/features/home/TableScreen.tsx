import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Text, Provider } from 'react-native-paper'; // [QUAN TRỌNG] Thêm Provider để dùng Modal
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ManagerHeader } from '../../components/ManagerHeader';
import { useAuthStore } from '../../store/auth.store';
import { useTableStore, Table } from '../../store/table.store';
import { TableItem } from '../../components/TableItem';
import { Colors } from '../../constants/app.constant';
import { orderApi } from '../../api/order.api';
import { useCartStore } from '../../store/cart.store';
import { tableApi } from '../../api/table.api';

// [MỚI] Import 2 Modal vừa tạo
import { TableSelectionModal } from '../../components/TableSelectionModal';
import { TableActionModal } from '../../components/TableActionModal';

// --- COMPONENT CON: CUSTOM FILTER CHIP ---
const FilterTab = ({ 
  label, 
  icon, 
  isActive, 
  onPress 
}: { 
  label: string, 
  icon: string, 
  isActive: boolean, 
  onPress: () => void 
}) => {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.7}
      style={[
        styles.filterTab, 
        isActive && styles.filterTabActive
      ]}
    >
      <MaterialCommunityIcons 
        name={icon as any} 
        size={18} 
        color={isActive ? Colors.white : '#666'} 
        style={{marginRight: 6}}
      />
      <Text style={[
        styles.filterText, 
        isActive && styles.filterTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export const TableScreen = ({ navigation }: any) => {
  const user = useAuthStore(state => state.user);
  const { tables, loadTables, isLoading } = useTableStore();
  const [filter, setFilter] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED'>('ALL');

  // [MỚI] State quản lý logic Chuyển/Gộp
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'MOVE' | 'MERGE'>('MOVE');
  
  useFocusEffect(
    useCallback(() => {
      loadTables();
    }, [])
  );

  const filteredTables = useMemo(() => {
    if (filter === 'ALL') return tables;
    return tables.filter(t => t.status === filter);
  }, [tables, filter]);

  const occupiedCount = tables.filter(t => t.status === 'OCCUPIED').length;
  const availableCount = tables.filter(t => t.status === 'AVAILABLE').length;

  // --- 1. XỬ LÝ KHI BẤM VÀO BÀN ---
  const handleTablePress = async (table: Table) => {
    const { clearCart } = useCartStore.getState();

    // TRƯỜNG HỢP: Bàn đang dọn dẹp
    if (table.status === 'CLEANING') {
        Alert.alert(
            "Dọn bàn",
            `Xác nhận bàn ${table.table_name} đã dọn xong và sẵn sàng đón khách?`,
            [
                { text: "Chưa", style: "cancel" },
                { 
                    text: "Đã xong", 
                    onPress: async () => {
                        try {
                            await orderApi.cleanTable(table.table_id);
                            loadTables(); 
                        } catch (error) {
                            Alert.alert("Lỗi", "Không thể cập nhật trạng thái bàn.");
                        }
                    } 
                }
            ]
        );
        return;
    }

    // TRƯỜNG HỢP: Bàn có khách -> [THAY ĐỔI] Mở Modal Hành Động thay vì vào thẳng
    if (table.status === 'OCCUPIED') {
        setSelectedTable(table);
        setShowActionModal(true);
        return;
    }

    // TRƯỜNG HỢP: Bàn trống -> Tạo đơn mới
    clearCart();
    navigation.navigate('MenuOrder', { 
        tableId: table.table_id, 
        tableName: table.table_name 
    });
  };

  // --- 2. CÁC HÀM XỬ LÝ HÀNH ĐỘNG (Từ Modal) ---

  // A. Xem Đơn (Logic cũ của Occupied dời vào đây)
  const handleOpenOrder = async () => {
    setShowActionModal(false);
    if (!selectedTable) return;

    const { setCartFromOrder, clearCart } = useCartStore.getState();

    try {
        // Bước 1: Lấy tất cả đơn chờ
        const resList = await orderApi.getAllPendingOrders();
        const allOrders = resList.data;

        // Bước 2: Tìm đơn hàng của bàn này
        const targetOrder = allOrders.find((o: any) => o.table_id === selectedTable.table_id);

        if (targetOrder) {
            // Bước 3: Lấy chi tiết
            const resDetail = await orderApi.getOrderDetail(targetOrder.order_id);
            const fullOrderData = resDetail.data;

            // Bước 4: Nạp vào Store
            setCartFromOrder(fullOrderData);

            // Bước 5: Vào màn hình Order
            navigation.navigate('MenuOrder', { 
                tableId: selectedTable.table_id, 
                tableName: selectedTable.table_name 
            });
        } else {
            Alert.alert("Lỗi", "Không tìm thấy đơn hàng của bàn này.");
            clearCart(); // Reset cho an toàn
            // Vẫn cho vào menu để tạo đơn mới nếu cần
            navigation.navigate('MenuOrder', { 
                tableId: selectedTable.table_id, 
                tableName: selectedTable.table_name 
            });
        }
    } catch (error) {
        console.error("Lỗi tải đơn:", error);
        Alert.alert("Lỗi", "Không thể tải đơn hàng.");
    }
  };

  // B. Chuẩn bị Chuyển Bàn
  const handlePrepareMove = () => {
    setShowActionModal(false);
    setSelectionMode('MOVE');
    setTimeout(() => setShowSelectionModal(true), 200); // Delay nhẹ để modal cũ đóng hẳn
  };

  // C. Chuẩn bị Gộp Bàn
  const handlePrepareMerge = () => {
    setShowActionModal(false);
    setSelectionMode('MERGE');
    setTimeout(() => setShowSelectionModal(true), 200);
  };

  // D. Gọi API sau khi chọn bàn đích
  const handleTargetSelect = async (targetTable: Table) => {
    if (!selectedTable || !selectedTable.current_order_id) {
        Alert.alert("Lỗi", "Bàn hiện tại không có thông tin đơn hàng.");
        return;
    }
    
    setShowSelectionModal(false);
    const orderId = selectedTable.current_order_id; 

    try {
        if (selectionMode === 'MOVE') {
            // Gọi API Chuyển
            await tableApi.moveTable(orderId, targetTable.table_id);
            Alert.alert("Thành công", `Đã chuyển từ ${selectedTable.table_name} sang ${targetTable.table_name}`);
        } else {
            // Gọi API Gộp
            // Lưu ý: Gộp cần sourceOrderId (orderId hiện tại) và targetTableId
            await tableApi.mergeTable(orderId, targetTable.table_id);
            Alert.alert("Thành công", `Đã gộp ${selectedTable.table_name} vào ${targetTable.table_name}`);
        }
        
        // Refresh lại dữ liệu
        loadTables();
        setSelectedTable(null);

    } catch (error: any) {
        // Backend trả lỗi message trong response
        const msg = error.response?.data?.message || error.message || "Thao tác thất bại";
        Alert.alert("Lỗi", msg);
    }
  };

  return (
    // [QUAN TRỌNG] Bọc Provider để hiển thị Modal
    <Provider>
        <View style={styles.container}>
        <ManagerHeader 
            title="Sơ Đồ Bàn" 
            subtitle={`${occupiedCount} đang dùng • ${availableCount} bàn trống`}
            showAvatar 
            userInitial={user?.fullName.charAt(0)}
        />

        {/* --- FILTER BAR --- */}
        <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 16}}>
            <FilterTab 
                label="Tất cả" 
                icon="apps" 
                isActive={filter === 'ALL'} 
                onPress={() => setFilter('ALL')} 
            />
            <FilterTab 
                label="Bàn trống" 
                icon="table-furniture" 
                isActive={filter === 'AVAILABLE'} 
                onPress={() => setFilter('AVAILABLE')} 
            />
            <FilterTab 
                label="Có khách" 
                icon="account-group" 
                isActive={filter === 'OCCUPIED'} 
                onPress={() => setFilter('OCCUPIED')} 
            />
            </ScrollView>
        </View>

        {/* --- GRID LIST --- */}
        <FlatList
            data={filteredTables}
            keyExtractor={(item) => item.table_id.toString()}
            numColumns={3}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadTables} colors={[Colors.primary]} />
            }
            renderItem={({ item }) => (
            <TableItem table={item} onPress={handleTablePress} />
            )}
            ListEmptyComponent={
            <View style={styles.emptyState}>
                <MaterialCommunityIcons name="table-off" size={40} color="#DDD" />
                <Text style={{color: '#999', marginTop: 10}}>Không tìm thấy bàn nào</Text>
            </View>
            }
        />

        {/* --- MODAL SECTION --- */}
        
        {/* 1. Menu Hành Động (Xem/Chuyển/Gộp) */}
        <TableActionModal 
            visible={showActionModal}
            table={selectedTable}
            onDismiss={() => setShowActionModal(false)}
            onOrder={handleOpenOrder}
            onMove={handlePrepareMove}
            onMerge={handlePrepareMerge}
        />

        {/* 2. Danh Sách Chọn Bàn Đích */}
        <TableSelectionModal 
            visible={showSelectionModal}
            mode={selectionMode}
            currentTable={selectedTable}
            tables={tables} // Truyền toàn bộ list bàn để modal tự lọc
            onDismiss={() => setShowSelectionModal(false)}
            onSelect={handleTargetSelect}
        />
        </View>
    </Provider>
  );
};

// ... (Phần Styles giữ nguyên như file cũ của bạn)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  
  // Style cho Filter Bar
  filterContainer: {
    paddingVertical: 12,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F0F2F5', // Màu xám nhạt mặc định
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  filterTabActive: {
    backgroundColor: Colors.primary, // Màu nâu chủ đạo
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  filterText: {
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#FFF',
  },

  // List Style
  listContent: { padding: 16, paddingBottom: 100 },
  columnWrapper: { justifyContent: 'space-between' },
  emptyState: { alignItems: 'center', marginTop: 50 }
});
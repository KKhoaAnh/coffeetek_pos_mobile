import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Surface, IconButton, Modal, Portal, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/app.constant';
import { Table } from '../store/table.store'; // Cập nhật đường dẫn import đúng store của bạn

// --- TÍNH TOÁN KÍCH THƯỚC GRID ---
const { width: windowWidth } = Dimensions.get('window');
const MODAL_PADDING = 20; // Padding trong lòng modal
const ITEM_GAP = 10; // Khoảng cách giữa các item
const NUM_COLUMNS = 3; // Số cột muốn hiển thị

// Tính toán chiều rộng khả dụng bên trong modal
const availableWidth = windowWidth - (MODAL_PADDING * 2) - (MODAL_PADDING * 2); // Trừ margin ngoài modal và padding trong modal
// Tính chiều rộng chính xác của 1 item để vừa khít 3 cột
const ITEM_WIDTH = (availableWidth - (ITEM_GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS;


interface Props {
  visible: boolean;
  mode: 'MOVE' | 'MERGE';
  currentTable: Table | null;
  tables: Table[];
  onSelect: (targetTable: Table) => void;
  onDismiss: () => void;
}

export const TableSelectionModal = ({ visible, mode, currentTable, tables, onSelect, onDismiss }: Props) => {
  
  const availableTargets = useMemo(() => {
    if (!currentTable) return [];
    return tables.filter(t => {
      if (t.table_id === currentTable.table_id) return false;
      if (mode === 'MOVE') return t.status === 'AVAILABLE';
      else return t.status === 'OCCUPIED';
    });
  }, [tables, mode, currentTable]);

  const isMove = mode === 'MOVE';
  const themeColor = isMove ? Colors.green : Colors.red;
  const iconName = isMove ? "arrow-right" : "call-merge";

  return (
    <Portal>
      <Modal 
        visible={visible} 
        onDismiss={onDismiss} 
        contentContainerStyle={styles.modalContainer}
        dismissable={true}
      >
        <View style={styles.header}>
          <View style={{flex: 1}}>
            <Text variant="titleLarge" style={{fontWeight: 'bold', color: themeColor}}>
              {isMove ? 'Chuyển đến bàn trống' : 'Gộp vào bàn có khách'}
            </Text>
            <Text variant="bodySmall" style={{color: '#666', marginTop: 4}}>
              {isMove 
                ? `Đơn của ${currentTable?.table_name} sẽ chuyển sang bàn mới.` 
                : `Đơn của ${currentTable?.table_name} sẽ gộp vào bàn được chọn.`}
            </Text>
          </View>
          <IconButton icon="close" size={24} onPress={onDismiss} style={{marginRight: -10, marginTop: -10}} />
        </View>

        <Divider style={{marginBottom: 15}} />

        <ScrollView 
          style={{maxHeight: windowWidth * 0.8}} // Giới hạn chiều cao scroll
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
        >
          {availableTargets.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="table-off" size={48} color="#EEE" />
              <Text style={{color: '#999', marginTop: 12, fontWeight: '500'}}>
                Không có bàn nào phù hợp
              </Text>
            </View>
          ) : (
            // Sử dụng View container để áp dụng flexWrap và gap
            <View style={styles.gridWrapper}>
              {availableTargets.map(table => (
                <TouchableOpacity 
                  key={table.table_id} 
                  onPress={() => onSelect(table)}
                  activeOpacity={0.6}
                  style={{ width: ITEM_WIDTH, marginBottom: ITEM_GAP }} // Áp dụng chiều rộng đã tính
                >
                  <Surface 
                    style={[
                      styles.tableItemCompact, 
                      { borderColor: themeColor } // Viền màu theo chế độ
                    ]} 
                    elevation={1}
                  >
                    <View style={[styles.iconBadge, { backgroundColor: themeColor + '20' }]}>
                      <MaterialCommunityIcons name={iconName} size={16} color={themeColor} />
                    </View>
                    <Text style={[styles.tableName, { color: themeColor }]}>
                      {table.table_name}
                    </Text>
                  </Surface>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    margin: MODAL_PADDING, // Margin bên ngoài
    borderRadius: 24,
    padding: MODAL_PADDING, // Padding bên trong
    paddingBottom: 10, // Giảm padding đáy một chút
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  gridContainer: {
    paddingBottom: 10,
  },
  gridWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // Sử dụng justifyContent space-between để căn đều 2 bên
    justifyContent: 'space-between', 
  },
  
  // --- STYLE MỚI: COMPACT CHIP ---
  tableItemCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1.5, // Thêm viền mỏng
    minHeight: 45,
  },
  iconBadge: {
    width: 28, height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  tableName: {
    fontWeight: 'bold',
    fontSize: 13,
    flex: 1, // Để text tự xuống dòng nếu quá dài
  },

  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
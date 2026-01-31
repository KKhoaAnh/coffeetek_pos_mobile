import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Modal, Portal, Surface, Divider, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/app.constant';
import { Table } from '../store/table.store'; // Cập nhật đường dẫn import đúng store của bạn

const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  table: Table | null;
  onDismiss: () => void;
  onOrder: () => void;
  onMove: () => void;
  onMerge: () => void;
}

export const TableActionModal = ({ visible, table, onDismiss, onOrder, onMove, onMerge }: Props) => {
  if (!table) return null;

  // Component nút bấm chức năng
  const ActionButton = ({ icon, label, color, bgColor, onPress }: any) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.actionBtnWrapper}>
      <Surface style={[styles.actionSurface, { backgroundColor: bgColor }]} elevation={2}>
        <MaterialCommunityIcons name={icon} size={28} color={color} />
      </Surface>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Portal>
      <Modal 
        visible={visible} 
        onDismiss={onDismiss} 
        contentContainerStyle={styles.modalContainer}
        dismissable={true}
      >
        {/* Header với nút đóng */}
        <View style={styles.header}>
           <View>
              <Text variant="headlineSmall" style={{fontWeight: 'bold', color: Colors.primary}}>
                {table.table_name}
              </Text>
              <View style={styles.statusBadge}>
                <View style={[styles.dot, {backgroundColor: Colors.red}]} />
                <Text style={{color: '#666', fontSize: 13}}>Đang phục vụ</Text>
              </View>
           </View>
           <IconButton icon="close" size={24} onPress={onDismiss} style={{marginRight: -10, marginTop: -10}}/>
        </View>

        <Divider style={{marginVertical: 20}} />

        {/* Khu vực các nút chức năng */}
        <View style={styles.actionsContainer}>
           <ActionButton 
             icon="file-document-edit-outline" 
             label="Xem / Sửa Đơn" 
             color={Colors.primary} 
             bgColor="#E3F2FD" // Xanh dương nhạt
             onPress={onOrder}
           />

           <ActionButton 
             icon="arrow-right-bold-box-outline" 
             label="Chuyển Bàn" 
             color={Colors.green} 
             bgColor="#E8F5E9" // Xanh lá nhạt
             onPress={onMove}
           />

           <ActionButton 
             icon="call-merge" 
             label="Gộp Bàn" 
             color={Colors.red} 
             bgColor="#FCE4EC" // Hồng nhạt
             onPress={onMerge}
           />
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    marginHorizontal: width * 0.08, // Cách lề màn hình 8%
    borderRadius: 24, // Bo góc mạnh hơn cho hiện đại
    padding: 24,
    elevation: 5, // Bóng đổ cho Android
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#F5F5F5',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12
  },
  dot: {
    width: 8, height: 8, borderRadius: 4, marginRight: 6
  },
  
  // Styles cho nút bấm
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Căn đều các nút
  },
  actionBtnWrapper: {
    alignItems: 'center',
    width: 80, // Cố định chiều rộng để căn chữ đều nhau
  },
  actionSurface: {
    width: 60,
    height: 60,
    borderRadius: 20, // Bo tròn kiểu squircle hiện đại
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444',
    textAlign: 'center'
  }
});
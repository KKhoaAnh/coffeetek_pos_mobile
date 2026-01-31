import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Surface, Button, IconButton, Modal, Portal, TextInput, Checkbox, Divider, FAB } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { ManagerHeader } from '../../components/ManagerHeader';
import { Colors } from '../../constants/app.constant';
import { formatCurrency } from '../../utils/format';
import { modifierApi } from '../../api/modifier.api';

// Định nghĩa kiểu dữ liệu (Khớp với controller)
interface Modifier {
  modifier_id: number;
  modifier_name: string;
  extra_price: number;
  group_id: number;
}

interface ModifierGroup {
  group_id: number;
  group_name: string;
  is_multi_select: number | boolean; // Backend trả về 0/1 hoặc true/false
  is_required: number | boolean;
  modifiers: Modifier[];
}

export const ModifierManagementScreen = () => {
  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [loading, setLoading] = useState(false);

  // --- STATE CHO MODAL ---
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE_GROUP' | 'CREATE_MOD' | 'EDIT_MOD'>('CREATE_GROUP');
  
  // Dữ liệu form
  const [targetGroupId, setTargetGroupId] = useState<number | null>(null);
  const [editingModId, setEditingModId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('0');
  
  // Checkbox cho Group
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [isRequired, setIsRequired] = useState(false);

  // --- LOAD DATA ---
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await modifierApi.getAll();
      setGroups(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert("Lỗi", "Không thể tải danh sách tùy chọn");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // --- ACTIONS ---

  const handleOpenCreateGroup = () => {
    setModalMode('CREATE_GROUP');
    setName('');
    setIsMultiSelect(false);
    setIsRequired(false);
    setModalVisible(true);
  };

  const handleOpenCreateMod = (groupId: number) => {
    setModalMode('CREATE_MOD');
    setTargetGroupId(groupId);
    setName('');
    setPrice('0');
    setModalVisible(true);
  };

  const handleOpenEditMod = (mod: Modifier) => {
    setModalMode('EDIT_MOD');
    setEditingModId(mod.modifier_id);
    setName(mod.modifier_name);
    setPrice(mod.extra_price.toString());
    setModalVisible(true);
  };

  const handleDeleteMod = (modId: number) => {
    Alert.alert("Xác nhận", "Bạn có chắc muốn xóa tùy chọn này?", [
      { text: "Hủy", style: "cancel" },
      { text: "Xóa", style: "destructive", onPress: async () => {
          try {
            await modifierApi.deleteModifier(modId);
            loadData();
          } catch (e) { Alert.alert("Lỗi", "Không thể xóa"); }
      }}
    ]);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return Alert.alert("Lỗi", "Vui lòng nhập tên");

    try {
      if (modalMode === 'CREATE_GROUP') {
        await modifierApi.createGroup({
          group_name: name,
          is_multi_select: isMultiSelect,
          is_required: isRequired
        });
      } 
      else if (modalMode === 'CREATE_MOD' && targetGroupId) {
        await modifierApi.createModifier({
          group_id: targetGroupId,
          modifier_name: name,
          extra_price: parseFloat(price) || 0
        });
      }
      else if (modalMode === 'EDIT_MOD' && editingModId) {
        await modifierApi.updateModifier(editingModId, {
          modifier_name: name,
          extra_price: parseFloat(price) || 0
        });
      }

      setModalVisible(false);
      loadData(); // Refresh lại danh sách
      Alert.alert("Thành công", "Đã lưu thay đổi");

    } catch (error) {
      console.error(error);
      Alert.alert("Lỗi", "Thao tác thất bại");
    }
  };

  // --- RENDER ITEM ---
  
  return (
    <View style={styles.container}>
      <ManagerHeader title="Quản lý Modifiers" subtitle="Thiết lập nhóm và tùy chọn món" />

      <ScrollView contentContainerStyle={styles.content}>
        {groups.map((group) => (
          <Surface key={group.group_id} style={styles.groupCard} elevation={2}>
            
            {/* HEADER CỦA GROUP */}
            <View style={styles.groupHeader}>
              <View>
                <Text variant="titleMedium" style={{fontWeight: 'bold', color: Colors.primary}}>
                  {group.group_name}
                </Text>
                <View style={{flexDirection: 'row', marginTop: 4}}>
                  {/* Chuyển đổi 1/0 thành boolean để hiển thị */}
                  {Boolean(group.is_required) && <Text style={styles.tag}>Bắt buộc</Text>}
                  {Boolean(group.is_multi_select) && <Text style={[styles.tag, {backgroundColor: '#E3F2FD', color: Colors.blue}]}>Chọn nhiều</Text>}
                </View>
              </View>
              <IconButton 
                icon="plus-circle" 
                iconColor={Colors.green} 
                size={26}
                onPress={() => handleOpenCreateMod(group.group_id)}
              />
            </View>

            <Divider style={{marginVertical: 10}}/>

            {/* DANH SÁCH MODIFIER CON */}
            {group.modifiers.length === 0 ? (
              <Text style={{fontStyle: 'italic', color: '#999', textAlign: 'center', marginBottom: 10}}>Chưa có tùy chọn nào</Text>
            ) : (
              group.modifiers.map(mod => (
                <TouchableOpacity 
                  key={mod.modifier_id} 
                  style={styles.modRow}
                  onPress={() => handleOpenEditMod(mod)}
                >
                  <Text style={{fontSize: 15}}>{mod.modifier_name}</Text>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text style={{fontWeight: 'bold', color: '#555', marginRight: 10}}>
                      {mod.extra_price > 0 ? `+${formatCurrency(mod.extra_price)}` : '0đ'}
                    </Text>
                    <IconButton 
                      icon="trash-can-outline" 
                      size={20} 
                      iconColor={Colors.red} 
                      onPress={() => handleDeleteMod(mod.modifier_id)}
                      style={{margin: 0}}
                    />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </Surface>
        ))}
        <View style={{height: 80}} />
      </ScrollView>

      {/* FAB THÊM NHÓM */}
      <FAB
        icon="folder-plus"
        label="Tạo Nhóm Mới"
        style={styles.fab}
        onPress={handleOpenCreateGroup}
        color="white"
      />

      {/* MODAL NHẬP LIỆU CHUNG CHO CẢ 3 TRƯỜNG HỢP */}
      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modalContent}>
          <Text variant="headlineSmall" style={{fontWeight: 'bold', marginBottom: 15, textAlign: 'center'}}>
            {modalMode === 'CREATE_GROUP' ? 'Thêm Nhóm Mới' : (modalMode === 'CREATE_MOD' ? 'Thêm tùy chọn' : 'Sửa tùy chọn')}
          </Text>

          <TextInput
            label="Tên hiển thị"
            value={name}
            onChangeText={setName}
            mode="outlined"
            activeOutlineColor={Colors.primary}
            style={{marginBottom: 10, backgroundColor: 'white'}}
          />

          {/* NẾU LÀ TẠO GROUP -> HIỆN CHECKBOX */}
          {modalMode === 'CREATE_GROUP' && (
            <View>
              <View style={styles.checkboxRow}>
                <Checkbox status={isMultiSelect ? 'checked' : 'unchecked'} onPress={() => setIsMultiSelect(!isMultiSelect)} color={Colors.primary} />
                <Text onPress={() => setIsMultiSelect(!isMultiSelect)}>Cho phép chọn nhiều?</Text>
              </View>
              <View style={styles.checkboxRow}>
                <Checkbox status={isRequired ? 'checked' : 'unchecked'} onPress={() => setIsRequired(!isRequired)} color={Colors.primary} />
                <Text onPress={() => setIsRequired(!isRequired)}>Bắt buộc phải chọn?</Text>
              </View>
            </View>
          )}

          {/* NẾU LÀ MODIFIER -> HIỆN GIÁ TIỀN */}
          {modalMode !== 'CREATE_GROUP' && (
            <TextInput
              label="Giá thêm (VNĐ)"
              value={price}
              onChangeText={setPrice}
              mode="outlined"
              keyboardType="numeric"
              activeOutlineColor={Colors.primary}
              style={{marginBottom: 10, backgroundColor: 'white'}}
              right={<TextInput.Affix text="đ" />}
            />
          )}

          <Button mode="contained" onPress={handleSubmit} style={{marginTop: 10, backgroundColor: Colors.primary}}>
            LƯU LẠI
          </Button>
        </Modal>
      </Portal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6F8' },
  content: { padding: 16 },
  groupCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  tag: {
    fontSize: 10,
    backgroundColor: '#FFEBEE',
    color: Colors.red,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
    fontWeight: 'bold'
  },
  modRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5
  }
});
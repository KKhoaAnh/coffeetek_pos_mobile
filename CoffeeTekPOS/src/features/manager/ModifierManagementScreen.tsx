import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Button, IconButton, Modal, Portal, TextInput, Checkbox, FAB } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { ManagerHeader } from '../../components/ManagerHeader';
import { Colors } from '../../constants/app.constant';
import { formatCurrency } from '../../utils/format';
import { modifierApi } from '../../api/modifier.api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Định nghĩa kiểu dữ liệu
interface Modifier {
  modifier_id: number;
  modifier_name: string;
  extra_price: number;
  group_id: number;
}

interface ModifierGroup {
  group_id: number;
  group_name: string;
  is_multi_select: number | boolean;
  is_required: number | boolean;
  modifiers: Modifier[];
}

export const ModifierManagementScreen = () => {
  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE_GROUP' | 'CREATE_MOD' | 'EDIT_MOD'>('CREATE_GROUP');

  const [targetGroupId, setTargetGroupId] = useState<number | null>(null);
  const [editingModId, setEditingModId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('0');

  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [isRequired, setIsRequired] = useState(false);

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
      {
        text: "Xóa", style: "destructive", onPress: async () => {
          try {
            await modifierApi.deleteModifier(modId);
            loadData();
          } catch (e) { Alert.alert("Lỗi", "Không thể xóa"); }
        }
      }
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
      loadData();
      Alert.alert("Thành công", "Đã lưu thay đổi");

    } catch (error) {
      console.error(error);
      Alert.alert("Lỗi", "Thao tác thất bại");
    }
  };

  return (
    <View style={styles.container}>
      <ManagerHeader title="Quản lý tùy chọn" subtitle="Nhóm tùy chọn & topping" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {groups.map((group) => (
          <View key={group.group_id} style={styles.groupCard}>

            {/* HEADER CỦA GROUP */}
            <View style={styles.groupHeader}>
              <View style={{ flex: 1 }}>
                <Text variant="titleMedium" style={styles.groupTitle}>
                  {group.group_name}
                </Text>
                <View style={{ flexDirection: 'row', marginTop: 4 }}>
                  {Boolean(group.is_required) && (
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>Bắt buộc</Text>
                    </View>
                  )}
                  {Boolean(group.is_multi_select) && (
                    <View style={[styles.tag, styles.tagBlue]}>
                      <Text style={[styles.tagText, styles.tagBlueText]}>Chọn nhiều</Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={styles.addModBtn}
                onPress={() => handleOpenCreateMod(group.group_id)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="plus" size={18} color="#8D6E63" />
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* DANH SÁCH MODIFIER CON */}
            {group.modifiers.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có tùy chọn nào</Text>
            ) : (
              group.modifiers.map((mod, index) => (
                <TouchableOpacity
                  key={mod.modifier_id}
                  style={[
                    styles.modRow,
                    index === group.modifiers.length - 1 && { borderBottomWidth: 0 }
                  ]}
                  onPress={() => handleOpenEditMod(mod)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modName}>{mod.modifier_name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.modPrice}>
                      {mod.extra_price > 0 ? `+${formatCurrency(mod.extra_price)}` : '0đ'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteMod(mod.modifier_id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.deleteBtn}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={16} color="#C47B6F" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        ))}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB THÊM NHÓM */}
      <FAB
        icon="folder-plus"
        label="Tạo nhóm mới"
        style={styles.fab}
        onPress={handleOpenCreateGroup}
        color="white"
      />

      {/* MODAL NHẬP LIỆU */}
      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modalContent}>
          <Text variant="headlineSmall" style={styles.modalTitle}>
            {modalMode === 'CREATE_GROUP' ? 'Thêm nhóm mới' : (modalMode === 'CREATE_MOD' ? 'Thêm tùy chọn' : 'Sửa tùy chọn')}
          </Text>

          <TextInput
            label="Tên hiển thị"
            value={name}
            onChangeText={setName}
            mode="outlined"
            activeOutlineColor="#8D6E63"
            outlineColor="#DDD9D3"
            textColor="#4A4540"
            style={styles.input}
            theme={{
              colors: { onSurfaceVariant: '#A09B94' }
            }}
          />

          {/* NẾU LÀ TẠO GROUP -> HIỆN CHECKBOX */}
          {modalMode === 'CREATE_GROUP' && (
            <View>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setIsMultiSelect(!isMultiSelect)}
                activeOpacity={0.7}
              >
                <Checkbox
                  status={isMultiSelect ? 'checked' : 'unchecked'}
                  onPress={() => setIsMultiSelect(!isMultiSelect)}
                  color="#8D6E63"
                  uncheckedColor="#DDD9D3"
                />
                <Text style={styles.checkboxLabel}>Cho phép chọn nhiều?</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setIsRequired(!isRequired)}
                activeOpacity={0.7}
              >
                <Checkbox
                  status={isRequired ? 'checked' : 'unchecked'}
                  onPress={() => setIsRequired(!isRequired)}
                  color="#8D6E63"
                  uncheckedColor="#DDD9D3"
                />
                <Text style={styles.checkboxLabel}>Bắt buộc phải chọn?</Text>
              </TouchableOpacity>
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
              activeOutlineColor="#8D6E63"
              outlineColor="#DDD9D3"
              textColor="#4A4540"
              style={styles.input}
              theme={{
                colors: { onSurfaceVariant: '#A09B94' }
              }}
              right={<TextInput.Affix text="đ" />}
            />
          )}

          <View style={styles.modalActions}>
            <Button
              mode="text"
              onPress={() => setModalVisible(false)}
              textColor="#A09B94"
              style={{ flex: 1, marginRight: 8 }}
            >
              Hủy
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.saveBtn}
              contentStyle={{ height: 48 }}
            >
              Lưu thay đổi
            </Button>
          </View>
        </Modal>
      </Portal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F3F1' },
  content: { padding: 16 },

  groupCard: {
    backgroundColor: '#ffffffff',
    borderRadius: 18,
    marginBottom: 12,
    padding: 14,
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupTitle: {
    fontWeight: '600',
    color: '#5D4037',
    fontSize: 15,
  },

  tag: {
    backgroundColor: '#F0E6E4',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  tagText: {
    fontSize: 10,
    color: '#C47B6F',
    fontWeight: '600',
  },
  tagBlue: {
    backgroundColor: '#E6EDE4',
  },
  tagBlueText: {
    color: '#6B8F5E',
  },

  addModBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ECEAE6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  divider: {
    height: 0.7,
    backgroundColor: '#ECEAE6',
    marginVertical: 10,
  },

  modRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 0.7,
    borderBottomColor: '#ECEAE6',
  },
  modName: {
    fontSize: 14,
    color: '#4A4540',
    fontWeight: '500',
  },
  modPrice: {
    fontWeight: '600',
    color: '#6D4C41',
    fontSize: 13,
    marginRight: 8,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F0E6E4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#A09B94',
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 13,
  },

  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#8D6E63',
    borderRadius: 28,
  },

  // Modal
  modalContent: {
    backgroundColor: '#FAF9F7',
    padding: 24,
    margin: 20,
    borderRadius: 20,
    shadowColor: '#8D6E63',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  modalTitle: {
    fontWeight: '700',
    marginBottom: 18,
    textAlign: 'center',
    color: '#5D4037',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#FAF9F7',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    marginLeft: -4,
  },
  checkboxLabel: {
    color: '#4A4540',
    fontSize: 14,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  saveBtn: {
    backgroundColor: '#8D6E63',
    borderRadius: 14,
    flex: 1,
  },
});
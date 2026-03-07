import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Text,
  Switch,
  FAB,
  TextInput,
  Modal,
  Portal,
  Button,
  SegmentedButtons,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ManagerHeader } from '../../components/ManagerHeader';
import { Colors } from '../../constants/app.constant';
import { managerApi } from '../../api/manager.api';

const FAB_OFFSET = 16;

export const EmployeeManagementScreen = () => {
  const insets = useSafeAreaInsets();
  const [employees, setEmployees] = useState<any[]>([]);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const [editingEmp, setEditingEmp] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState('staff');
  const [isPinVisible, setIsPinVisible] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await managerApi.getEmployees();
      setEmployees(res.data);
    } catch (e) {
      console.log('Lỗi tải nhân viên', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    loadData();
  }, []));

  const handleSave = async () => {
    if (!fullName || !pin) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên và mã PIN (6 số)');
      return;
    }
    try {
      const payload = { fullName, pin, role };
      if (editingEmp) {
        await managerApi.updateEmployee(editingEmp.id, payload);
      } else {
        await managerApi.createEmployee(payload);
      }
      setVisible(false);
      loadData();
      Alert.alert('Thành công', 'Đã lưu thông tin nhân viên');
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Không thể lưu thông tin';
      Alert.alert('Lỗi', msg);
    }
  };

  const handleToggleStatus = async (item: any) => {
    const newValue = !item.is_active;
    setEmployees((prev) =>
      prev.map((e) => (e.id === item.id ? { ...e, is_active: newValue } : e))
    );
    try {
      await managerApi.toggleEmployeeStatus(item.id, newValue);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
      loadData();
    }
  };

  const openModal = (emp?: any) => {
    if (emp) {
      setEditingEmp(emp);
      setFullName(emp.fullName);
      setPin(emp.pin != null ? String(emp.pin) : '');
      setRole(emp.role || 'staff');
    } else {
      setEditingEmp(null);
      setFullName('');
      setPin('');
      setRole('staff');
    }
    setIsPinVisible(false);
    setVisible(true);
  };

  const fabBottom = FAB_OFFSET + insets.bottom;
  const listPaddingBottom = fabBottom + 56;

  const renderItem = ({ item }: { item: any }) => {
    const active = Boolean(item.is_active);
    const isManager = item.role === 'manager';
    return (
      <TouchableOpacity
        style={styles.gridItem}
        activeOpacity={0.8}
        onPress={() => openModal(item)}
      >
        <View style={[styles.card, !active && styles.cardInactive]}>
          {/* Avatar */}
          <View
            style={[
              styles.avatarCircle,
              { backgroundColor: active ? '#E6DDD8' : '#E8E4DF' },
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                { color: active ? '#8D6E63' : '#B5AEA7' },
              ]}
            >
              {(item.fullName || '?').charAt(0).toUpperCase()}
            </Text>
          </View>

          {/* Info */}
          <View style={styles.cardBody}>
            <Text
              variant="titleMedium"
              style={[styles.cardTitle, !active && styles.cardTitleInactive]}
              numberOfLines={1}
            >
              {item.fullName || 'Chưa đặt tên'}
            </Text>
            <View style={styles.roleRow}>
              <View
                style={[
                  styles.roleTag,
                  { backgroundColor: isManager ? '#E6DDD8' : '#ECEAE6' },
                ]}
              >
                <Text
                  style={[
                    styles.roleText,
                    { color: isManager ? '#8D6E63' : '#8A8580' },
                  ]}
                >
                  {isManager ? 'Quản lý' : 'Nhân viên'}
                </Text>
              </View>
            </View>
          </View>

          {/* Switch only - no edit button */}
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
      <ManagerHeader
        title="Quản lý nhân sự"
        subtitle="Danh sách nhân viên"
      />

      <FlatList
        data={employees}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: listPaddingBottom }]}
        refreshing={loading}
        onRefresh={loadData}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        icon="plus"
        label="Thêm NV"
        style={[styles.fab, { bottom: fabBottom }]}
        onPress={() => openModal()}
        color="#FFF"
      />

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            {editingEmp ? 'Cập nhật nhân sự' : 'Thêm nhân sự mới'}
          </Text>

          <TextInput
            label="Họ tên"
            value={fullName}
            onChangeText={setFullName}
            mode="outlined"
            style={styles.input}
            activeOutlineColor="#8D6E63"
            outlineColor="#DDD9D3"
            textColor="#4A4540"
            theme={{
              colors: {
                onSurfaceVariant: '#A09B94',
              }
            }}
          />

          <TextInput
            label="Mã PIN (6 số)"
            value={pin}
            onChangeText={(text) => setPin(text.replace(/[^0-9]/g, ''))}
            mode="outlined"
            secureTextEntry={!isPinVisible}
            keyboardType="numeric"
            maxLength={6}
            style={styles.input}
            activeOutlineColor="#8D6E63"
            outlineColor="#DDD9D3"
            textColor="#4A4540"
            theme={{
              colors: {
                onSurfaceVariant: '#A09B94',
              }
            }}
            right={
              <TextInput.Icon
                icon={isPinVisible ? 'eye-off' : 'eye'}
                onPress={() => setIsPinVisible(!isPinVisible)}
                color="#A09B94"
              />
            }
          />

          <Text style={styles.label}>Vai trò</Text>
          <SegmentedButtons
            value={role}
            onValueChange={setRole}
            buttons={[
              {
                value: 'cashier', label: 'Nhân viên',
                checkedColor: '#FFF', uncheckedColor: '#6B6560',
                style: role === 'cashier' ? styles.segBtnActive : styles.segBtnInactive
              },
              {
                value: 'manager', label: 'Quản lý',
                checkedColor: '#FFF', uncheckedColor: '#6B6560',
                style: role === 'manager' ? styles.segBtnActive : styles.segBtnInactive
              },
            ]}
            style={styles.segmented}
            theme={{
              colors: {
                secondaryContainer: '#8D6E63',
                onSecondaryContainer: '#FFF',
                outline: '#DDD9D3',
              }
            }}
          />

          <View style={styles.modalActions}>
            <Button
              mode="text"
              onPress={() => setVisible(false)}
              textColor="#A09B94"
              style={{ flex: 1, marginRight: 8 }}
            >
              Hủy
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.saveBtn}
              contentStyle={styles.saveBtnContent}
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
  listContent: { padding: 16 },
  gridItem: { marginBottom: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#ffffffff',
    minHeight: 76,
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardInactive: { opacity: 0.75, backgroundColor: '#EAE7E3' },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: { fontWeight: '700', fontSize: 17 },
  cardBody: { flex: 1, minWidth: 0, justifyContent: 'center' },
  cardTitle: { fontWeight: '600', fontSize: 15, color: '#4A4540' },
  cardTitleInactive: { color: '#B5AEA7' },
  roleRow: { flexDirection: 'row', marginTop: 5 },
  roleTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  roleText: { fontSize: 11, fontWeight: '600' },
  switchWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#8D6E63',
    borderRadius: 28,
  },
  modal: {
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
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '700',
    color: '#5D4037',
  },
  input: { marginBottom: 16, backgroundColor: '#FAF9F7' },
  label: { marginBottom: 10, fontWeight: '600', color: '#6B6560', fontSize: 14 },
  segmented: { marginBottom: 20 },
  segBtnActive: {
    backgroundColor: '#8D6E63',
    borderColor: '#8D6E63',
  },
  segBtnInactive: {
    backgroundColor: 'transparent',
    borderColor: '#DDD9D3',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  saveBtn: { backgroundColor: '#8D6E63', borderRadius: 14, flex: 1 },
  saveBtnContent: { height: 48 },
});

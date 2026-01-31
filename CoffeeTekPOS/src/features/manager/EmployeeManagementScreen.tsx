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
  Surface,
  IconButton,
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

const TAB_BAR_HEIGHT = 60;
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
    setVisible(true);
  };

  const fabBottom = FAB_OFFSET + insets.bottom;

  const listPaddingBottom = fabBottom + 56;

  const renderItem = ({ item }: { item: any }) => {
    const active = Boolean(item.is_active);
    const isManager = item.role === 'manager';
    return (
      <Surface
        style={[styles.card, !active && styles.cardInactive]}
        elevation={2}
      >
        <View
          style={[
            styles.avatarCircle,
            { backgroundColor: active ? Colors.primary + '18' : '#EEF2F4' },
          ]}
        >
          <Text
            style={[
              styles.avatarText,
              { color: active ? Colors.primary : '#94A3B8' },
            ]}
          >
            {(item.fullName || '?').charAt(0).toUpperCase()}
          </Text>
        </View>

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
                { backgroundColor: isManager ? Colors.primary + '18' : '#F1F5F9' },
              ]}
            >
              <Text
                style={[
                  styles.roleText,
                  { color: isManager ? Colors.primary : '#64748B' },
                ]}
              >
                {isManager ? 'Quản lý' : 'Nhân viên'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsWrap}>
          <View style={styles.switchWrap}>
            <Switch
              value={active}
              onValueChange={() => handleToggleStatus(item)}
              color={Colors.primary}
            />
          </View>
          <IconButton
            icon="pencil"
            size={22}
            iconColor="#64748B"
            onPress={() => openModal(item)}
            style={styles.editBtn}
          />
        </View>
      </Surface>
    );
  };

  return (
    <View style={styles.container}>
      <ManagerHeader
        title="Quản lý Nhân sự"
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
            {editingEmp ? 'Sửa Nhân Viên' : 'Thêm Nhân Viên'}
          </Text>

          <TextInput
            label="Họ tên"
            value={fullName}
            onChangeText={setFullName}
            mode="outlined"
            style={styles.input}
            activeOutlineColor={Colors.primary}
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
            activeOutlineColor={Colors.primary}
            right={
              <TextInput.Icon
                icon={isPinVisible ? 'eye-off' : 'eye'}
                onPress={() => setIsPinVisible(!isPinVisible)}
              />
            }
          />

          <Text style={styles.label}>Vai trò</Text>
          <SegmentedButtons
            value={role}
            onValueChange={setRole}
            buttons={[
              { value: 'cashier', label: 'Nhân viên' },
              { value: 'manager', label: 'Quản lý' },
            ]}
            style={styles.segmented}
          />

          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveBtn}
            contentStyle={styles.saveBtnContent}
          >
            Lưu lại
          </Button>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F4F8' },
  listContent: { padding: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFF',
    marginBottom: 12,
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardInactive: { opacity: 0.85, backgroundColor: '#F8FAFC' },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: { fontWeight: '700', fontSize: 18 },
  cardBody: { flex: 1, minWidth: 0, justifyContent: 'center' },
  cardTitle: { fontWeight: '700', fontSize: 16, color: '#2D3748' },
  cardTitleInactive: { color: '#94A3B8' },
  roleRow: { flexDirection: 'row', marginTop: 6 },
  roleTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  roleText: { fontSize: 12, fontWeight: '600' },
  actionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginLeft: 4,
  },
  editBtn: { margin: 0 },
  fab: {
    position: 'absolute',
    right: 16,
    backgroundColor: Colors.primary,
  },
  modal: {
    backgroundColor: '#FFF',
    padding: 24,
    margin: 20,
    borderRadius: 20,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  input: { marginBottom: 16, backgroundColor: '#FFF' },
  label: { marginBottom: 10, fontWeight: '600', color: '#475569', fontSize: 14 },
  segmented: { marginBottom: 20 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12 },
  saveBtnContent: { height: 48 },
});

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

export const TableManagementScreen = () => {
  const insets = useSafeAreaInsets();
  const [tables, setTables] = useState<any[]>([]);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const [editingTable, setEditingTable] = useState<any>(null);
  const [name, setName] = useState('');
  const [shape, setShape] = useState('SQUARE');
  const [isActive, setIsActive] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await managerApi.getTables();
      setTables(res.data);
    } catch (e) {
      console.log('Lỗi load bàn', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    loadData();
  }, []));

  const openModal = (table?: any) => {
    if (table) {
      setEditingTable(table);
      setName(table.table_name);
      setShape(table.shape || 'SQUARE');
      setIsActive(Boolean(table.is_active));
    } else {
      setEditingTable(null);
      setName('');
      setShape('SQUARE');
      setIsActive(true);
    }
    setVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên bàn');
      return;
    }
    try {
      const payload = {
        table_name: name,
        shape,
        is_active: isActive ? 1 : 0,
        color: '#FFFFFF',
      };
      if (editingTable) {
        await managerApi.updateTable(editingTable.table_id, payload);
      } else {
        await managerApi.createTable(payload);
      }
      setVisible(false);
      loadData();
    } catch (e) {
      Alert.alert('Lỗi', 'Thao tác thất bại');
    }
  };

  const getShapeIcon = (shapeType: string) => {
    switch (shapeType) {
      case 'CIRCLE':
        return 'circle-outline';
      case 'RECTANGLE':
        return 'rectangle-outline';
      default:
        return 'square-outline';
    }
  };

  const fabBottom = FAB_OFFSET + insets.bottom;

  const listPaddingBottom = fabBottom + 56;

  const renderItem = ({ item }: { item: any }) => {
    const active = Boolean(item.is_active);
    return (
      <TouchableOpacity
        style={styles.gridItem}
        activeOpacity={0.7}
        onPress={() => openModal(item)}
      >
        <Surface
          style={[styles.card, !active && styles.inactiveCard]}
          elevation={2}
        >
          <View
            style={[
              styles.iconBox,
              { backgroundColor: active ? Colors.primary + '18' : '#EEF2F4' },
            ]}
          >
            <MaterialCommunityIcons
              name={getShapeIcon(item.shape) as any}
              size={28}
              color={active ? Colors.primary : '#94A3B8'}
            />
          </View>

          <View style={styles.cardBody}>
            <Text
              variant="titleMedium"
              style={[styles.cardTitle, !active && styles.cardTitleInactive]}
              numberOfLines={1}
            >
              {item.table_name}
            </Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: active ? Colors.green : '#CBD5E1' },
                ]}
              />
              <Text
                variant="bodySmall"
                style={[styles.statusText, !active && styles.statusTextInactive]}
              >
                {active ? 'Hoạt động' : 'Đang ẩn'}
              </Text>
            </View>
          </View>

          <View style={styles.switchWrap}>
            <Switch
              value={active}
              onValueChange={async () => {
                const newValue = !active;
                const newValInt = newValue ? 1 : 0;
                setTables((prev) =>
                  prev.map((t) =>
                    t.table_id === item.table_id
                      ? { ...t, is_active: newValInt }
                      : t
                  )
                );
                try {
                  await managerApi.updateTable(item.table_id, {
                    ...item,
                    is_active: newValInt,
                    color: item.color || '#FFFFFF',
                  });
                } catch (e) {
                  console.error(e);
                  loadData();
                }
              }}
              color={Colors.primary}
            />
          </View>
        </Surface>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ManagerHeader
        title="Quản lý Bàn"
        subtitle="Sơ đồ & Trạng thái"
      />

      <FlatList
        data={tables}
        keyExtractor={(t) => t.table_id.toString()}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: listPaddingBottom }]}
        numColumns={1}
        refreshing={loading}
        onRefresh={loadData}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        icon="plus"
        label="Thêm Bàn"
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
            {editingTable ? 'Cập nhật Bàn' : 'Thêm Bàn Mới'}
          </Text>

          <TextInput
            label="Tên bàn (VD: Bàn Vip 1)"
            value={name}
            onChangeText={setName}
            mode="outlined"
            activeOutlineColor={Colors.primary}
            style={styles.input}
          />

          <Text style={styles.label}>Hình dáng bàn</Text>
          <SegmentedButtons
            value={shape}
            onValueChange={setShape}
            buttons={[
              { value: 'SQUARE', label: 'Vuông', icon: 'square-outline' },
              { value: 'RECTANGLE', label: 'CN', icon: 'rectangle-outline' },
              { value: 'CIRCLE', label: 'Tròn', icon: 'circle-outline' },
            ]}
            style={styles.segmented}
            density="medium"
          />

          <View style={styles.rowCenter}>
            <Text style={styles.rowLabel}>Trạng thái hoạt động</Text>
            <View style={styles.modalSwitchWrap}>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                color={Colors.primary}
              />
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveBtn}
            contentStyle={styles.saveBtnContent}
          >
            Lưu thay đổi
          </Button>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F4F8' },
  listContent: { padding: 16 },
  gridItem: { marginBottom: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFF',
    minHeight: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  inactiveCard: { opacity: 0.85, backgroundColor: '#F8FAFC' },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardBody: { flex: 1, minWidth: 0, justifyContent: 'center' },
  cardTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: '#2D3748',
  },
  cardTitleInactive: { color: '#94A3B8' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  statusTextInactive: { color: '#94A3B8' },
  switchWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginLeft: 8,
  },
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
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: Colors.primary,
  },
  input: { marginBottom: 16, backgroundColor: '#FFF' },
  label: { marginBottom: 10, fontWeight: '600', color: '#475569', fontSize: 14 },
  segmented: { marginBottom: 20 },
  rowCenter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    minHeight: 48,
  },
  rowLabel: { fontSize: 15, color: '#374151', fontWeight: '500' },
  modalSwitchWrap: { justifyContent: 'center' },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12 },
  saveBtnContent: { height: 48 },
});

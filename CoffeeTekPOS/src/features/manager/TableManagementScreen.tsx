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
        activeOpacity={0.8}
        onPress={() => openModal(item)}
      >
        <View
          style={[styles.card, !active && styles.inactiveCard]}
        >
          <View
            style={[
              styles.iconBox,
              { backgroundColor: active ? '#E6DDD8' : '#E8E4DF' },
            ]}
          >
            <MaterialCommunityIcons
              name={getShapeIcon(item.shape) as any}
              size={24}
              color={active ? '#8D6E63' : '#B5AEA7'}
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
                  { backgroundColor: active ? '#8DB580' : '#D5CFC9' },
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
        title="Quản lý bàn"
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
            {editingTable ? 'Cập nhật bàn' : 'Thêm bàn mới'}
          </Text>

          <TextInput
            label="Tên bàn (VD: Bàn 01)"
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
  inactiveCard: { opacity: 0.75, backgroundColor: '#EAE7E3' },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardBody: { flex: 1, minWidth: 0, justifyContent: 'center' },
  cardTitle: {
    fontWeight: '600',
    fontSize: 15,
    color: '#4A4540',
  },
  cardTitleInactive: { color: '#B5AEA7' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 6,
  },
  statusText: { fontSize: 12, color: '#6B6560', fontWeight: '500' },
  statusTextInactive: { color: '#B5AEA7' },
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
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
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
  rowCenter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    minHeight: 48,
  },
  rowLabel: { fontSize: 15, color: '#4A4540', fontWeight: '500' },
  modalSwitchWrap: { justifyContent: 'center' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  saveBtn: { backgroundColor: '#8D6E63', borderRadius: 14, flex: 1 },
  saveBtnContent: { height: 48 },
});

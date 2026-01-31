import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Text, Surface, Searchbar, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useInventoryStore,
  RawInventoryItem,
  getUnitLabel,
  InventoryUnit,
} from '../../store/inventory.store';
import { ManagerHeader } from '../../components/ManagerHeader';
import { Colors } from '../../constants/app.constant';

/** Tông nâu/trắng/đen theo hệ thống */
const UNIT_ACCENT: Record<InventoryUnit, string> = {
  goi: Colors.primary,
  bich: Colors.secondary,
  kg: '#6D4C41',
  gam: '#4E342E',
};

const TAB_BAR_HEIGHT = 60;
const FAB_OFFSET = 16;

type AdjustMode = 'add' | 'subtract';

export const InventoryScreen = () => {
  const insets = useSafeAreaInsets();
  const { items, updateQuantity, addItem, hasItemByName } = useInventoryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState<InventoryUnit | 'all'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RawInventoryItem | null>(null);
  const [adjustMode, setAdjustMode] = useState<AdjustMode>('add');
  const [amount, setAmount] = useState('');

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState<InventoryUnit>('bich');
  const [newQty, setNewQty] = useState('');

  const filteredItems = useMemo(() => {
    let list = items;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q));
    }
    if (unitFilter !== 'all') {
      list = list.filter((i) => i.unit === unitFilter);
    }
    return list;
  }, [items, searchQuery, unitFilter]);

  const openModal = (item: RawInventoryItem, mode: AdjustMode) => {
    setSelectedItem(item);
    setAdjustMode(mode);
    setAmount('');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
    setAmount('');
  };

  const openAddModal = () => {
    setNewName('');
    setNewUnit('bich');
    setNewQty('0');
    setAddModalVisible(true);
  };

  const closeAddModal = () => {
    setAddModalVisible(false);
    setNewName('');
    setNewUnit('bich');
    setNewQty('0');
  };

  const handleAddNewItem = () => {
    const nameTrim = newName.trim();
    if (!nameTrim) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên nguyên liệu.');
      return;
    }
    if (hasItemByName(nameTrim)) {
      Alert.alert('Trùng tên', 'Đã có nguyên liệu này trong kho. Không cần thêm nữa.');
      return;
    }
    const qty = Math.max(0, parseInt(newQty, 10) || 0);
    addItem({
      name: nameTrim,
      unit: newUnit,
      quantity: qty,
      icon: 'package-variant',
    });
    closeAddModal();
  };

  const handleConfirm = () => {
    if (!selectedItem) return;
    const num = parseInt(amount, 10);
    if (isNaN(num) || num <= 0) return;
    const delta = adjustMode === 'add' ? num : -num;
    updateQuantity(selectedItem.id, delta);
    closeModal();
  };

  const isValidAmount = () => {
    const num = parseInt(amount, 10);
    if (isNaN(num) || num <= 0) return false;
    if (adjustMode === 'subtract' && selectedItem) {
      return num <= selectedItem.quantity;
    }
    return true;
  };

  const unitFilters: { key: InventoryUnit | 'all'; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'goi', label: 'Gói' },
    { key: 'bich', label: 'Bịch' },
    { key: 'kg', label: 'Kg' },
    { key: 'gam', label: 'Gam' },
  ];

  const fabBottom = FAB_OFFSET + insets.bottom;
  const listPaddingBottom = fabBottom + 64;

  return (
    <View style={styles.container}>
      <ManagerHeader
        title="Quản lý kho"
        subtitle="Nguyên liệu thô • Cập nhật & xuất"
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.searchWrap}>
          <Searchbar
            placeholder="Tìm nguyên liệu..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            iconColor={Colors.primary}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipWrap}
          style={styles.chipScroll}
        >
          {unitFilters.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setUnitFilter(f.key)}
              activeOpacity={0.8}
              style={[
                styles.chip,
                unitFilter === f.key && styles.chipActive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  unitFilter === f.key && styles.chipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          contentContainerStyle={[styles.listContent, { paddingBottom: listPaddingBottom }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filteredItems.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons
                name="package-variant-closed"
                size={56}
                color="#BCAAA4"
              />
              <Text style={styles.emptyText}>Không có nguyên liệu phù hợp</Text>
            </View>
          ) : (
            filteredItems.map((item) => (
              <InventoryCard
                key={item.id}
                item={item}
                onAdd={() => openModal(item, 'add')}
                onSubtract={() => openModal(item, 'subtract')}
              />
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <FAB
        icon="plus"
        label="Thêm nguyên liệu"
        style={[styles.fab, { bottom: fabBottom }]}
        onPress={openAddModal}
        color="#FFF"
      />

      {/* Modal Nhập thêm / Xuất */}
      <Modal
        isVisible={modalVisible}
        onBackdropPress={closeModal}
        onBackButtonPress={closeModal}
        avoidKeyboard
        style={styles.modal}
        backdropOpacity={0.5}
        animationIn="fadeInUp"
        animationOut="fadeOutDown"
      >
        <Surface style={styles.modalCard} elevation={5}>
          <View style={styles.modalHeader}>
            <MaterialCommunityIcons
              name={adjustMode === 'add' ? 'package-variant-closed' : 'package-variant'}
              size={26}
              color={adjustMode === 'add' ? Colors.primary : Colors.secondary}
            />
            <Text style={styles.modalTitle} numberOfLines={2}>
              {adjustMode === 'add' ? 'Nhập thêm' : 'Xuất kho'} — {selectedItem?.name}
            </Text>
            <Text style={styles.modalUnit} numberOfLines={1}>
              Đơn vị: {selectedItem && getUnitLabel(selectedItem.unit)}
              {selectedItem != null && (
                <> • Hiện có: <Text style={styles.modalQty}>{selectedItem.quantity}</Text></>
              )}
            </Text>
          </View>

          <RNTextInput
            placeholder="Số lượng"
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
            style={styles.input}
            placeholderTextColor="#9E9E9E"
          />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalBtnCancel} onPress={closeModal}>
              <Text style={styles.modalBtnCancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtnConfirm, !isValidAmount() && styles.modalBtnDisabled]}
              onPress={handleConfirm}
              disabled={!isValidAmount()}
            >
              <Text style={styles.modalBtnConfirmText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </Surface>
      </Modal>

      {/* Modal Thêm nguyên liệu mới */}
      <Modal
        isVisible={addModalVisible}
        onBackdropPress={closeAddModal}
        onBackButtonPress={closeAddModal}
        avoidKeyboard
        style={styles.modal}
        backdropOpacity={0.5}
        animationIn="fadeInUp"
        animationOut="fadeOutDown"
      >
        <Surface style={styles.modalCard} elevation={5}>
          <View style={styles.modalHeader}>
            <MaterialCommunityIcons name="plus-circle-outline" size={26} color={Colors.primary} />
            <Text style={styles.modalTitle}>Thêm nguyên liệu mới</Text>
            <Text style={styles.modalUnit}>Tên không trùng với nguyên liệu đã có</Text>
          </View>

          <RNTextInput
            placeholder="Tên nguyên liệu (VD: Sữa tươi)"
            value={newName}
            onChangeText={setNewName}
            style={styles.input}
            placeholderTextColor="#9E9E9E"
          />

          <Text style={styles.label}>Đơn vị</Text>
          <View style={styles.unitRow}>
            {(['goi', 'bich', 'kg', 'gam'] as const).map((u) => (
              <TouchableOpacity
                key={u}
                onPress={() => setNewUnit(u)}
                style={[styles.unitChip, newUnit === u && styles.unitChipActive]}
              >
                <Text style={[styles.unitChipText, newUnit === u && styles.unitChipTextActive]}>
                  {getUnitLabel(u)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <RNTextInput
            placeholder="Số lượng ban đầu (0 nếu chưa nhập)"
            value={newQty}
            onChangeText={(t) => setNewQty(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            style={styles.input}
            placeholderTextColor="#9E9E9E"
          />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalBtnCancel} onPress={closeAddModal}>
              <Text style={styles.modalBtnCancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtnConfirm, !newName.trim() && styles.modalBtnDisabled]}
              onPress={handleAddNewItem}
              disabled={!newName.trim()}
            >
              <Text style={styles.modalBtnConfirmText}>Thêm</Text>
            </TouchableOpacity>
          </View>
        </Surface>
      </Modal>
    </View>
  );
};

interface InventoryCardProps {
  item: RawInventoryItem;
  onAdd: () => void;
  onSubtract: () => void;
}

const InventoryCard = ({ item, onAdd, onSubtract }: InventoryCardProps) => {
  const accent = UNIT_ACCENT[item.unit];
  const iconName = (item.icon as any) || 'package-variant';

  return (
    <Surface style={styles.card} elevation={2}>
      <View style={[styles.iconWrap, { backgroundColor: accent + '18' }]}>
        <MaterialCommunityIcons name={iconName} size={26} color={accent} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.cardMeta}>
          <Text style={[styles.cardUnit, { color: accent }]} numberOfLines={1}>
            {getUnitLabel(item.unit)}
          </Text>
          <Text style={styles.cardQty}>{item.quantity}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.cardBtn, styles.cardBtnAdd]}
            onPress={onAdd}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#FFF" />
            <Text style={styles.cardBtnAddText} numberOfLines={1}>Nhập</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cardBtn, styles.cardBtnSub, item.quantity === 0 && styles.cardBtnDisabled]}
            onPress={onSubtract}
            activeOpacity={0.8}
            disabled={item.quantity === 0}
          >
            <MaterialCommunityIcons name="minus" size={18} color="#FFF" />
            <Text style={styles.cardBtnSubText} numberOfLines={1}>Xuất</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFEBE9' },
  flex: { flex: 1 },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  searchBar: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    elevation: 0,
    shadowOpacity: 0,
  },
  searchInput: { minHeight: 0, fontSize: 15 },
  chipScroll: { maxHeight: 44, marginBottom: 8 },
  chipWrap: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    height: 32,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    marginRight: 8,
  },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { fontSize: 13, color: '#5D4037', fontWeight: '500' },
  chipTextActive: { color: '#FFF', fontWeight: '600' },
  listContent: { padding: 16 },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: { marginTop: 12, fontSize: 15, color: '#8D6E63' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: '#FFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardBody: { flex: 1, minWidth: 0, justifyContent: 'center' },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3E2723',
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardUnit: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginRight: 8,
  },
  cardQty: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginRight: 8,
    flex: 1,
    minWidth: 0,
  },
  cardBtnAdd: { backgroundColor: Colors.primary },
  cardBtnSub: { backgroundColor: Colors.secondary },
  cardBtnDisabled: { opacity: 0.5 },
  cardBtnAddText: { color: '#FFF', fontWeight: '600', fontSize: 12 },
  cardBtnSubText: { color: '#FFF', fontWeight: '600', fontSize: 12 },
  fab: {
    position: 'absolute',
    right: 16,
    backgroundColor: Colors.primary,
  },
  modal: { justifyContent: 'flex-end', margin: 0 },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
    backgroundColor: '#FFF',
  },
  modalHeader: { marginBottom: 18 },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#3E2723',
    marginTop: 8,
  },
  modalUnit: { fontSize: 13, color: '#6D4C41', marginTop: 4 },
  modalQty: { fontWeight: '700', color: Colors.primary },
  input: {
    borderWidth: 2,
    borderColor: '#D7CCC8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#3E2723',
    backgroundColor: '#FAFAFA',
  },
  label: { marginBottom: 8, fontWeight: '600', color: '#5D4037', fontSize: 14 },
  unitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  unitChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#EFEBE9',
    marginRight: 8,
    marginBottom: 8,
  },
  unitChipActive: { backgroundColor: Colors.primary },
  unitChipText: { fontSize: 13, fontWeight: '600', color: '#5D4037' },
  unitChipTextActive: { color: '#FFF' },
  modalActions: {
    flexDirection: 'row',
    marginTop: 20,
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EFEBE9',
    alignItems: 'center',
    marginRight: 10,
  },
  modalBtnCancelText: { fontSize: 16, fontWeight: '600', color: '#5D4037' },
  modalBtnConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  modalBtnDisabled: { opacity: 0.5 },
  modalBtnConfirmText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});

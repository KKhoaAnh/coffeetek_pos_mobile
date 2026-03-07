import React, { useState, useMemo } from 'react';
import {
  View, StyleSheet, TouchableOpacity, ScrollView,
  TextInput as RNTextInput, KeyboardAvoidingView, Platform,
  Alert, Switch, Dimensions,
} from 'react-native';
import { Text, Searchbar, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useInventoryStore, InventoryItem, InventoryTransaction,
  getUnitLabel, getImportUnitLabel, getTypeLabel,
} from '../../store/inventory.store';
import { useMenuStore, Product } from '../../store/menu.store';
import { useAuthStore } from '../../store/auth.store';
import { ManagerHeader } from '../../components/ManagerHeader';
import { Colors } from '../../constants/app.constant';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Đơn vị cơ bản có sẵn
const BASE_UNITS = [
  { key: 'lon', label: 'Lon' },
  { key: 'chai', label: 'Chai' },
  { key: 'goi', label: 'Gói' },
  { key: 'hop', label: 'Hộp' },
  { key: 'kg', label: 'Kg' },
  { key: 'gam', label: 'Gam' },
  { key: 'lit', label: 'Lít' },
  { key: 'cai', label: 'Cái' },
];

// Đơn vị nhập
const IMPORT_UNITS = [
  { key: '', label: 'Không' },
  { key: 'thung', label: 'Thùng' },
  { key: 'loc', label: 'Lốc' },
  { key: 'bao', label: 'Bao' },
  { key: 'ket', label: 'Két' },
  { key: 'binh', label: 'Bình' },
];

type ModalType = 'ADD' | 'EDIT' | 'IMPORT' | 'EXPORT' | 'HISTORY' | null;
type TabFilter = 'all' | 'low' | 'linked';

// ======================================================================
// LOW STOCK ALERT BANNER
// ======================================================================
const LowStockBanner = ({ count, onPress }: { count: number; onPress: () => void }) => {
  if (count === 0) return null;
  return (
    <TouchableOpacity style={styles.alertBanner} onPress={onPress} activeOpacity={0.8}>
      <MaterialCommunityIcons name="alert-circle" size={22} color="#FFF" />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.alertText}>⚠️ {count} mặt hàng sắp hết</Text>
        <Text style={styles.alertSubtext}>Nhấn để xem chi tiết</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color="#FFF" />
    </TouchableOpacity>
  );
};

// ======================================================================
// INVENTORY CARD
// ======================================================================
const InventoryCard = ({ item, onImport, onExport, onEdit, onHistory }: {
  item: InventoryItem;
  onImport: () => void;
  onExport: () => void;
  onEdit: () => void;
  onHistory: () => void;
}) => {
  const isLinked = !!item.linkedProductId;

  return (
    <View style={[styles.card, item.isLowStock && styles.cardLowStock]}>
      <TouchableOpacity style={styles.cardContent} onPress={onEdit} activeOpacity={0.8}>
        {/* Header: Tên + Badge */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.cardBadges}>
              <View style={[styles.badge, { backgroundColor: '#E3F2FD' }]}>
                <Text style={[styles.badgeText, { color: '#1565C0' }]}>{getUnitLabel(item.unit)}</Text>
              </View>
              {isLinked && (
                <View style={[styles.badge, { backgroundColor: '#E8F5E9' }]}>
                  <MaterialCommunityIcons name="link" size={12} color="#2E7D32" />
                  <Text style={[styles.badgeText, { color: '#2E7D32', marginLeft: 3 }]}>
                    {item.linkedProductName || 'Menu'}
                  </Text>
                </View>
              )}
              {item.importUnit && (
                <View style={[styles.badge, { backgroundColor: '#FFF3E0' }]}>
                  <Text style={[styles.badgeText, { color: '#E65100' }]}>
                    1 {getImportUnitLabel(item.importUnit)} = {item.conversionFactor} {getUnitLabel(item.unit)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Quantity display */}
          <View style={styles.qtyBox}>
            <Text style={[styles.qtyNumber, item.isLowStock && { color: '#D32F2F' }]}>
              {item.quantity}
            </Text>
            <Text style={styles.qtyUnit}>{getUnitLabel(item.unit)}</Text>
            {item.isLowStock && (
              <View style={styles.lowStockTag}>
                <MaterialCommunityIcons name="alert" size={12} color="#FFF" />
                <Text style={styles.lowStockTagText}>Sắp hết</Text>
              </View>
            )}
          </View>
        </View>

        {/* Min stock indicator */}
        {item.minStockLevel > 0 && (
          <View style={styles.stockBar}>
            <View style={[
              styles.stockBarFill,
              {
                width: `${Math.min(100, (item.quantity / item.minStockLevel) * 100)}%`,
                backgroundColor: item.isLowStock ? '#D32F2F' : '#4CAF50',
              }
            ]} />
            <Text style={styles.stockBarLabel}>
              Tối thiểu: {item.minStockLevel} {getUnitLabel(item.unit)}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Action buttons */}
      <View style={styles.cardActions}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#8D6E63' }]} onPress={onImport}>
          <MaterialCommunityIcons name="package-down" size={16} color="#FFF" />
          <Text style={styles.actionBtnText}>Nhập</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#C47B6F' }, item.quantity === 0 && { opacity: 0.4 }]}
          onPress={onExport}
          disabled={item.quantity === 0}
        >
          <MaterialCommunityIcons name="package-up" size={16} color="#FFF" />
          <Text style={styles.actionBtnText}>Xuất</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#A09B94' }]} onPress={onHistory}>
          <MaterialCommunityIcons name="history" size={16} color="#FFF" />
          <Text style={styles.actionBtnText}>Lịch sử</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ======================================================================
// MAIN SCREEN
// ======================================================================
export const InventoryScreen = () => {
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  const { items, lowStockItems, fetchItems, fetchLowStock, addItem, updateItem,
    importStock, exportStock, getHistory } = useInventoryStore();
  const { products, categories, loadMenu } = useMenuStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [tabFilter, setTabFilter] = useState<TabFilter>('all');
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);

  // Form states
  const [formName, setFormName] = useState('');
  const [formUnit, setFormUnit] = useState('lon');
  const [formImportUnit, setFormImportUnit] = useState('');
  const [formFactor, setFormFactor] = useState('1');
  const [formMinStock, setFormMinStock] = useState('0');
  const [formLinkedProduct, setFormLinkedProduct] = useState<number | null>(null);
  const [formQty, setFormQty] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formUseImportUnit, setFormUseImportUnit] = useState(false);
  const [formInitQty, setFormInitQty] = useState('0');

  useFocusEffect(
    React.useCallback(() => {
      fetchItems();
      fetchLowStock();
      if (products.length === 0) loadMenu();
    }, [])
  );

  const lowStockCount = useMemo(() => items.filter(i => i.isLowStock).length, [items]);

  const filteredItems = useMemo(() => {
    let list = items;
    if (tabFilter === 'low') list = list.filter(i => i.isLowStock);
    if (tabFilter === 'linked') list = list.filter(i => !!i.linkedProductId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i => i.name.toLowerCase().includes(q));
    }
    return list;
  }, [items, searchQuery, tabFilter]);

  // --- MODAL HANDLERS ---
  const openAddModal = () => {
    setFormName(''); setFormUnit('lon'); setFormImportUnit('');
    setFormFactor('1'); setFormMinStock('0'); setFormLinkedProduct(null);
    setFormInitQty('0');
    setModalType('ADD');
  };

  const openEditModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormName(item.name);
    setFormUnit(item.unit);
    setFormImportUnit(item.importUnit || '');
    setFormFactor(String(item.conversionFactor));
    setFormMinStock(String(item.minStockLevel));
    setFormLinkedProduct(item.linkedProductId);
    setModalType('EDIT');
  };

  const openImportModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormQty(''); setFormNote(''); setFormUseImportUnit(false);
    setModalType('IMPORT');
  };

  const openExportModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormQty(''); setFormNote('');
    setModalType('EXPORT');
  };

  const openHistoryModal = async (item: InventoryItem) => {
    setSelectedItem(item);
    setModalType('HISTORY');
    const h = await getHistory(item.id);
    setTransactions(h);
  };

  const closeModal = () => { setModalType(null); setSelectedItem(null); };

  // --- SAVE HANDLERS ---
  const handleSaveItem = async () => {
    const name = formName.trim();
    if (!name) { Alert.alert('Thiếu', 'Vui lòng nhập tên'); return; }

    const payload = {
      item_name: name,
      unit: formUnit,
      import_unit: formImportUnit || null,
      conversion_factor: Math.max(1, parseInt(formFactor) || 1),
      min_stock_level: Math.max(0, parseInt(formMinStock) || 0),
      linked_product_id: formLinkedProduct,
      quantity: modalType === 'ADD' ? Math.max(0, parseInt(formInitQty) || 0) : undefined,
      is_active: true,
    };

    let ok: boolean;
    if (modalType === 'ADD') {
      ok = await addItem(payload);
      if (!ok) { Alert.alert('Lỗi', 'Có thể đã trùng tên hoặc lỗi kết nối'); return; }
    } else {
      ok = await updateItem(selectedItem!.id, payload);
      if (!ok) { Alert.alert('Lỗi', 'Không thể cập nhật'); return; }
    }
    closeModal();
    fetchLowStock();
  };

  const handleImport = async () => {
    const qty = parseInt(formQty);
    if (!qty || qty <= 0) { Alert.alert('Lỗi', 'Số lượng phải > 0'); return; }
    const msg = await importStock(selectedItem!.id, qty, formUseImportUnit, formNote, user?.id);
    if (msg) { Alert.alert('✅ Nhập kho', msg); closeModal(); fetchLowStock(); }
    else Alert.alert('Lỗi', 'Không thể nhập kho');
  };

  const handleExport = async () => {
    const qty = parseInt(formQty);
    if (!qty || qty <= 0) { Alert.alert('Lỗi', 'Số lượng phải > 0'); return; }
    if (qty > (selectedItem?.quantity || 0)) {
      Alert.alert('Lỗi', `Tồn kho không đủ. Hiện có: ${selectedItem?.quantity} ${getUnitLabel(selectedItem?.unit || '')}`);
      return;
    }
    const msg = await exportStock(selectedItem!.id, qty, formNote, user?.id);
    if (msg) { Alert.alert('✅ Xuất kho', msg); closeModal(); fetchLowStock(); }
    else Alert.alert('Lỗi', 'Không thể xuất kho');
  };

  const fabBottom = 16 + insets.bottom;

  return (
    <View style={styles.container}>
      <ManagerHeader title="Quản lý kho" subtitle="Nhập & Xuất & Tồn kho" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Low stock alert */}
        <LowStockBanner count={lowStockCount} onPress={() => setTabFilter('low')} />

        {/* Search */}
        <View style={styles.searchWrap}>
          <Searchbar
            placeholder="Tìm mặt hàng..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchBar}
            inputStyle={{ fontSize: 14, minHeight: 0 }}
            iconColor="#A09B94"
            placeholderTextColor="#A09B94"
            theme={{ colors: { elevation: { level3: '#ECEAE6' } } }}
          />
        </View>

        {/* Tab filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabWrap}>
          {[
            { key: 'all' as const, label: `Tất cả (${items.length})`, icon: 'package-variant' },
            { key: 'low' as const, label: `Sắp hết (${lowStockCount})`, icon: 'alert-circle-outline' },
            { key: 'linked' as const, label: 'Bán trực tiếp', icon: 'link-variant' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, tabFilter === tab.key && styles.tabActive]}
              onPress={() => setTabFilter(tab.key)}
            >
              <MaterialCommunityIcons
                name={tab.icon as any} size={16}
                color={tabFilter === tab.key ? '#FFF' : '#666'}
              />
              <Text style={[styles.tabText, tabFilter === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Item list */}
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: fabBottom + 80 }}
          showsVerticalScrollIndicator={false}
        >
          {filteredItems.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="package-variant-closed" size={56} color="#BCAAA4" />
              <Text style={styles.emptyText}>Không có mặt hàng phù hợp</Text>
            </View>
          ) : (
            filteredItems.map(item => (
              <InventoryCard
                key={item.id}
                item={item}
                onImport={() => openImportModal(item)}
                onExport={() => openExportModal(item)}
                onEdit={() => openEditModal(item)}
                onHistory={() => openHistoryModal(item)}
              />
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <FAB icon="plus" label="Thêm hàng" style={[styles.fab, { bottom: fabBottom }]}
        onPress={openAddModal} color="#FFF"
      />

      {/* ================================================================ */}
      {/* MODAL: THÊM / SỬA MẶT HÀNG */}
      {/* ================================================================ */}
      <Modal isVisible={modalType === 'ADD' || modalType === 'EDIT'}
        onBackdropPress={closeModal} onBackButtonPress={closeModal}
        avoidKeyboard style={styles.modal}>
        <View style={styles.modalCard}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>
              {modalType === 'ADD' ? '➕ Thêm mặt hàng mới' : '✏️ Sửa: ' + selectedItem?.name}
            </Text>

            {/* Tên */}
            <Text style={styles.label}>Tên mặt hàng *</Text>
            <RNTextInput
              value={formName} onChangeText={setFormName}
              placeholder="VD: Pepsi lon, Cafe bột..."
              style={styles.input} placeholderTextColor="#9E9E9E"
            />

            {/* Đơn vị cơ bản */}
            <Text style={styles.label}>Đơn vị cơ bản (lưu kho)</Text>
            <View style={styles.chipRow}>
              {BASE_UNITS.map(u => (
                <TouchableOpacity key={u.key}
                  style={[styles.chip, formUnit === u.key && styles.chipActive]}
                  onPress={() => setFormUnit(u.key)}>
                  <Text style={[styles.chipText, formUnit === u.key && styles.chipTextActive]}>{u.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Đơn vị nhập */}
            <Text style={styles.label}>Đơn vị nhập (Thùng, Lốc...)</Text>
            <View style={styles.chipRow}>
              {IMPORT_UNITS.map(u => (
                <TouchableOpacity key={u.key}
                  style={[styles.chip, formImportUnit === u.key && styles.chipActive]}
                  onPress={() => setFormImportUnit(u.key)}>
                  <Text style={[styles.chipText, formImportUnit === u.key && styles.chipTextActive]}>{u.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Hệ số quy đổi (chỉ khi có đơn vị nhập) */}
            {formImportUnit !== '' && (
              <View>
                <Text style={styles.label}>
                  Hệ số quy đổi: 1 {getImportUnitLabel(formImportUnit)} = ? {getUnitLabel(formUnit)}
                </Text>
                <RNTextInput
                  value={formFactor} onChangeText={setFormFactor}
                  placeholder="VD: 24" keyboardType="number-pad"
                  style={styles.input} placeholderTextColor="#9E9E9E"
                />
              </View>
            )}

            {/* Mức tối thiểu */}
            <Text style={styles.label}>Mức tồn kho tối thiểu (cảnh báo)</Text>
            <RNTextInput
              value={formMinStock} onChangeText={setFormMinStock}
              placeholder="0 = không cảnh báo" keyboardType="number-pad"
              style={styles.input} placeholderTextColor="#9E9E9E"
            />

            {/* Liên kết sản phẩm menu (cho hàng bán trực tiếp) */}
            <Text style={styles.label}>Liên kết sản phẩm Menu (auto xuất khi bán)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <TouchableOpacity
                style={[styles.linkChip, !formLinkedProduct && styles.linkChipActive]}
                onPress={() => setFormLinkedProduct(null)}>
                <Text style={[styles.linkChipText, !formLinkedProduct && styles.linkChipTextActive]}>
                  Không liên kết
                </Text>
              </TouchableOpacity>
              {products.filter(p => p.is_active === 1).map(p => {
                const sel = formLinkedProduct === Number(p.product_id);
                return (
                  <TouchableOpacity key={p.product_id}
                    style={[styles.linkChip, sel && styles.linkChipActive]}
                    onPress={() => setFormLinkedProduct(Number(p.product_id))}>
                    <Text style={[styles.linkChipText, sel && styles.linkChipTextActive]} numberOfLines={1}>
                      {p.product_name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Số lượng ban đầu chỉ khi thêm mới */}
            {modalType === 'ADD' && (
              <View>
                <Text style={styles.label}>Số lượng ban đầu ({getUnitLabel(formUnit)})</Text>
                <RNTextInput
                  value={formInitQty} onChangeText={t => setFormInitQty(t.replace(/[^0-9]/g, ''))}
                  placeholder="0" keyboardType="number-pad"
                  style={styles.input} placeholderTextColor="#9E9E9E"
                />
              </View>
            )}

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCancel} onPress={closeModal}>
                <Text style={styles.btnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnConfirm} onPress={handleSaveItem}>
                <Text style={styles.btnConfirmText}>{modalType === 'ADD' ? 'Thêm' : 'Lưu'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ================================================================ */}
      {/* MODAL: NHẬP KHO */}
      {/* ================================================================ */}
      <Modal isVisible={modalType === 'IMPORT'}
        onBackdropPress={closeModal} onBackButtonPress={closeModal}
        avoidKeyboard style={styles.modal}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>📦 Nhập kho — {selectedItem?.name}</Text>
          <Text style={styles.modalSub}>
            Hiện có: <Text style={{ fontWeight: '800', color: Colors.primary }}>{selectedItem?.quantity}</Text> {getUnitLabel(selectedItem?.unit || '')}
          </Text>

          {/* Toggle nhập theo đơn vị lớn */}
          {selectedItem?.importUnit && (
            <View style={styles.switchRow}>
              <Text style={{ flex: 1, fontWeight: '600', color: '#333' }}>
                Nhập theo {getImportUnitLabel(selectedItem.importUnit)}
                <Text style={{ fontWeight: '400', color: '#888' }}>
                  {' '}(1 = {selectedItem.conversionFactor} {getUnitLabel(selectedItem.unit)})
                </Text>
              </Text>
              <Switch value={formUseImportUnit} onValueChange={setFormUseImportUnit} trackColor={{ true: Colors.primary, false: '#ccc' }} />
            </View>
          )}

          <RNTextInput
            value={formQty} onChangeText={t => setFormQty(t.replace(/[^0-9]/g, ''))}
            placeholder={formUseImportUnit ? `Số ${getImportUnitLabel(selectedItem?.importUnit || '')}` : `Số ${getUnitLabel(selectedItem?.unit || '')}`}
            keyboardType="number-pad" style={styles.input} placeholderTextColor="#9E9E9E"
          />

          {/* Preview quy đổi */}
          {formUseImportUnit && formQty && parseInt(formQty) > 0 && (
            <View style={styles.previewBox}>
              <Text style={styles.previewText}>
                {formQty} {getImportUnitLabel(selectedItem?.importUnit || '')} = {' '}
                <Text style={{ fontWeight: '800', color: Colors.primary }}>
                  {parseInt(formQty) * (selectedItem?.conversionFactor || 1)}
                </Text> {getUnitLabel(selectedItem?.unit || '')}
              </Text>
            </View>
          )}

          <RNTextInput
            value={formNote} onChangeText={setFormNote}
            placeholder="Ghi chú (Tùy chọn)" style={[styles.input, { marginTop: 10 }]}
            placeholderTextColor="#9E9E9E"
          />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.btnCancel} onPress={closeModal}>
              <Text style={styles.btnCancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnConfirm, { backgroundColor: Colors.primary }]} onPress={handleImport}>
              <Text style={styles.btnConfirmText}>Xác nhận nhập</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================================================================ */}
      {/* MODAL: XUẤT KHO THỦ CÔNG */}
      {/* ================================================================ */}
      <Modal isVisible={modalType === 'EXPORT'}
        onBackdropPress={closeModal} onBackButtonPress={closeModal}
        avoidKeyboard style={styles.modal}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>📤 Xuất kho — {selectedItem?.name}</Text>
          <Text style={styles.modalSub}>
            Tồn kho: <Text style={{ fontWeight: '800', color: Colors.primary }}>{selectedItem?.quantity}</Text> {getUnitLabel(selectedItem?.unit || '')}
          </Text>

          <RNTextInput
            value={formQty} onChangeText={t => setFormQty(t.replace(/[^0-9]/g, ''))}
            placeholder={`Số ${getUnitLabel(selectedItem?.unit || '')} cần xuất`}
            keyboardType="number-pad" style={styles.input} placeholderTextColor="#9E9E9E"
          />

          <RNTextInput
            value={formNote} onChangeText={setFormNote}
            placeholder="Lý do xuất kho (VD: Xuất ra quầy pha chế)"
            style={[styles.input, { marginTop: 10 }]}
            placeholderTextColor="#9E9E9E"
          />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.btnCancel} onPress={closeModal}>
              <Text style={styles.btnCancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnConfirm, { backgroundColor: '#FF7043' }]} onPress={handleExport}>
              <Text style={styles.btnConfirmText}>Xác nhận xuất</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================================================================ */}
      {/* MODAL: LỊCH SỬ GIAO DỊCH */}
      {/* ================================================================ */}
      <Modal isVisible={modalType === 'HISTORY'}
        onBackdropPress={closeModal} onBackButtonPress={closeModal}
        style={styles.modal}>
        <View style={[styles.modalCard, { maxHeight: '80%' }]}>
          <Text style={styles.modalTitle}>📋 Lịch sử — {selectedItem?.name}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {transactions.length === 0 ? (
              <Text style={{ color: '#999', textAlign: 'center', padding: 20 }}>Chưa có giao dịch nào</Text>
            ) : (
              transactions.map(tx => {
                const isImport = tx.type === 'IMPORT';
                const color = isImport ? '#2E7D32' : '#D32F2F';
                const sign = isImport ? '+' : '-';
                const time = new Date(tx.createdAt).toLocaleString('vi-VN', {
                  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                });
                return (
                  <View key={tx.id} style={styles.txItem}>
                    <View style={[styles.txIcon, { backgroundColor: isImport ? '#E8F5E9' : '#FFEBEE' }]}>
                      <MaterialCommunityIcons
                        name={isImport ? 'package-down' : tx.type === 'EXPORT_AUTO' ? 'robot' : 'package-up'}
                        size={18} color={color}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.txType}>{getTypeLabel(tx.type)}</Text>
                      {tx.note && <Text style={styles.txNote} numberOfLines={2}>{tx.note}</Text>}
                      <Text style={styles.txTime}>
                        {time}{tx.userName ? ` • ${tx.userName}` : ''}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.txQty, { color }]}>{sign}{tx.quantity}</Text>
                      <Text style={styles.txAfter}>Tồn: {tx.stockAfter}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
          <TouchableOpacity style={[styles.btnConfirm, { marginTop: 15 }]} onPress={closeModal}>
            <Text style={styles.btnConfirmText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

// ======================================================================
// STYLES
// ======================================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F3F1' },

  // Alert banner
  alertBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#C47B6F', paddingHorizontal: 16, paddingVertical: 12,
  },
  alertText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  alertSubtext: { color: '#F0E6E4', fontSize: 11, marginTop: 2 },

  // Search
  searchWrap: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  searchBar: { backgroundColor: '#ECEAE6', borderRadius: 14, elevation: 0, shadowOpacity: 0 },

  // Tabs
  tabScroll: { maxHeight: 44, marginBottom: 10 },
  tabWrap: { paddingHorizontal: 16, paddingVertical: 4, flexDirection: 'row' },
  tab: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#ECEAE6', marginRight: 8,
    minHeight: 32,
  },
  tabActive: { backgroundColor: '#8D6E63' },
  tabText: { fontSize: 12, color: '#6B6560', fontWeight: '500', marginLeft: 5 },
  tabTextActive: { color: '#FFF', fontWeight: '600' },

  // Cards
  card: {
    borderRadius: 18, backgroundColor: '#ffffffff', marginBottom: 12,
    overflow: 'hidden', shadowColor: '#8D6E63', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  cardLowStock: { borderWidth: 0.7, borderColor: '#E0A9A2' },
  cardContent: { padding: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  cardName: { fontSize: 15, fontWeight: '600', color: '#4A4540', marginBottom: 6 },
  cardBadges: { flexDirection: 'row', flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, marginRight: 6, marginBottom: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  qtyBox: { alignItems: 'center', marginLeft: 12, minWidth: 60 },
  qtyNumber: { fontSize: 28, fontWeight: '800', color: '#5D4037' },
  qtyUnit: { fontSize: 11, color: '#A09B94', fontWeight: '600', marginTop: -2 },
  lowStockTag: {
    flexDirection: 'row', alignItems: 'center', marginTop: 4,
    backgroundColor: '#C47B6F', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
  },
  lowStockTagText: { color: '#FFF', fontSize: 10, fontWeight: '700', marginLeft: 3 },

  // Stock bar
  stockBar: {
    height: 5, backgroundColor: '#ECEAE6', borderRadius: 3,
    marginTop: 10, overflow: 'hidden', position: 'relative',
  },
  stockBarFill: { height: '100%', borderRadius: 3 },
  stockBarLabel: { fontSize: 10, color: '#A09B94', marginTop: 3 },

  // Actions
  cardActions: { flexDirection: 'row', borderTopWidth: 0.7, borderTopColor: '#ECEAE6' },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10,
  },
  actionBtnText: { color: '#FFF', fontWeight: '600', fontSize: 12, marginLeft: 4 },

  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { marginTop: 12, fontSize: 15, color: '#8D6E63' },

  fab: { position: 'absolute', right: 16, backgroundColor: '#8D6E63', borderRadius: 28 },

  // Modal shared
  modal: { justifyContent: 'flex-end', margin: 0 },
  modalCard: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 32, backgroundColor: '#FAF9F7',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#4A4540', marginBottom: 6 },
  modalSub: { fontSize: 14, color: '#6B6560', marginBottom: 16 },

  label: { fontWeight: '600', color: '#6B6560', fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: '#DDD9D3', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 13, fontSize: 15,
    color: '#4A4540', backgroundColor: '#FAF9F7',
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    backgroundColor: '#ECEAE6', marginRight: 6, marginBottom: 6,
  },
  chipActive: { backgroundColor: '#8D6E63' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#6B6560' },
  chipTextActive: { color: '#FFF' },

  linkChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    backgroundColor: '#ECEAE6', marginRight: 6, maxWidth: 140,
  },
  linkChipActive: { backgroundColor: '#E6EDE4', borderWidth: 0.7, borderColor: '#8DB580' },
  linkChipText: { fontSize: 12, fontWeight: '600', color: '#6B6560' },
  linkChipTextActive: { color: '#4A7A3D' },

  switchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EEF1EB', padding: 12, borderRadius: 12,
    borderWidth: 0.7, borderColor: '#D5DBCF', marginBottom: 12,
  },

  previewBox: {
    backgroundColor: '#E6EDE4', padding: 10, borderRadius: 10, marginTop: 8,
  },
  previewText: { fontSize: 14, color: '#4A7A3D', fontWeight: '600' },

  modalActions: { flexDirection: 'row', marginTop: 20 },
  btnCancel: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#ECEAE6', alignItems: 'center', marginRight: 10,
  },
  btnCancelText: { fontSize: 15, fontWeight: '600', color: '#A09B94' },
  btnConfirm: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#8D6E63', alignItems: 'center',
  },
  btnConfirmText: { fontSize: 15, fontWeight: '600', color: '#FFF' },

  // Transaction history
  txItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 0.7, borderBottomColor: '#ECEAE6',
  },
  txIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  txType: { fontSize: 13, fontWeight: '700', color: '#4A4540' },
  txNote: { fontSize: 11, color: '#A09B94', marginTop: 2 },
  txTime: { fontSize: 10, color: '#B5AEA7', marginTop: 2 },
  txQty: { fontSize: 16, fontWeight: '800' },
  txAfter: { fontSize: 10, color: '#A09B94', marginTop: 2 },
});

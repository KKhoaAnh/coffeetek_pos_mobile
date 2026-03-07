import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  FlatList,
} from 'react-native';
import { Text, TextInput, Button, Searchbar, Chip } from 'react-native-paper';
import { Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  usePromoStore,
  Promotion,
  getDayLabel,
} from '../../store/promo.store';
import { useMenuStore, Category, Product } from '../../store/menu.store';
import { ManagerHeader } from '../../components/ManagerHeader';
import { Colors } from '../../constants/app.constant';
import { formatCurrency } from '../../utils/format';
import type { DayOfWeek, ApplyTo } from '../../api/promo.api';

const DAYS: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];

const toISO = (d: Date) => d.toISOString().slice(0, 10);
const parseISO = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const formatDateDisplay = (iso: string) => {
  if (!iso) return '--/--/----';
  const parts = iso.split('-');
  return `${parts[2] || ''}/${parts[1] || ''}/${parts[0] || ''}`;
};

const parseTimeToDate = (hhmm: string): Date => {
  const [h, m] = hhmm.split(':');
  const d = new Date();
  d.setHours(parseInt(h, 10) || 0, parseInt(m, 10) || 0, 0, 0);
  return d;
};

const dateToTimeString = (d: Date): string => {
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

// ======================================================================
// SCOPE SELECTOR COMPONENTS
// ======================================================================

// Chip chọn scope (BILL / CATEGORY / PRODUCT)
const ScopeChip = ({ icon, label, value, selected, onPress }: {
  icon: string, label: string, value: ApplyTo, selected: boolean, onPress: (v: ApplyTo) => void
}) => (
  <TouchableOpacity
    style={[styles.scopeChip, selected && styles.scopeChipActive]}
    onPress={() => onPress(value)}
  >
    <MaterialCommunityIcons name={icon as any} size={20} color={selected ? '#FFF' : '#64748B'} />
    <Text style={[styles.scopeChipText, selected && styles.scopeChipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

// Component chọn nhóm món (categories)
const CategorySelector = ({
  categories, selectedIds, onToggle
}: { categories: Category[], selectedIds: number[], onToggle: (id: number) => void }) => (
  <View style={styles.selectorWrap}>
    {categories.map(cat => {
      const selected = selectedIds.includes(cat.category_id);
      return (
        <TouchableOpacity
          key={cat.category_id}
          style={[styles.selectorItem, selected && styles.selectorItemActive]}
          onPress={() => onToggle(cat.category_id)}
        >
          <MaterialCommunityIcons
            name={selected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
            size={20}
            color={selected ? Colors.primary : '#B0BEC5'}
          />
          <Text style={[styles.selectorText, selected && styles.selectorTextActive]}>
            {cat.category_name}
          </Text>
        </TouchableOpacity>
      );
    })}
    {categories.length === 0 && (
      <Text style={{ color: '#999', fontStyle: 'italic' }}>Chưa có nhóm món nào</Text>
    )}
  </View>
);

// Component chọn món cụ thể (products)
const ProductSelector = ({
  products, categories, selectedIds, onToggle
}: { products: Product[], categories: Category[], selectedIds: number[], onToggle: (id: number) => void }) => {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<number | 'ALL'>('ALL');

  const filtered = useMemo(() => {
    let list = products.filter(p => p.is_active === 1);
    if (filterCat !== 'ALL') {
      list = list.filter(p => p.category_id === filterCat.toString());
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.product_name.toLowerCase().includes(q));
    }
    return list;
  }, [products, filterCat, search]);

  return (
    <View>
      <Searchbar
        placeholder="Tìm tên món..."
        value={search}
        onChangeText={setSearch}
        style={styles.productSearch}
        inputStyle={{ fontSize: 13, minHeight: 0 }}
        iconColor={Colors.primary}
      />

      {/* Category filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        <TouchableOpacity
          style={[styles.catChip, filterCat === 'ALL' && styles.catChipActive]}
          onPress={() => setFilterCat('ALL')}
        >
          <Text style={[styles.catChipText, filterCat === 'ALL' && styles.catChipTextActive]}>Tất cả</Text>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.category_id}
            style={[styles.catChip, filterCat === cat.category_id && styles.catChipActive]}
            onPress={() => setFilterCat(cat.category_id)}
          >
            <Text style={[styles.catChipText, filterCat === cat.category_id && styles.catChipTextActive]}>
              {cat.category_name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Selected count */}
      {selectedIds.length > 0 && (
        <View style={styles.selectedBadge}>
          <MaterialCommunityIcons name="check-circle" size={16} color={Colors.primary} />
          <Text style={{ color: Colors.primary, fontWeight: '600', marginLeft: 6, fontSize: 13 }}>
            Đã chọn {selectedIds.length} món
          </Text>
        </View>
      )}

      {/* Product list */}
      <View style={styles.productList}>
        {filtered.map(product => {
          const prodId = Number(product.product_id);
          const selected = selectedIds.includes(prodId);
          return (
            <TouchableOpacity
              key={product.product_id}
              style={[styles.productItem, selected && styles.productItemActive]}
              onPress={() => onToggle(prodId)}
            >
              <MaterialCommunityIcons
                name={selected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                size={20}
                color={selected ? Colors.primary : '#B0BEC5'}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.productName, selected && { color: Colors.primary }]} numberOfLines={1}>
                  {product.product_name}
                </Text>
                <Text style={styles.productPrice}>{formatCurrency(product.price_value)}</Text>
              </View>
              <Text style={styles.productCat}>{product.category_name}</Text>
            </TouchableOpacity>
          );
        })}
        {filtered.length === 0 && (
          <Text style={{ color: '#999', fontStyle: 'italic', textAlign: 'center', padding: 16 }}>
            Không tìm thấy món
          </Text>
        )}
      </View>
    </View>
  );
};

// ======================================================================
// MAIN SCREEN
// ======================================================================
export const PromoEditScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const promoId = route.params?.promoId ?? null;
  const { getPromo, addPromo, updatePromo } = usePromoStore();
  const { categories, products, loadMenu } = useMenuStore();

  const isEdit = !!promoId;
  const existing = promoId ? getPromo(promoId) : null;

  // --- FORM STATE ---
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [applyTo, setApplyTo] = useState<ApplyTo>('BILL');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [startDate, setStartDate] = useState('');
  const [startDateDisplay, setStartDateDisplay] = useState(new Date());
  const [endDate, setEndDate] = useState('');
  const [endDateDisplay, setEndDateDisplay] = useState(new Date());
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>([]);
  const [useTimeRange, setUseTimeRange] = useState(false);
  const [timeStart, setTimeStart] = useState<string | null>(null);
  const [timeEnd, setTimeEnd] = useState<string | null>(null);
  const [timeStartDisplay, setTimeStartDisplay] = useState(new Date(0, 0, 0, 14, 0));
  const [timeEndDisplay, setTimeEndDisplay] = useState(new Date(0, 0, 0, 17, 0));
  const [is_active, setIsActive] = useState(true);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerMode, setTimePickerMode] = useState<'start' | 'end'>('start');

  // Load menu data cho selector
  useEffect(() => {
    if (categories.length === 0 || products.length === 0) {
      loadMenu();
    }
  }, []);

  // Prefill form khi edit
  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setDescription(existing.description);
      setDiscountType(existing.discountType);
      setDiscountValue(String(existing.discountValue));
      setApplyTo(existing.applyTo || 'BILL');
      setMinOrderAmount(String(existing.minOrderAmount || 0));
      setSelectedProductIds(existing.productIds || []);
      setSelectedCategoryIds(existing.categoryIds || []);
      setStartDate(existing.startDate);
      setEndDate(existing.endDate);
      setStartDateDisplay(parseISO(existing.startDate));
      setEndDateDisplay(parseISO(existing.endDate));
      setDaysOfWeek(existing.daysOfWeek || []);
      setUseTimeRange(!!(existing.timeStart || existing.timeEnd));
      setTimeStart(existing.timeStart);
      setTimeEnd(existing.timeEnd);
      if (existing.timeStart) setTimeStartDisplay(parseTimeToDate(existing.timeStart));
      if (existing.timeEnd) setTimeEndDisplay(parseTimeToDate(existing.timeEnd));
      setIsActive(existing.is_active);
    } else {
      const today = new Date();
      const next = new Date(today);
      next.setMonth(next.getMonth() + 1);
      const startStr = toISO(today);
      const endStr = toISO(next);
      setStartDate(startStr);
      setEndDate(endStr);
      setStartDateDisplay(today);
      setEndDateDisplay(next);
      setTimeStart('14:00');
      setTimeEnd('17:00');
      setTimeStartDisplay(parseTimeToDate('14:00'));
      setTimeEndDisplay(parseTimeToDate('17:00'));
    }
  }, [existing, promoId]);

  const toggleDay = (d: DayOfWeek) => {
    setDaysOfWeek((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)
    );
  };

  const toggleProductId = (id: number) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleCategoryId = (id: number) => {
    setSelectedCategoryIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const onDateChange = (_: any, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (!selected) return;
    const str = toISO(selected);
    if (datePickerMode === 'start') {
      setStartDate(str);
      setStartDateDisplay(selected);
      if (str > endDate) { setEndDate(str); setEndDateDisplay(selected); }
    } else {
      setEndDate(str);
      setEndDateDisplay(selected);
      if (str < startDate) { setStartDate(str); setStartDateDisplay(selected); }
    }
  };

  const onTimeChange = (_: any, selected?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (!selected) return;
    const str = dateToTimeString(selected);
    if (timePickerMode === 'start') {
      setTimeStart(str); setTimeStartDisplay(selected);
    } else {
      setTimeEnd(str); setTimeEndDisplay(selected);
    }
  };

  const openDatePicker = (mode: 'start' | 'end') => { setDatePickerMode(mode); setShowTimePicker(false); setShowDatePicker(true); };
  const openTimePicker = (mode: 'start' | 'end') => { setTimePickerMode(mode); setShowDatePicker(false); setShowTimePicker(true); };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const valueNum = discountType === 'percent'
      ? Math.min(100, Math.max(0, parseInt(discountValue, 10) || 0))
      : Math.max(0, parseInt(discountValue, 10) || 0);

    const payload: Omit<Promotion, 'id'> = {
      name: trimmedName,
      description: description.trim(),
      discountType,
      discountValue: valueNum,
      applyTo,
      minOrderAmount: parseFloat(minOrderAmount) || 0,
      productIds: applyTo === 'PRODUCT' ? selectedProductIds : [],
      categoryIds: applyTo === 'CATEGORY' ? selectedCategoryIds : [],
      startDate: startDate || toISO(new Date()),
      endDate: endDate || toISO(new Date()),
      daysOfWeek,
      timeStart: useTimeRange ? (timeStart || '00:00') : null,
      timeEnd: useTimeRange ? (timeEnd || '23:59') : null,
      is_active,
    };

    if (isEdit && promoId) {
      await updatePromo(promoId, payload);
    } else {
      await addPromo(payload);
    }
    navigation.goBack();
  };

  const canSave = name.trim().length > 0 && discountValue.length > 0;

  // Label cho scope
  const scopeDescription = applyTo === 'BILL'
    ? 'Giảm giá áp dụng cho toàn bộ hóa đơn'
    : applyTo === 'CATEGORY'
      ? 'Giảm giá chỉ áp dụng cho các nhóm món được chọn'
      : 'Giảm giá chỉ áp dụng cho các món cụ thể được chọn';

  return (
    <View style={styles.container}>
      <ManagerHeader
        title={isEdit ? 'Chỉnh sửa khuyến mãi' : 'Thêm khuyến mãi'}
        subtitle={isEdit ? (existing?.name || '') : 'Thiết lập thời gian & giảm giá'}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* SECTION: THÔNG TIN CƠ BẢN */}
          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.sectionTitle}>
              Thông tin cơ bản
            </Text>
            <TextInput
              label="Tên chương trình *"
              value={name}
              onChangeText={setName}
              mode="outlined"
              placeholder="VD: Happy Hour 14h-17h"
              style={styles.input}
              activeOutlineColor={Colors.primary}
            />
            <TextInput
              label="Mô tả (tùy chọn)"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={2}
              placeholder="Mô tả ngắn cho khách hàng"
              style={[styles.input, styles.inputLast]}
              activeOutlineColor={Colors.primary}
            />
          </View>

          {/* SECTION: PHẠM VI ÁP DỤNG (MỚI) */}
          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.sectionTitle}>
              Phạm vi áp dụng
            </Text>
            <Text style={styles.hint}>{scopeDescription}</Text>
            <View style={styles.scopeRow}>
              <ScopeChip icon="receipt" label="Tổng đơn" value="BILL" selected={applyTo === 'BILL'} onPress={setApplyTo} />
              <ScopeChip icon="food" label="Nhóm món" value="CATEGORY" selected={applyTo === 'CATEGORY'} onPress={setApplyTo} />
              <ScopeChip icon="coffee" label="Món" value="PRODUCT" selected={applyTo === 'PRODUCT'} onPress={setApplyTo} />
            </View>

            {/* Điều kiện đơn tối thiểu (chỉ cho BILL) */}
            {applyTo === 'BILL' && (
              <View style={{ marginTop: 12 }}>
                <TextInput
                  label="Đơn tối thiểu (VNĐ)"
                  value={minOrderAmount}
                  onChangeText={setMinOrderAmount}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                  activeOutlineColor={Colors.primary}
                  right={<TextInput.Affix text="VNĐ" />}
                />
                <Text style={styles.hint}>Để 0 = không giới hạn</Text>
              </View>
            )}

            {/* Chọn nhóm món */}
            {applyTo === 'CATEGORY' && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.subLabel}>Chọn nhóm món áp dụng:</Text>
                <CategorySelector
                  categories={categories}
                  selectedIds={selectedCategoryIds}
                  onToggle={toggleCategoryId}
                />
              </View>
            )}

            {/* Chọn món cụ thể */}
            {applyTo === 'PRODUCT' && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.subLabel}>Chọn món áp dụng:</Text>
                <ProductSelector
                  products={products}
                  categories={categories}
                  selectedIds={selectedProductIds}
                  onToggle={toggleProductId}
                />
              </View>
            )}
          </View>

          {/* SECTION: GIÁ TRỊ GIẢM GIÁ */}
          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.sectionTitle}>
              Giảm giá
            </Text>
            <View style={styles.discountRow}>
              <TouchableOpacity
                style={[styles.discountTypeBtn, discountType === 'percent' && styles.discountTypeActive]}
                onPress={() => setDiscountType('percent')}
              >
                <Text style={discountType === 'percent' ? styles.discountTypeTextActive : styles.discountTypeText}>%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.discountTypeBtn, discountType === 'fixed' && styles.discountTypeActive]}
                onPress={() => setDiscountType('fixed')}
              >
                <Text style={discountType === 'fixed' ? styles.discountTypeTextActive : styles.discountTypeText}>VND</Text>
              </TouchableOpacity>
            </View>
            <RNTextInput
              placeholder={discountType === 'percent' ? 'VD: 20' : 'VD: 10000'}
              value={discountValue}
              onChangeText={setDiscountValue}
              keyboardType="number-pad"
              style={styles.valueInput}
              placeholderTextColor="#9CA3AF"
            />
            {discountType === 'fixed' && discountValue && !isNaN(parseInt(discountValue, 10)) && (
              <Text style={styles.hint}>≈ {formatCurrency(parseInt(discountValue, 10))}</Text>
            )}
          </View>

          {/* SECTION: THỜI GIAN */}
          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.sectionTitle}>Thời gian áp dụng</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity style={styles.dateBox} onPress={() => openDatePicker('start')}>
                <MaterialCommunityIcons name="calendar-start" size={20} color={Colors.primary} />
                <Text style={styles.dateLabel}>Từ ngày</Text>
                <Text style={styles.dateValue}>{formatDateDisplay(startDate || '')}</Text>
              </TouchableOpacity>
              <View style={styles.dateArrow}>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#94A3B8" />
              </View>
              <TouchableOpacity style={styles.dateBox} onPress={() => openDatePicker('end')}>
                <MaterialCommunityIcons name="calendar-end" size={20} color={Colors.primary} />
                <Text style={styles.dateLabel}>Đến ngày</Text>
                <Text style={styles.dateValue}>{formatDateDisplay(endDate || '')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* SECTION: NGÀY ÁP DỤNG */}
          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.sectionTitle}>Áp dụng các thứ</Text>
            <Text style={styles.hint}>Để trống = áp dụng mọi ngày</Text>
            <View style={styles.daysWrap}>
              {DAYS.map((d) => {
                const selected = daysOfWeek.includes(d);
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => toggleDay(d)}
                    style={[styles.dayChip, selected && styles.dayChipActive]}
                  >
                    <Text style={[styles.dayChipText, selected && styles.dayChipTextActive]}>
                      {getDayLabel(d)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* SECTION: KHUNG GIỜ */}
          <View style={styles.section}>
            <View style={styles.switchRow}>
              <Text variant="bodyMedium" style={styles.switchLabel}>Khung giờ (Happy Hour)</Text>
              <Switch
                value={useTimeRange}
                onValueChange={(v) => {
                  setUseTimeRange(v);
                  if (v && !timeStart) setTimeStart('14:00');
                  if (v && !timeEnd) setTimeEnd('17:00');
                }}
                trackColor={{ true: Colors.primary, false: '#ccc' }}
              />
            </View>
            {useTimeRange && (
              <View style={styles.timeRow}>
                <TouchableOpacity style={styles.timeBox} onPress={() => openTimePicker('start')}>
                  <MaterialCommunityIcons name="clock-outline" size={18} color={Colors.primary} />
                  <Text style={styles.timeValue}>{timeStart || '00:00'}</Text>
                </TouchableOpacity>
                <View style={styles.dateArrow}>
                  <MaterialCommunityIcons name="arrow-right" size={18} color="#94A3B8" />
                </View>
                <TouchableOpacity style={styles.timeBox} onPress={() => openTimePicker('end')}>
                  <MaterialCommunityIcons name="clock-outline" size={18} color={Colors.primary} />
                  <Text style={styles.timeValue}>{timeEnd || '23:59'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* SECTION: TRẠNG THÁI */}
          <View style={styles.section}>
            <View style={styles.switchRow}>
              <Text variant="bodyMedium" style={styles.switchLabel}>Bật chương trình ngay</Text>
              <Switch value={is_active} onValueChange={setIsActive} trackColor={{ true: Colors.primary, false: '#ccc' }} />
            </View>
          </View>

          {/* NÚT LƯU */}
          <Button
            mode="contained"
            onPress={handleSave}
            disabled={!canSave}
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            contentStyle={styles.saveBtnContent}
            icon="content-save"
          >
            {isEdit ? 'Lưu thay đổi' : 'Tạo khuyến mãi'}
          </Button>
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePicker
          value={datePickerMode === 'start' ? startDateDisplay : endDateDisplay}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={timePickerMode === 'start' ? timeStartDisplay : timeEndDisplay}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
          is24Hour
        />
      )}
    </View>
  );
};

// ======================================================================
// STYLES
// ======================================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F3F1' },
  flex: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  section: {
    borderRadius: 18,
    backgroundColor: '#ffffffff',
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionTitle: { fontWeight: '700', color: '#4A4540', marginBottom: 12 },
  subLabel: { fontWeight: '600', color: '#6B6560', marginBottom: 8, fontSize: 13 },
  input: { marginBottom: 12, backgroundColor: '#FAF9F7' },
  inputLast: { marginBottom: 0 },

  // Scope chips
  scopeRow: { flexDirection: 'row', marginTop: 8 },
  scopeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: '#ECEAE6',
  },
  scopeChipActive: { backgroundColor: '#8D6E63' },
  scopeChipText: { fontSize: 13, fontWeight: '600', color: '#6B6560', marginLeft: 6 },
  scopeChipTextActive: { fontSize: 13, fontWeight: '600', color: '#FFF', marginLeft: 6 },

  // Category/Product selector
  selectorWrap: {},
  selectorItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 12, backgroundColor: '#FAF9F7',
    marginBottom: 6, borderWidth: 0.7, borderColor: '#DDD9D3',
  },
  selectorItemActive: { backgroundColor: '#E6DDD8', borderColor: '#8D6E63' },
  selectorText: { fontSize: 14, color: '#4A4540', marginLeft: 10, fontWeight: '500' },
  selectorTextActive: { color: '#5D4037', fontWeight: '700' },

  // Product selector
  productSearch: {
    backgroundColor: '#ECEAE6', borderRadius: 12, elevation: 0,
    shadowOpacity: 0, marginBottom: 8, height: 40,
  },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, backgroundColor: '#ECEAE6', marginRight: 8,
  },
  catChipActive: { backgroundColor: '#8D6E63' },
  catChipText: { fontSize: 12, fontWeight: '600', color: '#6B6560' },
  catChipTextActive: { color: '#FFF' },
  selectedBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E6DDD8', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, marginBottom: 8,
  },
  productList: { maxHeight: 300 },
  productItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 12, backgroundColor: '#FAF9F7',
    marginBottom: 4, borderWidth: 0.7, borderColor: '#DDD9D3',
  },
  productItemActive: { backgroundColor: '#E6DDD8', borderColor: '#8D6E63' },
  productName: { fontSize: 14, fontWeight: '600', color: '#4A4540' },
  productPrice: { fontSize: 12, color: '#6B6560', marginTop: 2 },
  productCat: { fontSize: 11, color: '#A09B94', marginLeft: 8 },

  // Discount
  discountRow: { flexDirection: 'row', marginBottom: 12 },
  discountTypeBtn: {
    flex: 1, paddingVertical: 12, marginRight: 8,
    borderRadius: 12, backgroundColor: '#ECEAE6', alignItems: 'center',
  },
  discountTypeActive: { backgroundColor: '#8D6E63' },
  discountTypeText: { fontSize: 15, fontWeight: '600', color: '#6B6560' },
  discountTypeTextActive: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  valueInput: {
    borderWidth: 1, borderColor: '#DDD9D3', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 18,
    color: '#4A4540', backgroundColor: '#FAF9F7',
  },
  hint: { fontSize: 12, color: '#A09B94', marginTop: 6, marginBottom: 4 },

  // Date
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  dateBox: {
    flex: 1, padding: 12, borderRadius: 14, backgroundColor: '#FAF9F7',
    borderWidth: 0.7, borderColor: '#DDD9D3',
  },
  dateArrow: { paddingHorizontal: 8 },
  dateLabel: { fontSize: 11, color: '#A09B94', marginTop: 4 },
  dateValue: { fontSize: 14, fontWeight: '700', color: '#4A4540', marginTop: 2 },

  // Days
  daysWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  dayChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#ECEAE6', marginRight: 8, marginBottom: 8,
  },
  dayChipActive: { backgroundColor: '#8D6E63' },
  dayChipText: { fontSize: 13, fontWeight: '600', color: '#6B6560' },
  dayChipTextActive: { fontSize: 13, fontWeight: '600', color: '#FFF' },

  // Switch
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontWeight: '600', color: '#4A4540', flex: 1 },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  timeBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12,
    borderRadius: 14, backgroundColor: '#FAF9F7', borderWidth: 0.7, borderColor: '#DDD9D3',
  },
  timeValue: { fontSize: 16, fontWeight: '700', color: '#4A4540', marginLeft: 8 },

  // Save
  saveBtn: { backgroundColor: '#8D6E63', borderRadius: 14 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnContent: { height: 52 },
  bottomSpacer: { height: 24 },
});

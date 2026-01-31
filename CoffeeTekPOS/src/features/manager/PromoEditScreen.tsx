import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { Text, TextInput, Surface, Switch, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  usePromoStore,
  Promotion,
  DayOfWeek,
  getDayLabel,
} from '../../store/promo.store';
import { ManagerHeader } from '../../components/ManagerHeader';
import { Colors } from '../../constants/app.constant';
import { formatCurrency } from '../../utils/format';

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

export const PromoEditScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const promoId = route.params?.promoId ?? null;
  const { getPromo, addPromo, updatePromo } = usePromoStore();

  const isEdit = !!promoId;
  const existing = promoId ? getPromo(promoId) : null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState('');
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

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setDescription(existing.description);
      setDiscountType(existing.discountType);
      setDiscountValue(String(existing.discountValue));
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

  const onDateChange = (_: any, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (!selected) return;
    const str = toISO(selected);
    if (datePickerMode === 'start') {
      setStartDate(str);
      setStartDateDisplay(selected);
      if (str > endDate) {
        setEndDate(str);
        setEndDateDisplay(selected);
      }
    } else {
      setEndDate(str);
      setEndDateDisplay(selected);
      if (str < startDate) {
        setStartDate(str);
        setStartDateDisplay(selected);
      }
    }
  };

  const onTimeChange = (_: any, selected?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (!selected) return;
    const str = dateToTimeString(selected);
    if (timePickerMode === 'start') {
      setTimeStart(str);
      setTimeStartDisplay(selected);
    } else {
      setTimeEnd(str);
      setTimeEndDisplay(selected);
    }
  };

  const openDatePicker = (mode: 'start' | 'end') => {
    setDatePickerMode(mode);
    setShowDatePicker(true);
  };

  const openTimePicker = (mode: 'start' | 'end') => {
    setTimePickerMode(mode);
    setShowTimePicker(true);
  };

  const handleSave = () => {
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
      startDate: startDate || toISO(new Date()),
      endDate: endDate || toISO(new Date()),
      daysOfWeek,
      timeStart: useTimeRange ? (timeStart || '00:00') : null,
      timeEnd: useTimeRange ? (timeEnd || '23:59') : null,
      is_active,
    };

    if (isEdit && promoId) {
      updatePromo(promoId, payload);
    } else {
      addPromo(payload);
    }
    navigation.goBack();
  };

  const canSave = name.trim().length > 0 && discountValue.length > 0;

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
          <Surface style={styles.section} elevation={1}>
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
          </Surface>

          <Surface style={styles.section} elevation={1}>
            <Text variant="labelLarge" style={styles.sectionTitle}>
              Giảm giá
            </Text>
            <View style={styles.discountRow}>
              <TouchableOpacity
                style={[styles.discountTypeBtn, discountType === 'percent' && styles.discountTypeActive]}
                onPress={() => setDiscountType('percent')}
              >
                <Text style={discountType === 'percent' ? styles.discountTypeTextActive : styles.discountTypeText}>
                  %
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.discountTypeBtn, discountType === 'fixed' && styles.discountTypeActive]}
                onPress={() => setDiscountType('fixed')}
              >
                <Text style={discountType === 'fixed' ? styles.discountTypeTextActive : styles.discountTypeText}>
                  VND
                </Text>
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
          </Surface>

          <Surface style={styles.section} elevation={1}>
            <Text variant="labelLarge" style={styles.sectionTitle}>
              Thời gian áp dụng
            </Text>
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
          </Surface>

          <Surface style={styles.section} elevation={1}>
            <Text variant="labelLarge" style={styles.sectionTitle}>
              Áp dụng các thứ
            </Text>
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
          </Surface>

          <Surface style={styles.section} elevation={1}>
            <View style={styles.switchRow}>
              <Text variant="bodyMedium" style={styles.switchLabel}>
                Khung giờ (Happy Hour)
              </Text>
              <Switch
                value={useTimeRange}
                onValueChange={(v) => {
                  setUseTimeRange(v);
                  if (v && !timeStart) setTimeStart('14:00');
                  if (v && !timeEnd) setTimeEnd('17:00');
                }}
                color={Colors.primary}
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
          </Surface>

          <Surface style={styles.section} elevation={1}>
            <View style={styles.switchRow}>
              <Text variant="bodyMedium" style={styles.switchLabel}>
                Bật chương trình ngay
              </Text>
              <Switch value={is_active} onValueChange={setIsActive} color={Colors.primary} />
            </View>
          </Surface>

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F4F8' },
  flex: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  section: {
    borderRadius: 16,
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  input: { marginBottom: 12, backgroundColor: '#FFF' },
  inputLast: { marginBottom: 0 },
  discountRow: { flexDirection: 'row', marginBottom: 12 },
  discountTypeBtn: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: '#F1F3F5',
    alignItems: 'center',
  },
  discountTypeActive: { backgroundColor: Colors.primary },
  discountTypeText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  discountTypeTextActive: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  valueInput: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: '#2D3748',
    backgroundColor: '#F8FAFC',
  },
  hint: { fontSize: 12, color: '#94A3B8', marginTop: 6 },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  dateBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  dateArrow: { paddingHorizontal: 8 },
  dateLabel: { fontSize: 11, color: '#64748B', marginTop: 4 },
  dateValue: { fontSize: 14, fontWeight: '700', color: '#2D3748', marginTop: 2 },
  daysWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F1F3F5',
    marginRight: 8,
    marginBottom: 8,
  },
  dayChipActive: { backgroundColor: Colors.primary },
  dayChipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  dayChipTextActive: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: { fontWeight: '600', color: '#374151', flex: 1 },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  timeBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  timeValue: { fontSize: 16, fontWeight: '700', color: '#2D3748', marginLeft: 8 },
  saveBtn: { backgroundColor: '#E91E63', borderRadius: 14 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnContent: { height: 52 },
  bottomSpacer: { height: 24 },
});

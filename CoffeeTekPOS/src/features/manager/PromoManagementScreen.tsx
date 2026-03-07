import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Text as RNText,
} from 'react-native';
import { Text, Searchbar, Switch, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { usePromoStore, Promotion, getDayLabel } from '../../store/promo.store';
import { ManagerHeader } from '../../components/ManagerHeader';
import { Colors } from '../../constants/app.constant';
import { formatCurrency, formatDateDMY, formatTimeHM } from '../../utils/format';

type FilterStatus = 'all' | 'active' | 'inactive';

export const PromoManagementScreen = () => {
  const navigation = useNavigation<any>();
  const { promotions, toggleActive, fetchPromotions } = usePromoStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  useFocusEffect(
    React.useCallback(() => {
      fetchPromotions();
    }, [fetchPromotions])
  );

  const filtered = useMemo(() => {
    let list = promotions;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }
    if (filterStatus === 'active') list = list.filter((p) => p.is_active);
    if (filterStatus === 'inactive') list = list.filter((p) => !p.is_active);
    return list;
  }, [promotions, searchQuery, filterStatus]);

  const renderDiscount = (p: Promotion) => {
    if (p.discountType === 'percent') {
      return `${p.discountValue}%`;
    }
    return formatCurrency(p.discountValue);
  };

  const renderTimeRange = (p: Promotion) => {
    if (!p.timeStart && !p.timeEnd) return 'Cả ngày';
    const from = formatTimeHM(p.timeStart || '00:00');
    const to = formatTimeHM(p.timeEnd || '23:59');
    return `${from} - ${to}`;
  };

  const renderDays = (p: Promotion) => {
    if (!p.daysOfWeek || p.daysOfWeek.length === 0) return 'Mọi ngày';
    const sorted = [...p.daysOfWeek].sort((a, b) => a - b);
    return sorted.map((d) => getDayLabel(d as 0 | 1 | 2 | 3 | 4 | 5 | 6)).join(', ');
  };

  return (
    <View style={styles.container}>
      <ManagerHeader
        title="Khuyến mãi"
        subtitle="Bật/Tắt & Chỉnh sửa chương trình"
      />

      <View style={styles.searchWrap}>
        <Searchbar
          placeholder="Tìm tên hoặc mô tả..."
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
        {[
          { key: 'all' as const, label: 'Tất cả' },
          { key: 'active' as const, label: 'Đang bật' },
          { key: 'inactive' as const, label: 'Đã tắt' },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilterStatus(f.key)}
            activeOpacity={0.8}
            style={[styles.chip, filterStatus === f.key && styles.chipActive]}
          >
            <RNText
              style={[styles.chipText, filterStatus === f.key && styles.chipTextActive]}
            >
              {f.label}
            </RNText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons
              name="ticket-percent-outline"
              size={56}
              color="#C4C4C4"
            />
            <Text style={styles.emptyText}>Chưa có khuyến mãi phù hợp</Text>
            <Text style={styles.emptySub}>Thêm mới bằng nút + bên dưới</Text>
          </View>
        ) : (
          filtered.map((p) => (
            <View key={p.id} style={styles.card}>
              <TouchableOpacity
                style={styles.cardTouch}
                onPress={() => navigation.navigate('PromoEditScreen', { promoId: p.id })}
                activeOpacity={0.9}
              >
                <View
                  style={[
                    styles.badgeWrap,
                    { backgroundColor: p.is_active ? '#E8F5E9' : '#F5F5F5' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="ticket-percent"
                    size={24}
                    color={p.is_active ? '#2E7D32' : '#9E9E9E'}
                  />
                  <View style={styles.cardBody}>
                    <RNText
                      style={[styles.cardName, !p.is_active && styles.cardNameInactive]}
                      numberOfLines={1}
                    >
                      {p.name}
                    </RNText>
                    {p.description ? (
                      <RNText
                        style={styles.cardDesc}
                        numberOfLines={2}
                      >
                        {p.description}
                      </RNText>
                    ) : null}
                    <View style={styles.cardMeta}>
                      <View style={styles.discountChip}>
                        <RNText style={styles.discountText}>
                          {renderDiscount(p)}
                        </RNText>
                      </View>
                      {/* Scope badge */}
                      {p.applyTo && p.applyTo !== 'BILL' && (
                        <View style={{
                          backgroundColor: p.applyTo === 'CATEGORY' ? '#FFF3E0' : '#E3F2FD',
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 8,
                          marginRight: 8,
                          marginBottom: 4,
                        }}>
                          <RNText style={{
                            color: p.applyTo === 'CATEGORY' ? '#E65100' : '#1565C0',
                            fontWeight: '600', fontSize: 11,
                          }}>
                            {p.applyTo === 'CATEGORY' ? 'Nhóm món' : 'Món'}
                          </RNText>
                        </View>
                      )}
                      <RNText style={styles.metaText}>{renderTimeRange(p)}</RNText>
                      <RNText style={styles.metaText}>{renderDays(p)}</RNText>
                    </View>
                    <RNText style={styles.dateRange}>
                      {formatDateDMY(p.startDate)} → {formatDateDMY(p.endDate)}
                    </RNText>
                  </View>
                </View>
                <View style={styles.cardFooter}>
                  <RNText style={styles.switchLabel}>
                    {p.is_active ? 'Đang bật' : 'Đã tắt'}
                  </RNText>
                  <Switch
                    value={p.is_active}
                    onValueChange={() => toggleActive(p.id)}
                    color={Colors.primary}
                    style={styles.switch}
                  />
                </View>
              </TouchableOpacity>
            </View>
          ))
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <FAB
        icon="plus"
        color="#FFF"
        style={styles.fab}
        onPress={() => navigation.navigate('PromoEditScreen', { promoId: null })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F3F1' },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  searchBar: {
    backgroundColor: '#ECEAE6',
    borderRadius: 14,
    elevation: 0,
    shadowOpacity: 0,
  },
  searchInput: { minHeight: 0, fontSize: 15, color: '#4A4540' },
  chipScroll: { maxHeight: 46, marginBottom: 6 },
  chipWrap: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ECEAE6',
    marginRight: 10,
  },
  chipActive: { backgroundColor: '#8D6E63' },
  chipText: { fontSize: 13, color: '#6B6560', fontWeight: '500' },
  chipTextActive: { fontSize: 13, color: '#FFF', fontWeight: '600' },
  listContent: { padding: 16, paddingBottom: 24 },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: { marginTop: 12, fontSize: 16, color: '#8D6E63', fontWeight: '600' },
  emptySub: { marginTop: 4, fontSize: 13, color: '#A09B94' },

  card: {
    borderRadius: 18,
    backgroundColor: '#ffffffff',
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTouch: { padding: 0 },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  cardBody: { flex: 1, marginLeft: 12, minWidth: 0 },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A4540',
    marginBottom: 4,
  },
  cardNameInactive: { color: '#B5AEA7' },
  cardDesc: {
    fontSize: 13,
    color: '#6B6560',
    marginBottom: 8,
    lineHeight: 18,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 4,
  },
  discountChip: {
    backgroundColor: '#8D6E63',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  discountText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  metaText: {
    fontSize: 11,
    color: '#A09B94',
    marginRight: 8,
    marginBottom: 4,
  },
  dateRange: {
    fontSize: 11,
    color: '#B5AEA7',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 0.7,
    borderTopColor: '#ECEAE6',
  },
  switchLabel: { fontSize: 13, color: '#6B6560', fontWeight: '500' },
  switch: { transform: [{ scale: 0.9 }] },
  bottomSpacer: { height: 80 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    backgroundColor: '#8D6E63',
    borderRadius: 28,
  },
});

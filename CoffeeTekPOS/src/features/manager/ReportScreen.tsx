import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Text, SegmentedButtons } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { ManagerHeader } from '../../components/ManagerHeader';
import { Colors } from '../../constants/app.constant';
import { formatCurrency, formatDateDMY } from '../../utils/format';
import { reportApi } from '../../api/report.api';

// Helper: Format ngày YYYY-MM-DD (theo local để tránh lệch timezone)
const formatDateAPI = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const ReportScreen = () => {
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'TODAY' | 'YESTERDAY' | 'THIS_MONTH' | 'CUSTOM'>('TODAY');
  const [reportTab, setReportTab] = useState('PRODUCT');

  // Custom date range
  const [customStart, setCustomStart] = useState(new Date());
  const [customEnd, setCustomEnd] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'START' | 'END'>('START');

  // Data State
  const [summary, setSummary] = useState({
    net_revenue: 0,
    total_orders: 0,
    total_sales: 0,
    total_discount: 0
  });
  const [listData, setListData] = useState<any[]>([]);

  const getDateRange = (type: typeof filterType) => {
    if (type === 'CUSTOM') {
      return { startDate: formatDateAPI(customStart), endDate: formatDateAPI(customEnd) };
    }

    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'YESTERDAY') {
      start.setDate(today.getDate() - 1);
      end.setDate(today.getDate() - 1);
    } else if (type === 'THIS_MONTH') {
      start.setDate(1);
    }

    return {
      startDate: formatDateAPI(start),
      endDate: formatDateAPI(end)
    };
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange(filterType);

      try {
        const resSum = await reportApi.getSummary(startDate, endDate);
        setSummary(resSum.data);
      } catch (e) {
        console.error('[Report] Lỗi load summary:', e);
      }

      try {
        let resList;
        if (reportTab === 'PRODUCT') {
          resList = await reportApi.getByProduct(startDate, endDate);
        } else {
          resList = await reportApi.getByCategory(startDate, endDate);
        }
        const data = Array.isArray(resList.data) ? resList.data : [];
        setListData(data);
      } catch (e) {
        console.error('[Report] Lỗi load list data:', e);
        setListData([]);
      }

    } catch (error) {
      console.error('[Report] Lỗi chung:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [filterType, reportTab, customStart, customEnd]);

  useFocusEffect(
    useCallback(() => {
      loadReport();
    }, [filterType, reportTab, customStart, customEnd])
  );

  const onDateChange = (_event: any, selectedDate?: Date) => {
    // Android: always close after selection or cancel
    if (Platform.OS === 'android') setShowPicker(false);
    if (!selectedDate) return;

    if (pickerMode === 'START') {
      setCustomStart(selectedDate);
      if (selectedDate > customEnd) setCustomEnd(selectedDate);
    } else {
      setCustomEnd(selectedDate);
      if (selectedDate < customStart) setCustomStart(selectedDate);
    }
  };

  const openDatePicker = (mode: 'START' | 'END') => {
    setPickerMode(mode);
    setShowPicker(true);
  };

  // --- COMPONENTS ---

  const SummaryCard = ({ title, value, icon, color, isMoney = false }: any) => (
    <View style={styles.summaryCard}>
      <View style={[styles.iconBox, { backgroundColor: color + '18' }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.summaryLabel}>{title}</Text>
      <Text variant="titleMedium" style={styles.summaryValue}>
        {isMoney ? formatCurrency(value) : value}
      </Text>
    </View>
  );

  const ChartRow = ({ item, index, maxValue }: any) => {
    const isProduct = reportTab === 'PRODUCT';
    const name = isProduct ? item.product_name : item.category_name;
    const sub = isProduct ? item.category_name : `${item.total_quantity} món`;
    const percent = maxValue > 0 ? (item.total_revenue / maxValue) * 100 : 0;

    return (
      <View style={styles.chartRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Text style={styles.chartRank}>#{index + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.chartName}>{name}</Text>
            <Text style={styles.chartSub}>{sub}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.chartRevenue}>
              {formatCurrency(item.total_revenue)}
            </Text>
            <Text style={styles.chartQty}>
              {item.total_quantity} đơn vị
            </Text>
          </View>
        </View>

        <View style={styles.barBg}>
          <View style={[
            styles.barFill,
            {
              width: `${percent}%`,
              backgroundColor: index < 3 ? '#8D6E63' : '#C8BEB7',
            }
          ]} />
        </View>
      </View>
    );
  };

  const maxRevenue = useMemo(() => {
    return Math.max(...listData.map(d => d.total_revenue), 0);
  }, [listData]);

  return (
    <View style={styles.container}>
      <ManagerHeader title="Báo cáo" subtitle="Hiệu quả kinh doanh" />

      {/* FILTER BAR */}
      <View style={styles.filterBar}>
        <SegmentedButtons
          value={filterType}
          onValueChange={(v) => setFilterType(v as any)}
          buttons={[
            {
              value: 'TODAY', label: 'Hôm nay',
              checkedColor: '#FFF', uncheckedColor: '#6B6560',
              style: filterType === 'TODAY' ? styles.segBtnActive : styles.segBtnInactive
            },
            {
              value: 'YESTERDAY', label: 'Hôm qua',
              checkedColor: '#FFF', uncheckedColor: '#6B6560',
              style: filterType === 'YESTERDAY' ? styles.segBtnActive : styles.segBtnInactive
            },
            {
              value: 'THIS_MONTH', label: 'Tháng này',
              checkedColor: '#FFF', uncheckedColor: '#6B6560',
              style: filterType === 'THIS_MONTH' ? styles.segBtnActive : styles.segBtnInactive
            },
            {
              value: 'CUSTOM', label: 'Tùy chọn', icon: 'calendar',
              checkedColor: '#FFF', uncheckedColor: '#6B6560',
              style: filterType === 'CUSTOM' ? styles.segBtnActive : styles.segBtnInactive
            },
          ]}
          style={styles.segmented}
          density="small"
          theme={{
            colors: {
              secondaryContainer: '#8D6E63',
              onSecondaryContainer: '#FFF',
              outline: '#DDD9D3',
            }
          }}
        />

        {filterType === 'CUSTOM' && (
          <View style={styles.customDateContainer}>
            <TouchableOpacity style={styles.dateBox} onPress={() => openDatePicker('START')}>
              <Text style={styles.dateLabel}>Từ ngày</Text>
              <View style={styles.dateValueRow}>
                <MaterialCommunityIcons name="calendar-start" size={18} color="#8D6E63" />
                <Text style={styles.dateValue}>{formatDateDMY(customStart)}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.arrowBox}>
              <MaterialCommunityIcons name="arrow-right" size={18} color="#A09B94" />
            </View>

            <TouchableOpacity style={styles.dateBox} onPress={() => openDatePicker('END')}>
              <Text style={styles.dateLabel}>Đến ngày</Text>
              <View style={styles.dateValueRow}>
                <MaterialCommunityIcons name="calendar-end" size={18} color="#8D6E63" />
                <Text style={styles.dateValue}>{formatDateDMY(customEnd)}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* DateTimePicker (iOS: inline with close button, Android: auto-dismiss) */}
      {showPicker && (
        <View style={styles.pickerWrap}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>
              {pickerMode === 'START' ? 'Chọn ngày bắt đầu' : 'Chọn ngày kết thúc'}
            </Text>
            <TouchableOpacity onPress={() => setShowPicker(false)} style={styles.pickerCloseBtn}>
              <MaterialCommunityIcons name="close" size={20} color="#8D6E63" />
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={pickerMode === 'START' ? customStart : customEnd}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator color="#8D6E63" size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* DOANH THU THỰC TẾ */}
          <View style={styles.bigRevenueCard}>
            <View>
              <Text style={styles.revLabel}>Doanh thu thực tế</Text>
              <Text variant="headlineMedium" style={styles.revValue}>
                {formatCurrency(summary.net_revenue)}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="arrow-up-circle" color="#E6DDD8" size={16} />
                <Text style={styles.revPeriod}>
                  {filterType === 'TODAY'
                    ? 'Hôm nay'
                    : filterType === 'YESTERDAY'
                      ? 'Hôm qua'
                      : filterType === 'THIS_MONTH'
                        ? 'Tháng này'
                        : `${formatDateDMY(customStart)} - ${formatDateDMY(customEnd)}`}
                </Text>
              </View>
            </View>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <MaterialCommunityIcons name="finance" size={30} color="white" />
            </View>
          </View>

          {/* GRID THÔNG SỐ */}
          <View style={styles.grid}>
            <SummaryCard
              title="Tổng đơn hàng"
              value={summary.total_orders}
              icon="receipt"
              color="#6B8F5E"
            />
            <SummaryCard
              title="Tổng doanh số"
              value={summary.total_sales}
              icon="cash-plus"
              color="#8D6E63"
              isMoney
            />
            <SummaryCard
              title="Tổng giảm giá"
              value={summary.total_discount}
              icon="ticket-percent"
              color="#C47B6F"
              isMoney
            />
            <SummaryCard
              title="Trung bình/đơn"
              value={summary.total_orders > 0 ? Math.round(summary.net_revenue / summary.total_orders) : 0}
              icon="chart-timeline-variant"
              color="#9B8A7E"
              isMoney
            />
          </View>

          {/* Divider */}
          <View style={styles.sectionDivider} />

          {/* TOP TRENDING */}
          <View style={styles.rankingHeader}>
            <Text variant="titleLarge" style={styles.rankingTitle}>Top hiệu quả</Text>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity onPress={() => setReportTab('PRODUCT')}>
                <Text style={[styles.tabTitle, reportTab === 'PRODUCT' && styles.tabActive]}>Món</Text>
              </TouchableOpacity>
              <View style={{ width: 15 }} />
              <TouchableOpacity onPress={() => setReportTab('CATEGORY')}>
                <Text style={[styles.tabTitle, reportTab === 'CATEGORY' && styles.tabActive]}>Danh mục</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.rankingList}>
            {listData.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có dữ liệu</Text>
            ) : (
              listData.map((item, index) => (
                <View key={index}>
                  <ChartRow item={item} index={index} maxValue={maxRevenue} />
                  {index < listData.length - 1 && <View style={styles.rowDivider} />}
                </View>
              ))
            )}
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F3F1' },
  scrollContent: { padding: 16 },

  // Filter bar
  filterBar: {
    padding: 16,
    backgroundColor: '#FAF9F7',
    borderBottomWidth: 0.7,
    borderBottomColor: '#ECEAE6',
  },
  segmented: { marginBottom: 0 },
  segBtnActive: {
    backgroundColor: '#8D6E63',
    borderColor: '#8D6E63',
  },
  segBtnInactive: {
    backgroundColor: 'transparent',
    borderColor: '#DDD9D3',
  },

  // Custom date
  customDateContainer: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F4F3F1',
    padding: 10,
    borderRadius: 14,
    borderWidth: 0.7,
    borderColor: '#DDD9D3',
  },
  dateBox: {
    flex: 1,
    alignItems: 'center',
    padding: 4,
  },
  dateLabel: { fontSize: 11, color: '#A09B94', marginBottom: 2 },
  dateValueRow: { flexDirection: 'row', alignItems: 'center' },
  dateValue: { fontWeight: '700', fontSize: 14, marginLeft: 6, color: '#4A4540' },
  arrowBox: { paddingHorizontal: 8 },

  // DatePicker wrapper (dismissible)
  pickerWrap: {
    backgroundColor: '#FAF9F7',
    borderBottomWidth: 0.7,
    borderBottomColor: '#ECEAE6',
    paddingBottom: 8,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  pickerTitle: { fontSize: 14, fontWeight: '600', color: '#6B6560' },
  pickerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ECEAE6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Big Revenue Card
  bigRevenueCard: {
    backgroundColor: '#5D4037',
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  revLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  revValue: { color: 'white', fontWeight: 'bold', marginVertical: 4 },
  revPeriod: { color: '#E6DDD8', fontSize: 12, marginLeft: 4 },

  // Grid Summary
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  summaryCard: {
    width: '48%',
    backgroundColor: '#ffffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    alignItems: 'flex-start',
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  summaryLabel: { fontSize: 12, color: '#A09B94', marginTop: 8 },
  summaryValue: { fontWeight: '700', color: '#4A4540' },
  iconBox: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },

  // Divider
  sectionDivider: {
    height: 0.7,
    backgroundColor: '#DDD9D3',
    marginVertical: 18,
  },

  // Ranking Section
  rankingHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  rankingTitle: { fontWeight: '700', color: '#4A4540' },
  tabTitle: { fontSize: 15, color: '#A09B94', fontWeight: '600' },
  tabActive: { color: '#8D6E63', borderBottomWidth: 2, borderBottomColor: '#8D6E63' },

  rankingList: {
    backgroundColor: '#ffffffff',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  // Chart row
  chartRow: {},
  chartRank: { fontWeight: '700', width: 25, color: '#B5AEA7' },
  chartName: { fontWeight: '600', fontSize: 14, color: '#4A4540' },
  chartSub: { fontSize: 12, color: '#A09B94' },
  chartRevenue: { fontWeight: '700', color: '#5D4037' },
  chartQty: { fontSize: 11, color: '#A09B94' },
  barBg: { height: 5, backgroundColor: '#ECEAE6', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  rowDivider: { height: 0.7, backgroundColor: '#ECEAE6', marginVertical: 10 },

  emptyText: { textAlign: 'center', padding: 20, color: '#A09B94' },
});
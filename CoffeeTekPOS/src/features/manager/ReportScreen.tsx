// import React, { useState, useEffect, useMemo } from 'react';
// import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Platform } from 'react-native';
// import { Text, Surface, Divider, SegmentedButtons, Button } from 'react-native-paper';
// import { MaterialCommunityIcons } from '@expo/vector-icons';
// import DateTimePicker from '@react-native-community/datetimepicker'; // [MỚI] Import thư viện

// import { ManagerHeader } from '../../components/ManagerHeader';
// import { Colors } from '../../constants/app.constant';
// import { formatCurrency } from '../../utils/format';
// import { reportApi } from '../../api/report.api';

// // Helper: Format ngày YYYY-MM-DD để gọi API
// const formatDateAPI = (date: Date) => date.toISOString().split('T')[0];

// // Helper: Format ngày DD/MM/YYYY để hiển thị đẹp
// const formatDateDisplay = (date: Date) => {
//   return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
// };

// export const ReportScreen = () => {
//   const [loading, setLoading] = useState(false);
//   const [filterType, setFilterType] = useState('TODAY'); // TODAY | YESTERDAY | THIS_MONTH | CUSTOM
//   const [reportTab, setReportTab] = useState('PRODUCT'); // PRODUCT | CATEGORY
  
//   // State cho Tùy chọn ngày
//   const [customStart, setCustomStart] = useState(new Date());
//   const [customEnd, setCustomEnd] = useState(new Date());
//   const [showPicker, setShowPicker] = useState(false);
//   const [pickerMode, setPickerMode] = useState<'START' | 'END'>('START');

//   // Data State
//   const [summary, setSummary] = useState({
//     net_revenue: 0,
//     total_orders: 0,
//     total_sales: 0,
//     total_discount: 0
//   });
//   const [listData, setListData] = useState<any[]>([]);

//   // --- LOGIC LẤY NGÀY ---
//   const getDateRange = () => {
//     if (filterType === 'CUSTOM') {
//       return {
//         startDate: formatDateAPI(customStart),
//         endDate: formatDateAPI(customEnd)
//       };
//     }

//     const today = new Date();
//     let start = new Date();
//     let end = new Date();

//     if (filterType === 'YESTERDAY') {
//         start.setDate(today.getDate() - 1);
//         end.setDate(today.getDate() - 1);
//     } else if (filterType === 'THIS_MONTH') {
//         start.setDate(1); // Ngày 1 đầu tháng
//         // End là hôm nay
//     }
//     // TODAY: start = end = today

//     return { 
//         startDate: formatDateAPI(start), 
//         endDate: formatDateAPI(end) 
//     };
//   };

//   // --- LOAD DATA ---
//   const loadReport = async () => {
//     setLoading(true);
//     try {
//         const { startDate, endDate } = getDateRange();
        
//         // Gọi API song song cho nhanh
//         const [resSum, resList] = await Promise.all([
//           reportApi.getSummary(startDate, endDate),
//           reportTab === 'PRODUCT' 
//             ? reportApi.getByProduct(startDate, endDate) 
//             : reportApi.getByCategory(startDate, endDate)
//         ]);

//         setSummary(resSum.data);
//         setListData(resList.data);

//     } catch (error) {
//         console.error("Lỗi load báo cáo:", error);
//     } finally {
//         setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadReport();
//   }, [filterType, reportTab, customStart, customEnd]); // Tự reload khi đổi ngày custom

//   // --- XỬ LÝ CHỌN NGÀY ---
//   const onDateChange = (event: any, selectedDate?: Date) => {
//     setShowPicker(false); // Đóng picker ngay sau khi chọn (Android)
//     if (selectedDate) {
//       if (pickerMode === 'START') {
//         setCustomStart(selectedDate);
//         // Nếu ngày bắt đầu lớn hơn ngày kết thúc -> Tự đẩy ngày kết thúc lên
//         if (selectedDate > customEnd) {
//           setCustomEnd(selectedDate);
//         }
//       } else {
//         // Nếu ngày kết thúc nhỏ hơn ngày bắt đầu -> Không cho phép (hoặc reset)
//         if (selectedDate < customStart) {
//            // Có thể alert lỗi, ở đây ta tự chỉnh ngày start về ngày end cho hợp lý
//            setCustomStart(selectedDate);
//         }
//         setCustomEnd(selectedDate);
//       }
//     }
//   };

//   const openDatePicker = (mode: 'START' | 'END') => {
//     setPickerMode(mode);
//     setShowPicker(true);
//   };

//   // --- COMPONENTS CON ---
//   const SummaryCard = ({ title, value, icon, color, isMoney = false }: any) => (
//     <Surface style={styles.summaryCard} elevation={2}>
//         <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
//             <MaterialCommunityIcons name={icon} size={24} color={color} />
//         </View>
//         <Text style={{fontSize: 12, color: '#666', marginTop: 8}}>{title}</Text>
//         <Text variant="titleMedium" style={{fontWeight: 'bold', color: '#333'}}>
//             {isMoney ? formatCurrency(value) : value}
//         </Text>
//     </Surface>
//   );

//   const ChartRow = ({ item, index, maxValue }: any) => {
//     const isProduct = reportTab === 'PRODUCT';
//     const name = isProduct ? item.product_name : item.category_name;
//     const sub = isProduct ? item.category_name : `${item.total_quantity} món`;
//     const percent = maxValue > 0 ? (item.total_revenue / maxValue) * 100 : 0;

//     return (
//         <View style={styles.chartRow}>
//             <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 6}}>
//                 <Text style={{fontWeight: 'bold', width: 25, color: '#888'}}>#{index + 1}</Text>
//                 <View style={{flex: 1}}>
//                     <Text style={{fontWeight: '600', fontSize: 15}}>{name}</Text>
//                     <Text style={{fontSize: 12, color: '#999'}}>{sub}</Text>
//                 </View>
//                 <View style={{alignItems: 'flex-end'}}>
//                     <Text style={{fontWeight: 'bold', color: Colors.primary}}>
//                         {formatCurrency(item.total_revenue)}
//                     </Text>
//                     <Text style={{fontSize: 11, color: '#666'}}>
//                         {item.total_quantity} đã bán
//                     </Text>
//                 </View>
//             </View>
//             <View style={{height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden'}}>
//                 <View style={{
//                     height: '100%', 
//                     width: `${percent}%`, 
//                     backgroundColor: index < 3 ? Colors.primary : '#BCAAA4',
//                     borderRadius: 3
//                 }} />
//             </View>
//         </View>
//     );
//   };

//   const maxRevenue = useMemo(() => {
//     return Math.max(...listData.map(d => d.total_revenue), 0);
//   }, [listData]);

//   return (
//     <View style={styles.container}>
//       <ManagerHeader title="Báo Cáo" subtitle="Hiệu quả kinh doanh" />
      
//       {/* KHU VỰC BỘ LỌC */}
//       <View style={styles.filterBar}>
//          <SegmentedButtons
//             value={filterType}
//             onValueChange={setFilterType}
//             buttons={[
//               { value: 'TODAY', label: 'Hôm nay' },
//               { value: 'YESTERDAY', label: 'Hôm qua' },
//               { value: 'THIS_MONTH', label: 'Tháng này' },
//               { value: 'CUSTOM', label: 'Tùy chọn', icon: 'calendar' }, // Tab mới
//             ]}
//             style={styles.segmented}
//             density="small"
//          />

//          {/* Nếu chọn CUSTOM -> Hiện 2 ô chọn ngày */}
//          {filterType === 'CUSTOM' && (
//            <View style={styles.customDateContainer}>
//              <TouchableOpacity style={styles.dateBox} onPress={() => openDatePicker('START')}>
//                <Text style={styles.dateLabel}>Từ ngày</Text>
//                <View style={styles.dateValueRow}>
//                  <MaterialCommunityIcons name="calendar-start" size={20} color={Colors.primary} />
//                  <Text style={styles.dateValue}>{formatDateDisplay(customStart)}</Text>
//                </View>
//              </TouchableOpacity>

//              <View style={styles.arrowBox}>
//                <MaterialCommunityIcons name="arrow-right" size={20} color="#999" />
//              </View>

//              <TouchableOpacity style={styles.dateBox} onPress={() => openDatePicker('END')}>
//                <Text style={styles.dateLabel}>Đến ngày</Text>
//                <View style={styles.dateValueRow}>
//                  <MaterialCommunityIcons name="calendar-end" size={20} color={Colors.primary} />
//                  <Text style={styles.dateValue}>{formatDateDisplay(customEnd)}</Text>
//                </View>
//              </TouchableOpacity>
//            </View>
//          )}
//       </View>

//       {/* COMPONENT DATE PICKER (Ẩn/Hiện) */}
//       {showPicker && (
//         <DateTimePicker
//           value={pickerMode === 'START' ? customStart : customEnd}
//           mode="date"
//           display={Platform.OS === 'ios' ? 'spinner' : 'default'}
//           onChange={onDateChange}
//           maximumDate={new Date()} // Không chọn tương lai
//         />
//       )}

//       {loading ? (
//           <View style={{flex:1, justifyContent:'center'}}><ActivityIndicator color={Colors.primary} size="large"/></View>
//       ) : (
//           <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
//             {/* DOANH THU THỰC TẾ */}
//             <Surface style={styles.bigRevenueCard} elevation={4}>
//                 <View>
//                     <Text style={{color: 'rgba(255,255,255,0.8)'}}>Doanh thu ròng</Text>
//                     <Text variant="headlineMedium" style={{color: 'white', fontWeight: 'bold', marginVertical: 4}}>
//                         {formatCurrency(summary.net_revenue)}
//                     </Text>
//                     <View style={{flexDirection: 'row', alignItems: 'center'}}>
//                         <Text style={{color: '#E0E0E0', fontSize: 12}}>
//                            {filterType === 'TODAY' ? 'Hôm nay' : 
//                             filterType === 'CUSTOM' ? `${formatDateDisplay(customStart)} - ${formatDateDisplay(customEnd)}` : 
//                             'Trong khoảng thời gian này'}
//                         </Text>
//                     </View>
//                 </View>
//                 <View style={[styles.iconBox, {backgroundColor: 'rgba(255,255,255,0.2)'}]}>
//                     <MaterialCommunityIcons name="finance" size={32} color="white" />
//                 </View>
//             </Surface>

//             {/* THẺ GRID */}
//             <View style={styles.grid}>
//                 <SummaryCard 
//                     title="Đơn hàng" 
//                     value={summary.total_orders} 
//                     icon="receipt" 
//                     color="#2196F3" 
//                 />
//                 <SummaryCard 
//                     title="Doanh số gộp" 
//                     value={summary.total_sales} 
//                     icon="cash-plus" 
//                     color="#4CAF50" 
//                     isMoney 
//                 />
//                 <SummaryCard 
//                     title="Giảm giá" 
//                     value={summary.total_discount} 
//                     icon="ticket-percent" 
//                     color="#FF9800" 
//                     isMoney 
//                 />
//                 <SummaryCard 
//                     title="TB mỗi đơn" 
//                     value={summary.total_orders > 0 ? Math.round(summary.net_revenue / summary.total_orders) : 0} 
//                     icon="chart-timeline-variant" 
//                     color="#9C27B0" 
//                     isMoney 
//                 />
//             </View>

//             <Divider style={{marginVertical: 20, height: 6, backgroundColor: '#F0F0F0'}} />

//             {/* TOP TRENDING */}
//             <View style={styles.rankingHeader}>
//                 <Text variant="titleLarge" style={{fontWeight: 'bold', color: '#333'}}>Top Hiệu Quả</Text>
//                 <View style={{flexDirection: 'row'}}>
//                     <TouchableOpacity onPress={() => setReportTab('PRODUCT')}>
//                         <Text style={[styles.tabTitle, reportTab === 'PRODUCT' && styles.tabActive]}>Món</Text>
//                     </TouchableOpacity>
//                     <View style={{width: 15}} />
//                     <TouchableOpacity onPress={() => setReportTab('CATEGORY')}>
//                         <Text style={[styles.tabTitle, reportTab === 'CATEGORY' && styles.tabActive]}>Danh mục</Text>
//                     </TouchableOpacity>
//                 </View>
//             </View>
            
//             <Surface style={styles.rankingList} elevation={1}>
//                 {listData.length === 0 ? (
//                     <Text style={{textAlign: 'center', padding: 20, color: '#999'}}>Chưa có dữ liệu</Text>
//                 ) : (
//                     listData.map((item, index) => (
//                         <View key={index}>
//                              <ChartRow item={item} index={index} maxValue={maxRevenue} />
//                              {index < listData.length - 1 && <Divider style={{marginVertical: 12}} />}
//                         </View>
//                     ))
//                 )}
//             </Surface>

//             <View style={{height: 50}} />
//           </ScrollView>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#F5F6F8' },
//   scrollContent: { padding: 16 },
  
//   filterBar: { padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#EEE' },
//   segmented: { backgroundColor: '#F5F5F5' },

//   // Style cho vùng chọn ngày Custom
//   customDateContainer: {
//     flexDirection: 'row',
//     marginTop: 12,
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     backgroundColor: '#F9F9F9',
//     padding: 8,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#EEE'
//   },
//   dateBox: {
//     flex: 1,
//     alignItems: 'center',
//     padding: 5
//   },
//   dateLabel: { fontSize: 11, color: '#888', marginBottom: 2 },
//   dateValueRow: { flexDirection: 'row', alignItems: 'center' },
//   dateValue: { fontWeight: 'bold', fontSize: 14, marginLeft: 6, color: '#333' },
//   arrowBox: { paddingHorizontal: 10 },

//   // Big Revenue Card
//   bigRevenueCard: {
//       backgroundColor: Colors.primary,
//       borderRadius: 16,
//       padding: 20,
//       flexDirection: 'row',
//       justifyContent: 'space-between',
//       alignItems: 'center',
//       marginBottom: 16
//   },
  
//   // Grid Summary
//   grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
//   summaryCard: {
//       width: '48%',
//       backgroundColor: 'white',
//       borderRadius: 12,
//       padding: 16,
//       marginBottom: 12,
//       alignItems: 'flex-start'
//   },
//   iconBox: {
//       width: 40, height: 40, borderRadius: 12,
//       justifyContent: 'center', alignItems: 'center'
//   },

//   // Ranking Section
//   rankingHeader: { 
//       flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 
//   },
//   tabTitle: { fontSize: 16, color: '#999', fontWeight: '600' },
//   tabActive: { color: Colors.primary, borderBottomWidth: 2, borderBottomColor: Colors.primary },
  
//   rankingList: {
//       backgroundColor: 'white',
//       borderRadius: 16,
//       padding: 16
//   },
//   chartRow: {}
// });

import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Text, Surface, Divider, SegmentedButtons } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ManagerHeader } from '../../components/ManagerHeader';
import { Colors } from '../../constants/app.constant';
import { formatCurrency } from '../../utils/format';
import { reportApi } from '../../api/report.api';

const { width } = Dimensions.get('window');

// Helper: Format ngày YYYY-MM-DD
const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const ReportScreen = () => {
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('TODAY'); // TODAY | YESTERDAY | THIS_MONTH
  const [reportTab, setReportTab] = useState('PRODUCT'); // PRODUCT | CATEGORY
  
  // Data State
  const [summary, setSummary] = useState({
    net_revenue: 0,
    total_orders: 0,
    total_sales: 0,
    total_discount: 0
  });
  const [listData, setListData] = useState<any[]>([]);

  // --- LOGIC LẤY NGÀY ---
  const getDateRange = (type: string) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'YESTERDAY') {
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
    } else if (type === 'THIS_MONTH') {
        start.setDate(1); // Ngày đầu tháng
        // Ngày hiện tại là end
    }
    // TODAY: start = end = today (mặc định)

    return { 
        startDate: formatDate(start), 
        endDate: formatDate(end) 
    };
  };

  // --- LOAD DATA ---
  const loadReport = async () => {
    setLoading(true);
    try {
        const { startDate, endDate } = getDateRange(filterType);
        
        // 1. Load Summary
        const resSum = await reportApi.getSummary(startDate, endDate);
        setSummary(resSum.data);

        // 2. Load List (Tùy tab)
        let resList;
        if (reportTab === 'PRODUCT') {
            resList = await reportApi.getByProduct(startDate, endDate);
        } else {
            resList = await reportApi.getByCategory(startDate, endDate);
        }
        setListData(resList.data);

    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [filterType, reportTab]);

  // --- COMPONENTS CON (UI ĐẸP) ---

  // 1. Thẻ tổng quan nhỏ (4 ô vuông)
  const SummaryCard = ({ title, value, icon, color, isMoney = false }: any) => (
    <Surface style={styles.summaryCard} elevation={2}>
        <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
            <MaterialCommunityIcons name={icon} size={24} color={color} />
        </View>
        <Text style={{fontSize: 12, color: '#666', marginTop: 8}}>{title}</Text>
        <Text variant="titleMedium" style={{fontWeight: 'bold', color: '#333'}}>
            {isMoney ? formatCurrency(value) : value}
        </Text>
    </Surface>
  );

  // 2. Thanh biểu đồ (Custom Bar Chart Row)
  const ChartRow = ({ item, index, maxValue }: any) => {
    const isProduct = reportTab === 'PRODUCT';
    const name = isProduct ? item.product_name : item.category_name;
    const sub = isProduct ? item.category_name : `${item.total_quantity} món`;
    
    // Tính phần trăm độ dài thanh
    const percent = maxValue > 0 ? (item.total_revenue / maxValue) * 100 : 0;

    return (
        <View style={styles.chartRow}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 6}}>
                <Text style={{fontWeight: 'bold', width: 25, color: '#888'}}>#{index + 1}</Text>
                <View style={{flex: 1}}>
                    <Text style={{fontWeight: '600', fontSize: 15}}>{name}</Text>
                    <Text style={{fontSize: 12, color: '#999'}}>{sub}</Text>
                </View>
                <View style={{alignItems: 'flex-end'}}>
                    <Text style={{fontWeight: 'bold', color: Colors.primary}}>
                        {formatCurrency(item.total_revenue)}
                    </Text>
                    <Text style={{fontSize: 11, color: '#666'}}>
                        {item.total_quantity} đơn vị
                    </Text>
                </View>
            </View>
            
            {/* THANH BAR CHART MƯỢT MÀ */}
            <View style={{height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden'}}>
                <View style={{
                    height: '100%', 
                    width: `${percent}%`, 
                    backgroundColor: index < 3 ? Colors.primary : '#BCAAA4', // Top 3 màu đậm, còn lại màu nhạt
                    borderRadius: 3
                }} />
            </View>
        </View>
    );
  };

  // Tính giá trị max để làm mốc 100% cho biểu đồ
  const maxRevenue = useMemo(() => {
    return Math.max(...listData.map(d => d.total_revenue), 0);
  }, [listData]);

  return (
    <View style={styles.container}>
      <ManagerHeader title="Báo Cáo" subtitle="Hiệu quả kinh doanh" />
      
      {/* FILTER BAR: Chọn ngày */}
      <View style={styles.filterBar}>
         <SegmentedButtons
            value={filterType}
            onValueChange={setFilterType}
            buttons={[
              { value: 'TODAY', label: 'Hôm nay' },
              { value: 'YESTERDAY', label: 'Hôm qua' },
              { value: 'THIS_MONTH', label: 'Tháng này' },
            ]}
            style={styles.segmented}
            density="small"
         />
      </View>

      {loading ? (
          <View style={{flex:1, justifyContent:'center'}}><ActivityIndicator color={Colors.primary} size="large"/></View>
      ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* PHẦN 1: DOANH THU THỰC TẾ (Nổi bật nhất) */}
            <Surface style={styles.bigRevenueCard} elevation={4}>
                <View>
                    <Text style={{color: 'rgba(255,255,255,0.8)'}}>Doanh thu thực tế</Text>
                    <Text variant="headlineMedium" style={{color: 'white', fontWeight: 'bold', marginVertical: 4}}>
                        {formatCurrency(summary.net_revenue)}
                    </Text>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <MaterialCommunityIcons name="arrow-up-circle" color="#C8E6C9" size={16} />
                        <Text style={{color: '#C8E6C9', fontSize: 12, marginLeft: 4}}>Đã trừ khuyến mãi</Text>
                    </View>
                </View>
                <View style={[styles.iconBox, {backgroundColor: 'rgba(255,255,255,0.2)'}]}>
                    <MaterialCommunityIcons name="finance" size={32} color="white" />
                </View>
            </Surface>

            {/* PHẦN 2: GRID THÔNG SỐ CHI TIẾT */}
            <View style={styles.grid}>
                <SummaryCard 
                    title="Tổng đơn hàng" 
                    value={summary.total_orders} 
                    icon="receipt" 
                    color="#2196F3" 
                />
                <SummaryCard 
                    title="Tổng doanh số" 
                    value={summary.total_sales} 
                    icon="cash-plus" 
                    color="#4CAF50" 
                    isMoney 
                />
                <SummaryCard 
                    title="Tổng giảm giá" 
                    value={summary.total_discount} 
                    icon="ticket-percent" 
                    color="#FF9800" 
                    isMoney 
                />
                <SummaryCard 
                    title="Trung bình/đơn" 
                    value={summary.total_orders > 0 ? Math.round(summary.net_revenue / summary.total_orders) : 0} 
                    icon="chart-timeline-variant" 
                    color="#9C27B0" 
                    isMoney 
                />
            </View>

            <Divider style={{marginVertical: 20, height: 4, backgroundColor: '#EEE'}} />

            {/* PHẦN 3: TOP TRENDING */}
            <View style={styles.rankingHeader}>
                <Text variant="titleLarge" style={{fontWeight: 'bold', color: '#333'}}>Top Hiệu Quả</Text>
                <View style={{flexDirection: 'row'}}>
                    <TouchableOpacity onPress={() => setReportTab('PRODUCT')}>
                        <Text style={[styles.tabTitle, reportTab === 'PRODUCT' && styles.tabActive]}>Món ăn</Text>
                    </TouchableOpacity>
                    <View style={{width: 15}} />
                    <TouchableOpacity onPress={() => setReportTab('CATEGORY')}>
                        <Text style={[styles.tabTitle, reportTab === 'CATEGORY' && styles.tabActive]}>Danh mục</Text>
                    </TouchableOpacity>
                </View>
            </View>
            
            <Surface style={styles.rankingList} elevation={1}>
                {listData.length === 0 ? (
                    <Text style={{textAlign: 'center', padding: 20, color: '#999'}}>Chưa có dữ liệu</Text>
                ) : (
                    listData.map((item, index) => (
                        <View key={index}>
                             <ChartRow item={item} index={index} maxValue={maxRevenue} />
                             {index < listData.length - 1 && <Divider style={{marginVertical: 12}} />}
                        </View>
                    ))
                )}
            </Surface>

            <View style={{height: 50}} />
          </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6F8' },
  scrollContent: { padding: 16 },
  
  filterBar: { padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  segmented: { backgroundColor: '#F5F5F5' },

  // Big Revenue Card
  bigRevenueCard: {
      backgroundColor: Colors.primary, // Hoặc gradient nếu bạn thích
      borderRadius: 16,
      padding: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16
  },
  
  // Grid Summary
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  summaryCard: {
      width: '48%',
      backgroundColor: 'white',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      alignItems: 'flex-start'
  },
  iconBox: {
      width: 40, height: 40, borderRadius: 12,
      justifyContent: 'center', alignItems: 'center'
  },

  // Ranking Section
  rankingHeader: { 
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 
  },
  tabTitle: { fontSize: 16, color: '#999', fontWeight: '600' },
  tabActive: { color: Colors.primary, borderBottomWidth: 2, borderBottomColor: Colors.primary },
  
  rankingList: {
      backgroundColor: 'white',
      borderRadius: 16,
      padding: 16
  },
  chartRow: {
      // Không cần height cố định, để content tự đẩy
  }
});
import React, { useEffect, useState, useRef } from 'react';
import {
  View, StyleSheet, ScrollView, Alert, RefreshControl,
  TouchableWithoutFeedback, Keyboard, Platform, KeyboardAvoidingView,
  Dimensions, TouchableOpacity
} from 'react-native';
import { Text, Card, Button, TextInput, Modal, Portal, IconButton, Switch } from 'react-native-paper';
import { useAuthStore } from '../../store/auth.store';
import { useShiftStore, Shift } from '../../store/shift.store';
import { Colors } from '../../constants/app.constant';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { shiftApi } from '../../api/shift.api';
import { ManagerHeader } from '../../components/ManagerHeader';
import { formatCurrency } from '../../utils/format';

const { width } = Dimensions.get('window');

// --- COMPONENT CON: BỘ ĐẾM GIỜ LIVE ---
const LiveTimer = ({ startTime }: { startTime: string }) => {
  const [duration, setDuration] = useState("00:00:00");

  useEffect(() => {
    const timer = setInterval(() => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const diff = now - start;

      if (diff < 0) {
        setDuration("00:00:00");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const hStr = hours < 10 ? `0${hours}` : hours;
      const mStr = minutes < 10 ? `0${minutes}` : minutes;
      const sStr = seconds < 10 ? `0${seconds}` : seconds;

      setDuration(`${hStr}:${mStr}:${sStr}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  return (
    <View style={{ alignItems: 'center' }}>
      <Text variant="labelSmall" style={{ color: '#B07A70', fontWeight: 'bold', letterSpacing: 1, marginBottom: 5 }}>
        CA ĐANG HOẠT ĐỘNG
      </Text>
      <Text variant="displayMedium" style={{ color: '#8B5E55', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
        {duration}
      </Text>
    </View>
  );
};

// --- COMPONENT CON: STAT CARD NHỎ ---
const StatMini = ({ icon, label, value, color }: { icon: string, label: string, value: string, color: string }) => (
  <View style={styles.statMini}>
    <MaterialCommunityIcons name={icon as any} size={20} color={color} />
    <Text style={styles.statMiniLabel}>{label}</Text>
    <Text style={[styles.statMiniValue, { color }]}>{value}</Text>
  </View>
);


export const ShiftScreen = ({ navigation }: any) => {
  const user = useAuthStore(state => state.user);
  const { todayShifts, currentShift, loadTodayShifts, openShift, closeShift, isLoading } = useShiftStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'OPEN' | 'CLOSE'>('OPEN');
  const [moneyInput, setMoneyInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [summaryData, setSummaryData] = useState<any>(null);
  const [sendEmail, setSendEmail] = useState(true);

  // Lấy ngày hôm nay định dạng dd/MM
  const todayStr = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

  useEffect(() => {
    if (user) loadTodayShifts(user.id);
  }, [user]);

  const handleOpenModal = async (type: 'OPEN' | 'CLOSE') => {
    setModalType(type);
    setMoneyInput('');
    setNoteInput('');
    setSummaryData(null);
    setSendEmail(true);
    setModalVisible(true);

    if (type === 'CLOSE' && currentShift) {
      try {
        const res = await shiftApi.getShiftSummary(currentShift.shift_id);
        setSummaryData(res.data);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!moneyInput) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập số tiền");
      return;
    }

    const amount = parseFloat(moneyInput) || 0;
    let success = false;

    if (modalType === 'OPEN') {
      success = await openShift(user!.id, amount, noteInput);
    } else {
      const result = await closeShift(amount, noteInput, sendEmail);
      if (result) {
        success = true;
        const emailMsg = sendEmail
          ? "\n📧 Báo cáo đã được gửi qua email!"
          : "";
        Alert.alert(
          "✅ Đóng ca thành công",
          `Ca làm việc đã kết thúc.${emailMsg}`
        );
      }
    }

    if (success) setModalVisible(false);
  };

  const renderShiftItem = (shift: Shift) => {
    const isOpen = shift.status === 'OPEN';
    const startFmt = new Date(shift.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const endFmt = shift.end_time
      ? new Date(shift.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      : '...';

    return (
      <View style={[styles.historyCard, isOpen && styles.activeHistoryCard]} key={shift.shift_id}>
        <View style={styles.historyLeft}>
          <MaterialCommunityIcons
            name={isOpen ? "clock-time-four-outline" : "check-circle"}
            size={22}
            color={isOpen ? '#8DB580' : '#A09B94'}
          />
          <View style={{ marginLeft: 12 }}>
            <Text variant="titleSmall" style={{ fontWeight: '600', color: isOpen ? '#6B8F5E' : '#6B6560' }}>
              {isOpen ? "ĐANG MỞ" : "ĐÃ ĐÓNG"}
            </Text>
            <Text variant="bodySmall" style={{ color: '#A09B94' }}>
              Đầu ca: {formatCurrency(shift.initial_float)}
            </Text>
          </View>
        </View>

        <View style={styles.historyRight}>
          <Text variant="titleMedium" style={{ fontWeight: '600', color: '#4A4540' }}>
            {startFmt} - {endFmt}
          </Text>
          {!isOpen && (
            <Text variant="bodySmall" style={{ color: '#6D4C41', fontWeight: 'bold', alignSelf: 'flex-end' }}>
              +{formatCurrency(shift.total_cash_sales || 0)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <ManagerHeader
        title="Ca làm việc"
        subtitle={`Xin chào, ${user?.fullName ?? 'Nhân viên'}`}
        showAvatar={true}
        userInitial={user?.fullName.charAt(0)}
      />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => user && loadTodayShifts(user.id)} />}
        showsVerticalScrollIndicator={false}
      >
        {/* --- KHU VỰC TRẠNG THÁI CA (HERO SECTION) --- */}
        <View style={styles.heroCard}>
          {currentShift ? (
            // TRẠNG THÁI: ĐANG MỞ
            <View style={styles.activeShiftContainer}>
              <LiveTimer startTime={currentShift.start_time} />

              <View style={styles.activeInfoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Bắt đầu lúc</Text>
                  <Text style={styles.infoValue}>
                    {new Date(currentShift.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={styles.verticalDivider} />
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Tiền đầu ca</Text>
                  <Text style={styles.infoValue}>{formatCurrency(currentShift.initial_float)}</Text>
                </View>
              </View>

              <Button
                mode="contained"
                onPress={() => handleOpenModal('CLOSE')}
                style={styles.closeBtn}
                contentStyle={{ height: 48 }}
                icon="stop-circle-outline"
              >
                KẾT THÚC CA
              </Button>
            </View>
          ) : (
            // TRẠNG THÁI: CHƯA MỞ CA
            <View style={styles.inactiveShiftContainer}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="store-clock-outline" size={44} color={Colors.white} />
              </View>
              <Text variant="titleLarge" style={{ fontWeight: 'bold', color: '#5e5856ff', marginTop: 15 }}>
                Chưa có ca làm việc
              </Text>
              <Text style={{ color: '#A09B94', textAlign: 'center', marginVertical: 10, paddingHorizontal: 20 }}>
                Hãy mở ca mới để bắt đầu nhận đơn hàng và quản lý doanh thu.
              </Text>
              <Button
                mode="contained"
                onPress={() => handleOpenModal('OPEN')}
                style={styles.openBtn}
                contentStyle={{ height: 50 }}
                labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
                icon="play-circle-outline"
              >
                BẮT ĐẦU CA MỚI
              </Button>
            </View>
          )}
        </View>

        {/* --- DANH SÁCH LỊCH SỬ --- */}
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={{ fontWeight: '700', color: '#4A4540', letterSpacing: -0.3 }}>
            LỊCH SỬ HÔM NAY
          </Text>
          <View style={styles.dateBadge}>
            <MaterialCommunityIcons name="calendar-today" size={13} color={Colors.white} />
            <Text style={{ color: Colors.white, marginLeft: 5, fontWeight: '600', fontSize: 11 }}>
              {todayStr}
            </Text>
          </View>
        </View>

        {todayShifts.map(renderShiftItem)}

        {todayShifts.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="history" size={36} color="#D5CFC9" />
            <Text style={{ color: '#A09B94', marginTop: 10 }}>Chưa có dữ liệu ca hôm nay</Text>
          </View>
        )}
      </ScrollView>

      {/* --- MODAL NHẬP LIỆU --- */}
      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modalWrapper}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalContent}>
                <Text variant="headlineSmall" style={styles.modalTitle}>
                  {modalType === 'OPEN' ? 'Mở ca mới' : 'Đóng ca làm việc'}
                </Text>

                {/* SUMMARY KHI ĐÓNG CA */}
                {modalType === 'CLOSE' && summaryData && (
                  <View style={styles.summaryBox}>
                    <View style={styles.statsRow}>
                      <StatMini icon="receipt" label="Đơn hàng" value={`${summaryData.total_orders || 0}`} color="#8D6E63" />
                      <StatMini icon="food" label="Món bán" value={`${summaryData.total_items_sold || 0}`} color="#6B8F5E" />
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.rowBetween}>
                      <Text style={{ color: '#6B6560' }}>Doanh thu tiền mặt:</Text>
                      <Text style={{ fontWeight: 'bold', color: '#6B8F5E' }}>+{formatCurrency(summaryData.total_cash_sales || 0)}</Text>
                    </View>
                    <View style={styles.rowBetween}>
                      <Text style={{ color: '#6B6560' }}>Doanh thu CK:</Text>
                      <Text style={{ fontWeight: 'bold', color: '#5D8FAD' }}>+{formatCurrency(summaryData.total_transfer_sales || 0)}</Text>
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.rowBetween}>
                      <Text style={{ fontWeight: 'bold', color: '#4A4540' }}>Tổng doanh thu:</Text>
                      <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#5D4037' }}>
                        {formatCurrency(summaryData.total_all_sales || 0)}
                      </Text>
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.rowBetween}>
                      <Text style={{ color: '#6B6560' }}>Hệ thống kỳ vọng (két):</Text>
                      <Text style={{ fontWeight: 'bold', color: '#4A4540' }}>{formatCurrency(summaryData.expected_cash || 0)}</Text>
                    </View>
                  </View>
                )}

                <TextInput
                  label={modalType === 'OPEN' ? 'Tiền đầu ca' : 'Tiền thực tế trong két'}
                  value={moneyInput}
                  onChangeText={setMoneyInput}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                  outlineColor="#DDD9D3"
                  activeOutlineColor="#8D6E63"
                  textColor="#4A4540"
                  right={<TextInput.Affix text="VNĐ" />}
                  theme={{ colors: { onSurfaceVariant: '#A09B94' } }}
                />

                <TextInput
                  label="Ghi chú (Tùy chọn)"
                  value={noteInput}
                  onChangeText={setNoteInput}
                  mode="outlined"
                  style={styles.input}
                  outlineColor="#DDD9D3"
                  activeOutlineColor="#8D6E63"
                  textColor="#4A4540"
                  multiline
                  theme={{ colors: { onSurfaceVariant: '#A09B94' } }}
                />

                {/* Toggle gửi email (chỉ khi đóng ca) */}
                {modalType === 'CLOSE' && (
                  <View style={styles.emailToggle}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '600', color: '#4A4540' }}>📧 Gửi báo cáo qua Email</Text>
                      <Text style={{ fontSize: 12, color: '#A09B94', marginTop: 2 }}>
                        Tự động gửi bảng kết ca về email quản lý
                      </Text>
                    </View>
                    <Switch
                      value={sendEmail}
                      onValueChange={setSendEmail}
                      color={'#8D6E63'}
                    />
                  </View>
                )}

                <View style={styles.modalActions}>
                  <Button mode="text" onPress={() => setModalVisible(false)} textColor="#A09B94" style={{ flex: 1, marginRight: 8 }}>Hủy</Button>
                  <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={isLoading}
                    style={styles.modalSubmitBtn}
                  >
                    Xác nhận
                  </Button>
                </View>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F3F1' },

  heroCard: {
    marginTop: 10,
    borderRadius: 20,
    backgroundColor: '#EFECE8',
    marginBottom: 20,
    overflow: 'hidden',
    // Shadow cực nhẹ
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  inactiveShiftContainer: { padding: 28, alignItems: 'center' },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#8D6E63',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#8D6E63', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8,
    elevation: 2,
  },
  openBtn: { borderRadius: 28, width: '100%', marginTop: 20, backgroundColor: '#5D4037' },

  // Active Shift Styling
  activeShiftContainer: {
    padding: 20, backgroundColor: '#F0E6E4', borderWidth: 0.7, borderColor: '#D4A9A2', borderRadius: 20
  },
  activeInfoRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20 },
  verticalDivider: { width: 1, height: '100%', backgroundColor: '#D4C5C2' },
  infoItem: { alignItems: 'center' },
  infoLabel: { color: '#A09B94', fontSize: 12, marginBottom: 4 },
  infoValue: { fontWeight: '700', fontSize: 16, color: '#4A4540' },
  closeBtn: { backgroundColor: '#C47B6F', borderRadius: 12 },

  // History List
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 },
  dateBadge: { flexDirection: 'row', backgroundColor: '#8D6E63', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignItems: 'center' },
  historyCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderRadius: 16, backgroundColor: '#EFECE8', marginBottom: 10,
    shadowColor: '#8D6E63', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 6,
    elevation: 1,
  },
  activeHistoryCard: { borderWidth: 0.7, borderColor: '#B5CCB0', backgroundColor: '#ECF0E8' },
  historyLeft: { flexDirection: 'row', alignItems: 'center' },
  historyRight: { alignItems: 'flex-end' },
  emptyState: { alignItems: 'center', padding: 20 },

  // Modal
  modalWrapper: { padding: 20 },
  modalScroll: {},
  modalContent: { backgroundColor: '#FAF9F7', borderRadius: 20, padding: 24, elevation: 3, shadowColor: '#8D6E63', shadowOpacity: 0.08, shadowRadius: 12 },
  modalTitle: { fontWeight: '700', color: '#5D4037', textAlign: 'center', marginBottom: 20 },

  // Summary Box (đóng ca)
  summaryBox: { backgroundColor: '#EFECE8', padding: 15, borderRadius: 16, marginBottom: 15 },
  summaryDivider: { height: 0.7, backgroundColor: '#DDD9D3', marginVertical: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statMini: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12 },
  statMiniLabel: { fontSize: 11, color: '#A09B94', marginTop: 4 },
  statMiniValue: { fontWeight: 'bold', fontSize: 18 },

  // Email toggle
  emailToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF1EB',
    padding: 12,
    borderRadius: 14,
    borderWidth: 0.7,
    borderColor: '#D5DDD0',
    marginBottom: 15
  },

  input: { marginBottom: 15, backgroundColor: '#FAF9F7' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  modalSubmitBtn: { backgroundColor: '#8D6E63', borderRadius: 14, flex: 1 },
});
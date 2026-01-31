import React, { useEffect, useState, useRef } from 'react';
import { 
  View, StyleSheet, ScrollView, Alert, RefreshControl, 
  TouchableWithoutFeedback, Keyboard, Platform, KeyboardAvoidingView, 
  Dimensions
} from 'react-native';
import { Text, Card, Button, TextInput, Modal, Portal, IconButton, Surface } from 'react-native-paper';
import { useAuthStore } from '../../store/auth.store';
import { useShiftStore, Shift } from '../../store/shift.store';
import { Colors } from '../../constants/app.constant';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { shiftApi } from '../../api/shift.api';
import { ManagerHeader } from '../../components/ManagerHeader'; // Import mới

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
      <Text variant="labelSmall" style={{ color: Colors.red, fontWeight: 'bold', letterSpacing: 1, marginBottom: 5 }}>
        CA ĐANG HOẠT ĐỘNG
      </Text>
      <Text variant="displayMedium" style={{ color: Colors.red, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
        {duration}
      </Text>
    </View>
  );
};

export const ShiftScreen = ({ navigation }: any) => {
  const user = useAuthStore(state => state.user);
  const { todayShifts, currentShift, loadTodayShifts, openShift, closeShift, isLoading } = useShiftStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'OPEN' | 'CLOSE'>('OPEN');
  const [moneyInput, setMoneyInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [summaryData, setSummaryData] = useState<any>(null);

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
    Keyboard.dismiss(); // Tắt phím trước khi xử lý
    if (!moneyInput) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập số tiền");
      return;
    }

    const amount = parseFloat(moneyInput) || 0;
    let success = false;

    if (modalType === 'OPEN') {
      success = await openShift(user!.id, amount, noteInput);
    } else {
      const result = await closeShift(amount, noteInput);
      if (result) {
        success = true;
        Alert.alert("Thành công", "Đã đóng ca và in phiếu kết ca!");
      }
    }

    if (success) setModalVisible(false);
  };

  const renderShiftItem = (shift: Shift) => {
    const isOpen = shift.status === 'OPEN';
    const startFmt = new Date(shift.start_time).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
    // Nếu chưa đóng thì hiện '...', đóng rồi thì hiện giờ đóng
    const endFmt = shift.end_time 
      ? new Date(shift.end_time).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) 
      : '...';

    return (
      <Surface style={[styles.historyCard, isOpen && styles.activeHistoryCard]} key={shift.shift_id} elevation={2}>
        <View style={styles.historyLeft}>
          <MaterialCommunityIcons 
            name={isOpen ? "clock-time-four-outline" : "check-circle"} 
            size={24} 
            color={isOpen ? Colors.green : Colors.secondary} 
          />
          <View style={{ marginLeft: 12 }}>
            <Text variant="titleSmall" style={{ fontWeight: 'bold', color: isOpen ? Colors.green : '#555' }}>
              {isOpen ? "ĐANG MỞ" : "ĐÃ ĐÓNG"}
            </Text>
            <Text variant="bodySmall" style={{ color: '#888' }}>
              Bắt đầu: {shift.initial_float.toLocaleString('vi-VN')} đ
            </Text>
          </View>
        </View>

        <View style={styles.historyRight}>
          <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
            {startFmt} - {endFmt}
          </Text>
          {!isOpen && (
            <Text variant="bodySmall" style={{ color: Colors.primary, fontWeight: 'bold', alignSelf: 'flex-end' }}>
              +{shift.total_cash_sales?.toLocaleString('vi-VN')} đ
            </Text>
          )}
        </View>
      </Surface>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header cong mềm mại */}
      <ManagerHeader 
      title="Quản Lý Ca" 
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
        <Surface style={styles.heroCard} elevation={4}>
          {currentShift ? (
            // TRẠNG THÁI: ĐANG MỞ
            <View style={styles.activeShiftContainer}>
              <LiveTimer startTime={currentShift.start_time} />
              
              <View style={styles.activeInfoRow}>
                <View style={styles.infoItem}>
                   <Text style={styles.infoLabel}>Bắt đầu lúc</Text>
                   <Text style={styles.infoValue}>
                     {new Date(currentShift.start_time).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                   </Text>
                </View>
                <View style={styles.verticalDivider} />
                <View style={styles.infoItem}>
                   <Text style={styles.infoLabel}>Tiền đầu ca</Text>
                   <Text style={styles.infoValue}>{currentShift.initial_float.toLocaleString()} đ</Text>
                </View>
              </View>

              <Button 
                mode="contained" 
                onPress={() => handleOpenModal('CLOSE')} 
                style={styles.closeBtn}
                contentStyle={{height: 48}}
                icon="stop-circle-outline"
              >
                KẾT THÚC CA
              </Button>
            </View>
          ) : (
            // TRẠNG THÁI: CHƯA MỞ CA
            <View style={styles.inactiveShiftContainer}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="store-clock-outline" size={50} color={Colors.white} />
              </View>
              <Text variant="titleLarge" style={{ fontWeight: 'bold', color: Colors.primary, marginTop: 15 }}>
                Chưa có ca làm việc
              </Text>
              <Text style={{ color: '#888', textAlign: 'center', marginVertical: 10, paddingHorizontal: 20 }}>
                Hãy mở ca mới để bắt đầu nhận đơn hàng và quản lý doanh thu.
              </Text>
              <Button 
                mode="contained" 
                onPress={() => handleOpenModal('OPEN')} 
                style={styles.openBtn}
                contentStyle={{height: 50}}
                labelStyle={{fontSize: 16, fontWeight: 'bold'}}
                icon="play-circle-outline"
              >
                BẮT ĐẦU CA MỚI
              </Button>
            </View>
          )}
        </Surface>

        {/* --- DANH SÁCH LỊCH SỬ --- */}
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={{ fontWeight: 'bold', color: '#444' }}>
            LỊCH SỬ HÔM NAY
          </Text>
          <View style={styles.dateBadge}>
            <MaterialCommunityIcons name="calendar-today" size={14} color={Colors.white} />
            <Text style={{ color: Colors.white, marginLeft: 5, fontWeight: 'bold', fontSize: 12 }}>
              {todayStr}
            </Text>
          </View>
        </View>

        {todayShifts.map(renderShiftItem)}
        
        {todayShifts.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="history" size={40} color="#DDD" />
            <Text style={{ color: '#BBB', marginTop: 10 }}>Chưa có dữ liệu ca hôm nay</Text>
          </View>
        )}
      </ScrollView>

      {/* --- MODAL NHẬP LIỆU (Đã xử lý bàn phím) --- */}
      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modalWrapper}>
          {/* TouchableWithoutFeedback để đóng phím khi chạm ra ngoài input */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <MaterialCommunityIcons name={modalType === 'OPEN' ? "play-box-outline" : "stop-circle-outline"} size={28} color={modalType === 'OPEN' ? Colors.green : Colors.red} />
                <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginLeft: 10, color: modalType === 'OPEN' ? Colors.green : Colors.red }}>
                  {modalType === 'OPEN' ? "MỞ CA MỚI" : "ĐÓNG CA"}
                </Text>
              </View>

              {modalType === 'CLOSE' && summaryData && (
                <View style={styles.summaryBox}>
                  <View style={styles.rowBetween}>
                    <Text style={{color: '#666'}}>Hệ thống tính:</Text>
                    <Text style={{fontWeight:'bold', fontSize: 16}}>{summaryData.expected_cash?.toLocaleString('vi-VN')} đ</Text>
                  </View>
                  <MaterialCommunityIcons style={{marginVertical: 8}}/>
                  <View style={styles.rowBetween}>
                    <Text style={{color: '#666'}}>Doanh thu TM:</Text>
                    <Text style={{color: Colors.green, fontWeight:'bold'}}>+{summaryData.total_cash_sales?.toLocaleString('vi-VN')} đ</Text>
                  </View>
                </View>
              )}

              <TextInput
                label={modalType === 'OPEN' ? "Tiền đầu ca" : "Tiền thực tế trong két"}
                value={moneyInput}
                onChangeText={setMoneyInput}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
                outlineColor="#DDD"
                activeOutlineColor={Colors.primary}
                right={<TextInput.Affix text="VNĐ" />}
              />

              <TextInput
                label="Ghi chú (Tùy chọn)"
                value={noteInput}
                onChangeText={setNoteInput}
                mode="outlined"
                style={styles.input}
                outlineColor="#DDD"
                activeOutlineColor={Colors.primary}
                multiline
              />

              <View style={styles.modalActions}>
                <Button mode="text" onPress={() => setModalVisible(false)} textColor="#888">Hủy bỏ</Button>
                <Button 
                  mode="contained" 
                  onPress={handleSubmit} 
                  loading={isLoading} 
                  style={{ backgroundColor: modalType === 'OPEN' ? Colors.green : Colors.red, flex: 1, marginLeft: 10 }}
                >
                  XÁC NHẬN
                </Button>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },

  heroCard: {
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: Colors.white,
    marginBottom: 20,
    overflow: 'hidden'
  },
  inactiveShiftContainer: { padding: 30, alignItems: 'center' },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    elevation: 5, shadowColor: Colors.primary, shadowOpacity: 0.3, shadowOffset: {width:0, height:4}
  },
  openBtn: { borderRadius: 30, width: '100%', marginTop: 20, backgroundColor: Colors.primary },
  
  // Active Shift Styling
  activeShiftContainer: { padding: 20, backgroundColor: '#FFF5F5', borderWidth: 1, borderColor: '#FFEBEE', borderRadius: 20 },
  activeInfoRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20 },
  verticalDivider: { width: 1, height: '100%', backgroundColor: '#FFCDD2' },
  infoItem: { alignItems: 'center' },
  infoLabel: { color: '#888', fontSize: 12, marginBottom: 4 },
  infoValue: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  closeBtn: { backgroundColor: Colors.red, borderRadius: 10 },

  // History List
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 },
  dateBadge: { flexDirection: 'row', backgroundColor: Colors.secondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignItems: 'center' },
  historyCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderRadius: 12, backgroundColor: Colors.white, marginBottom: 12
  },
  activeHistoryCard: { borderWidth: 1, borderColor: Colors.green, backgroundColor: '#F1F8E9' },
  historyLeft: { flexDirection: 'row', alignItems: 'center' },
  historyRight: { alignItems: 'flex-end' },
  emptyState: { alignItems: 'center', padding: 20 },

  // Modal
  modalWrapper: { padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 15, padding: 24, elevation: 5 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  summaryBox: { backgroundColor: '#F5F5F5', padding: 15, borderRadius: 10, marginBottom: 15 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  input: { marginBottom: 15, backgroundColor: '#FFF' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }
});
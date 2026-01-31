import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Text, Surface, Button, Divider, TextInput, SegmentedButtons, IconButton } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ManagerHeader } from '../../components/ManagerHeader';
import { Colors } from '../../constants/app.constant';
import { formatCurrency } from '../../utils/format';
import { useCartStore } from '../../store/cart.store';
import { useAuthStore } from '../../store/auth.store';
import { orderApi } from '../../api/order.api';
import { getSmartSuggestions } from '../../utils/calculator'; // Nhớ tạo file này hoặc copy hàm vào đây

const { width } = Dimensions.get('window');

export const PaymentScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  
  const { tableId, tableName, orderId, totalAmount: originalTotal } = route.params as any;
  
  const user = useAuthStore(state => state.user);
  const { clearCart } = useCartStore();
  
  // --- STATE QUẢN LÝ ---
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  
  // Discount State
  const [discountType, setDiscountType] = useState<'CASH' | 'PERCENT'>('CASH');
  const [discountInput, setDiscountInput] = useState<string>(''); // Lưu chuỗi để xử lý input
  
  // Payment Input State
  const [customerPayInput, setCustomerPayInput] = useState<string>('');

  const [isProcessing, setIsProcessing] = useState(false);

  // --- CALCULATIONS (REAL-TIME) ---
  
  // 1. Tính giá trị giảm giá
  const discountValue = useMemo(() => {
    const val = parseFloat(discountInput) || 0;
    if (discountType === 'PERCENT') {
        // Giới hạn max 100%
        const percent = val > 100 ? 100 : val;
        return Math.round((originalTotal * percent) / 100);
    }
    // Giới hạn không giảm quá tổng tiền
    return val > originalTotal ? originalTotal : val;
  }, [discountInput, discountType, originalTotal]);

  // 2. Tính tổng cuối cùng
  const finalAmount = Math.max(0, originalTotal - discountValue);

  // 3. Tính tiền khách đưa (Mặc định nếu khách không nhập thì coi như đưa đủ)
  const customerPay = useMemo(() => {
    return parseFloat(customerPayInput) || 0;
  }, [customerPayInput]);

  // 4. Tính tiền thừa
  const changeAmount = customerPay - finalAmount;

  // --- ACTIONS ---

  const handlePayment = async () => {
    if (!orderId || !user) return;
    
    // Validate tiền mặt
    if (paymentMethod === 'CASH' && customerPay < finalAmount) {
        Alert.alert("Chưa đủ tiền", "Số tiền khách đưa nhỏ hơn tổng tiền phải thanh toán.");
        return;
    }

    Alert.alert(
        "Xác nhận thanh toán",
        `Hoàn tất đơn hàng bàn ${tableName}?`,
        [
            { text: "Hủy", style: "cancel" },
            {
                text: "Xác nhận",
                onPress: async () => {
                    setIsProcessing(true);
                    try {
                        await orderApi.completeOrder(
                            orderId, 
                            paymentMethod, 
                            user.id,
                            discountValue,
                            finalAmount,
                            customerPay > 0 ? customerPay : finalAmount
                        );
                        
                        Alert.alert("Thành công", `Thanh toán xong!\nTiền thừa: ${formatCurrency(changeAmount > 0 ? changeAmount : 0)}`, [
                            { 
                                text: "Về Sơ đồ bàn", 
                                onPress: () => {
                                    clearCart();
                                    navigation.navigate('Main', { screen: 'Tables' });
                                } 
                            }
                        ]);
                    } catch (error) {
                        console.error(error);
                        Alert.alert("Lỗi", "Thanh toán thất bại.");
                    } finally {
                        setIsProcessing(false);
                    }
                }
            }
        ]
    );
  };

  // --- RENDER HELPERS ---

  const renderQuickDiscountButtons = () => {
    const cashPresets = [5000, 10000, 20000, 50000];
    const percentPresets = [5, 10, 15, 20];
    const list = discountType === 'CASH' ? cashPresets : percentPresets;

    return (
        <View style={styles.chipGrid}>
            {list.map((val) => (
                <TouchableOpacity 
                    key={val} 
                    style={styles.chipBtn}
                    onPress={() => setDiscountInput(val.toString())}
                >
                    <Text style={{fontWeight: '600', color: Colors.primary}}>
                        {discountType === 'CASH' ? formatCurrency(val) : `${val}%`}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
  };

  const renderQuickPayButtons = () => {
    const suggestions = getSmartSuggestions(finalAmount);
    return (
        <View style={styles.chipGrid}>
            {suggestions.map((val) => (
                <TouchableOpacity 
                    key={val} 
                    style={[styles.chipBtn, {backgroundColor: '#E8F5E9', borderColor: Colors.green}]}
                    onPress={() => setCustomerPayInput(val.toString())}
                >
                    <Text style={{fontWeight: '600', color: Colors.green}}>
                        {formatCurrency(val)}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
  };

  return (
    <View style={styles.container}>
      <ManagerHeader title="Thanh Toán" subtitle={`Bàn: ${tableName}`} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1}}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* KHỐI 1: TỔNG QUAN HÓA ĐƠN */}
        <Surface style={styles.sectionCard} elevation={2}>
            <View style={styles.row}>
                <Text style={styles.label}>Tổng tiền hàng:</Text>
                <Text style={styles.value}>{formatCurrency(originalTotal)}</Text>
            </View>
            <View style={styles.row}>
                <Text style={[styles.label, {color: Colors.red}]}>Giảm giá:</Text>
                <Text style={[styles.value, {color: Colors.red}]}>- {formatCurrency(discountValue)}</Text>
            </View>
            <Divider style={{ marginVertical: 12 }} />
            <View style={styles.row}>
                <Text variant="headlineSmall" style={{fontWeight: 'bold', color: Colors.primary}}>Khách phải trả:</Text>
                <Text variant="headlineSmall" style={{fontWeight: 'bold', color: Colors.primary}}>
                    {formatCurrency(finalAmount)}
                </Text>
            </View>
        </Surface>

        {/* KHỐI 2: KHUYẾN MÃI (DISCOUNT) */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Giảm giá / Chiết khấu</Text>
        <Surface style={styles.sectionCard} elevation={1}>
            <SegmentedButtons
                value={discountType}
                onValueChange={val => {
                    setDiscountType(val as any);
                    setDiscountInput(''); // Reset khi đổi loại
                }}
                buttons={[
                    { value: 'CASH', label: 'Tiền mặt ($)', icon: 'cash' },
                    { value: 'PERCENT', label: 'Phần trăm (%)', icon: 'percent' },
                ]}
                style={{marginBottom: 15}}
                density="small"
            />
            
            {renderQuickDiscountButtons()}

            <TextInput 
                mode="outlined"
                label={discountType === 'CASH' ? "Nhập số tiền giảm" : "Nhập % giảm"}
                value={discountInput ? formatNumberString(discountInput) : ''} // Format hiển thị cho đẹp
                onChangeText={(text) => setDiscountInput(text.replace(/[^0-9]/g, ''))} // Chỉ nhận số
                keyboardType="numeric"
                right={<TextInput.Affix text={discountType === 'CASH' ? "đ" : "%"} />}
                style={{backgroundColor: 'white', marginTop: 10}}
                activeOutlineColor={Colors.primary}
            />
        </Surface>

        {/* KHỐI 3: PHƯƠNG THỨC THANH TOÁN */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Thanh toán bằng</Text>
        <Surface style={styles.sectionCard} elevation={1}>
            <View style={{flexDirection: 'row'}}>
                <TouchableOpacity 
                    style={[styles.paymentTab, paymentMethod === 'CASH' && styles.paymentTabActive]}
                    onPress={() => setPaymentMethod('CASH')}
                >
                    <MaterialCommunityIcons name="cash-multiple" size={24} color={paymentMethod === 'CASH' ? 'white' : '#666'} />
                    <Text style={{marginLeft: 8, color: paymentMethod === 'CASH' ? 'white' : '#666', fontWeight: 'bold'}}>Tiền mặt</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.paymentTab, paymentMethod === 'TRANSFER' && styles.paymentTabActive]}
                    onPress={() => setPaymentMethod('TRANSFER')}
                >
                    <MaterialCommunityIcons name="qrcode-scan" size={24} color={paymentMethod === 'TRANSFER' ? 'white' : '#666'} />
                    <Text style={{marginLeft: 8, color: paymentMethod === 'TRANSFER' ? 'white' : '#666', fontWeight: 'bold'}}>Chuyển khoản</Text>
                </TouchableOpacity>
            </View>

            {/* Nếu chọn TIỀN MẶT -> Hiện ô nhập tiền khách đưa */}
            {paymentMethod === 'CASH' && (
                <View style={{marginTop: 20}}>
                    <Text style={{marginBottom: 10, fontWeight: '600'}}>Gợi ý tiền khách đưa:</Text>
                    {renderQuickPayButtons()}

                    <TextInput 
                        mode="outlined"
                        label="Khách đưa"
                        value={customerPayInput ? formatNumberString(customerPayInput) : ''}
                        onChangeText={(text) => setCustomerPayInput(text.replace(/[^0-9]/g, ''))}
                        keyboardType="numeric"
                        right={<TextInput.Affix text="đ" />}
                        style={{backgroundColor: '#F9F9F9', fontSize: 18, fontWeight: 'bold'}}
                        activeOutlineColor={Colors.green}
                        textColor={Colors.green}
                    />
                    
                    {/* Hiển thị tiền thừa */}
                    <View style={[styles.row, {marginTop: 15, padding: 10, backgroundColor: '#E8F5E9', borderRadius: 8}]}>
                        <Text style={{fontWeight: 'bold', fontSize: 16}}>Tiền thừa trả khách:</Text>
                        <Text style={{fontWeight: 'bold', fontSize: 20, color: changeAmount < 0 ? Colors.red : Colors.green}}>
                            {changeAmount < 0 ? "Thiếu tiền" : formatCurrency(changeAmount)}
                        </Text>
                    </View>
                </View>
            )}

            {/* Nếu chọn CHUYỂN KHOẢN -> Hiện QR */}
            {paymentMethod === 'TRANSFER' && (
                <View style={{alignItems: 'center', marginTop: 20}}>
                     <MaterialCommunityIcons name="qrcode" size={150} color="#333" />
                     <Text style={{marginTop: 10, color: '#666'}}>Quét mã VietQR để thanh toán</Text>
                     <Text style={{fontWeight: 'bold', fontSize: 18, color: Colors.primary, marginTop: 5}}>
                        {formatCurrency(finalAmount)}
                     </Text>
                </View>
            )}

        </Surface>

        <View style={{height: 100}} />
      </ScrollView>
      </KeyboardAvoidingView>

      {/* FOOTER */}
      <Surface style={styles.footer} elevation={5}>
          <Button 
            mode="contained" 
            style={styles.payBtn} 
            contentStyle={{height: 56}}
            icon="check-circle-outline"
            onPress={handlePayment}
            loading={isProcessing}
            disabled={paymentMethod === 'CASH' && changeAmount < 0} // Disable nếu khách đưa thiếu
            labelStyle={{fontSize: 16, fontWeight: 'bold'}}
          >
              XÁC NHẬN - {formatCurrency(finalAmount)}
          </Button>
      </Surface>
    </View>
  );
};

// Helper để format số hiển thị trong input (10000 -> 10.000)
const formatNumberString = (numStr: string) => {
    if (!numStr) return '';
    return parseInt(numStr).toLocaleString('vi-VN');
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6F8' },
  content: { padding: 16 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 8, marginTop: 16, color: '#555', marginLeft: 4 },
  
  sectionCard: {
      padding: 16,
      borderRadius: 12,
      backgroundColor: 'white',
      marginBottom: 8
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  label: { fontSize: 15, color: '#666' },
  value: { fontSize: 15, fontWeight: '600' },

  // Chip / Grid Styles
  chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 10
  },
  chipBtn: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: Colors.primary,
      backgroundColor: '#F0F8FF',
      minWidth: 60,
      alignItems: 'center'
  },

  // Payment Method Tabs
  paymentTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#DDD',
      marginHorizontal: 4,
      backgroundColor: '#FFF'
  },
  paymentTabActive: {
      backgroundColor: Colors.green,
      borderColor: Colors.green
  },

  footer: {
      padding: 16,
      backgroundColor: 'white',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
  },
  payBtn: {
      backgroundColor: Colors.green,
      borderRadius: 12
  }
});
import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Text, Surface, Button, Divider, TextInput, SegmentedButtons, IconButton } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ManagerHeader } from '../../components/ManagerHeader';
import { Colors } from '../../constants/app.constant';
import { formatCurrency, formatDateDMY, formatTimeHM } from '../../utils/format';
import { useCartStore, CartItem } from '../../store/cart.store';
import { useAuthStore } from '../../store/auth.store';
import { usePromoStore, Promotion } from '../../store/promo.store';
import type { ApplyTo } from '../../api/promo.api';
import { orderApi } from '../../api/order.api';
import { getSmartSuggestions } from '../../utils/calculator';

const { width } = Dimensions.get('window');

export const PaymentScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();

  const { tableId, tableName, orderId, totalAmount: originalTotal } = route.params as any;

  const user = useAuthStore(state => state.user);
  const { items: cartItems, clearCart } = useCartStore();
  const { promotions, fetchPromotions } = usePromoStore();

  // --- STATE QUẢN LÝ ---
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH');

  // Discount State
  const [discountType, setDiscountType] = useState<'CASH' | 'PERCENT'>('CASH');
  const [discountInput, setDiscountInput] = useState<string>(''); // Lưu chuỗi để xử lý input
  const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null);

  // Payment Input State
  const [customerPayInput, setCustomerPayInput] = useState<string>('');

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const parseTimeToMinutes = (time: string | null | undefined) => {
    if (!time) return null;
    let t = time.toString();
    if (t.includes('T')) {
      const parts = t.split('T');
      if (parts[1]) {
        t = parts[1].split(/[Z ]/)[0];
      }
    }
    const segments = t.split(':');
    const h = parseInt(segments[0] || '0', 10) || 0;
    const m = parseInt(segments[1] || '0', 10) || 0;
    return h * 60 + m;
  };

  const isPromoApplicable = (promo: Promotion, now: Date) => {
    if (!promo.is_active) return false;

    const todayStr = now.toISOString().slice(0, 10);
    if (promo.startDate && todayStr < promo.startDate) return false;
    if (promo.endDate && todayStr > promo.endDate) return false;

    const dow = now.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    if (promo.daysOfWeek && promo.daysOfWeek.length > 0 && !promo.daysOfWeek.includes(dow)) {
      return false;
    }

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = parseTimeToMinutes(promo.timeStart) ?? 0;
    const endMinutes = parseTimeToMinutes(promo.timeEnd) ?? (23 * 60 + 59);

    if (nowMinutes < startMinutes || nowMinutes > endMinutes) {
      return false;
    }

    return true;
  };

  // Lọc promos đang trong thời gian hiệu lực
  const applicablePromos = useMemo(() => {
    const now = new Date();
    return promotions.filter((p: Promotion) => isPromoApplicable(p, now));
  }, [promotions]);

  // --- FILTER PROMOS THEO SCOPE ---

  // Promos cho MÓN/NHÓM (PRODUCT/CATEGORY)
  const itemPromos = useMemo(() =>
    applicablePromos.filter(p => p.applyTo === 'PRODUCT' || p.applyTo === 'CATEGORY'),
    [applicablePromos]
  );

  // Promos cho BILL
  const billPromos = useMemo(() =>
    applicablePromos.filter(p => p.applyTo === 'BILL' || !p.applyTo),
    [applicablePromos]
  );

  // --- TÍNH GIẢM GIÁ MÓN (tầng 1) ---
  const itemDiscountTotal = useMemo(() => {
    let total = 0;

    for (const promo of itemPromos) {
      for (const cartItem of cartItems) {
        const productId = Number(cartItem.product.product_id);
        const categoryId = Number(cartItem.product.category_id);

        // Kiểm tra item có nằm trong phạm vi promo không
        let eligible = false;
        if (promo.applyTo === 'PRODUCT' && promo.productIds.includes(productId)) {
          eligible = true;
        }
        if (promo.applyTo === 'CATEGORY' && promo.categoryIds.includes(categoryId)) {
          eligible = true;
        }

        if (eligible) {
          if (promo.discountType === 'percent') {
            total += Math.round((cartItem.totalPrice * promo.discountValue) / 100);
          } else {
            // Fixed: giảm cố định cho mỗi item (theo số lượng)
            total += Math.min(promo.discountValue * cartItem.quantity, cartItem.totalPrice);
          }
        }
      }
    }

    // Không giảm quá tổng tiền
    return Math.min(total, originalTotal);
  }, [itemPromos, cartItems, originalTotal]);

  // Số tiền sau khi giảm món
  const afterItemDiscount = originalTotal - itemDiscountTotal;

  // --- TÍNH GIẢM GIÁ BILL (tầng 2) ---
  // discountValue từ input thủ công hoặc chọn promo BILL
  const billDiscountValue = useMemo(() => {
    const val = parseFloat(discountInput) || 0;
    if (discountType === 'PERCENT') {
      const percent = val > 100 ? 100 : val;
      return Math.round((afterItemDiscount * percent) / 100);
    }
    return val > afterItemDiscount ? afterItemDiscount : val;
  }, [discountInput, discountType, afterItemDiscount]);

  // Tổng giảm giá = giảm món + giảm bill
  const totalDiscount = itemDiscountTotal + billDiscountValue;

  // 2. Tính tổng cuối cùng
  const finalAmount = Math.max(0, originalTotal - totalDiscount);

  // Tương thích ngược: discountValue cho completeOrder
  const discountValue = totalDiscount;

  // 3. Tiền khách đưa
  const customerPay = useMemo(() => {
    return parseFloat(customerPayInput) || 0;
  }, [customerPayInput]);

  // 4. Tiền thừa
  const changeAmount = customerPay - finalAmount;

  const handleSelectPromo = (promo: Promotion) => {
    if (promo.applyTo === 'BILL' || !promo.applyTo) {
      // Promo BILL → điền vào ô giảm giá thủ công
      setSelectedPromoId(promo.id);
      if (promo.discountType === 'percent') {
        setDiscountType('PERCENT');
        setDiscountInput(promo.discountValue.toString());
      } else {
        setDiscountType('CASH');
        setDiscountInput(promo.discountValue.toString());
      }
    }
    // Promo PRODUCT/CATEGORY được tự động áp dụng qua itemPromos
  };

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
                customerPay > 0 ? customerPay : finalAmount,
                originalTotal  // [FIX] Truyền tổng tiền gốc để backend lưu đúng
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
            <Text style={{ fontWeight: '600', color: Colors.primary }}>
              {discountType === 'CASH' ? formatCurrency(val) : `${val}%`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderPromoChips = () => {
    // Hiển thị tất cả promos khả dụng, phân loại rõ
    if (applicablePromos.length === 0) return null;

    return (
      <View style={{ marginBottom: 12 }}>
        {/* Item promos - tự động áp dụng */}
        {itemPromos.length > 0 && (
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontWeight: '600', marginBottom: 6, color: '#E65100' }}>
              🍽️ KM cho món (đang áp dụng tự động):
            </Text>
            <View style={styles.chipGrid}>
              {itemPromos.map((promo) => (
                <View
                  key={promo.id}
                  style={[styles.chipBtn, { borderColor: '#E65100', backgroundColor: '#FFF3E0' }]}
                >
                  <Text style={{ fontWeight: '600', color: '#E65100' }}>{promo.name}</Text>
                  <Text style={{ fontSize: 11, color: '#BF360C' }}>
                    {promo.discountType === 'percent' ? `-${promo.discountValue}%` : `-${formatCurrency(promo.discountValue)}`}
                    {promo.applyTo === 'CATEGORY' ? ' (nhóm)' : ' (món)'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bill promos - chọn thủ công */}
        {billPromos.length > 0 && (
          <View>
            <Text style={{ fontWeight: '600', marginBottom: 6 }}>
              🏷️ KM cho đơn (chọn 1):
            </Text>
            <View style={styles.chipGrid}>
              {billPromos.map((promo) => {
                const isSelected = selectedPromoId === promo.id;
                const meetsMin = promo.minOrderAmount <= 0 || afterItemDiscount >= promo.minOrderAmount;
                return (
                  <TouchableOpacity
                    key={promo.id}
                    style={[
                      styles.chipBtn,
                      {
                        borderColor: !meetsMin ? '#ccc' : isSelected ? Colors.green : Colors.primary,
                        backgroundColor: !meetsMin ? '#F5F5F5' : isSelected ? '#E8F5E9' : '#F0F8FF',
                        opacity: meetsMin ? 1 : 0.6,
                      },
                    ]}
                    onPress={() => meetsMin && handleSelectPromo(promo)}
                    disabled={!meetsMin}
                  >
                    <Text style={{ fontWeight: '600', color: !meetsMin ? '#999' : isSelected ? Colors.green : Colors.primary }}>
                      {promo.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#64748B' }}>
                      {promo.discountType === 'percent'
                        ? `-${promo.discountValue}%`
                        : `-${formatCurrency(promo.discountValue)}`}
                    </Text>
                    {promo.minOrderAmount > 0 && (
                      <Text style={{ fontSize: 10, color: meetsMin ? '#388E3C' : Colors.red }}>
                        {meetsMin ? '✓' : '×'} Tối thiểu {formatCurrency(promo.minOrderAmount)}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
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
            style={[styles.chipBtn, { backgroundColor: '#E8F5E9', borderColor: Colors.green }]}
            onPress={() => setCustomerPayInput(val.toString())}
          >
            <Text style={{ fontWeight: '600', color: Colors.green }}>
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

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* KHỐI 1: TỔNG QUAN HÓA ĐƠN */}
          <Surface style={styles.sectionCard} elevation={2}>
            <View style={styles.row}>
              <Text style={styles.label}>Tổng tiền hàng:</Text>
              <Text style={styles.value}>{formatCurrency(originalTotal)}</Text>
            </View>

            {/* Hiển thị giảm giá món (nếu có) */}
            {itemDiscountTotal > 0 && (
              <View style={styles.row}>
                <Text style={[styles.label, { color: '#E65100' }]}>
                  🍽️ Giảm giá món ({itemPromos.map(p => p.name).join(', ')}):
                </Text>
                <Text style={[styles.value, { color: '#E65100' }]}>- {formatCurrency(itemDiscountTotal)}</Text>
              </View>
            )}

            {/* Hiển thị giảm giá bill */}
            {billDiscountValue > 0 && (
              <View style={styles.row}>
                <Text style={[styles.label, { color: Colors.red }]}>
                  🏷️ Giảm giá đơn:
                </Text>
                <Text style={[styles.value, { color: Colors.red }]}>- {formatCurrency(billDiscountValue)}</Text>
              </View>
            )}

            {/* Tổng giảm (nếu cả 2 loại) */}
            {totalDiscount > 0 && (itemDiscountTotal > 0 && billDiscountValue > 0) && (
              <View style={styles.row}>
                <Text style={[styles.label, { color: Colors.red, fontWeight: '600' }]}>Tổng giảm:</Text>
                <Text style={[styles.value, { color: Colors.red }]}>- {formatCurrency(totalDiscount)}</Text>
              </View>
            )}

            <Divider style={{ marginVertical: 12 }} />
            <View style={styles.row}>
              <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: Colors.primary }}>Khách phải trả:</Text>
              <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: Colors.primary }}>
                {formatCurrency(finalAmount)}
              </Text>
            </View>
          </Surface>

          {/* KHỐI 2: KHUYẾN MÃI (DISCOUNT) */}
          <Text variant="titleMedium" style={styles.sectionTitle}>Giảm giá / Chiết khấu</Text>
          <Surface style={styles.sectionCard} elevation={1}>
            {renderPromoChips()}
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
              style={{ marginBottom: 15 }}
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
              style={{ backgroundColor: 'white', marginTop: 10 }}
              activeOutlineColor={Colors.primary}
            />
          </Surface>

          {/* KHỐI 3: PHƯƠNG THỨC THANH TOÁN */}
          <Text variant="titleMedium" style={styles.sectionTitle}>Thanh toán bằng</Text>
          <Surface style={styles.sectionCard} elevation={1}>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                style={[styles.paymentTab, paymentMethod === 'CASH' && styles.paymentTabActive]}
                onPress={() => setPaymentMethod('CASH')}
              >
                <MaterialCommunityIcons name="cash-multiple" size={24} color={paymentMethod === 'CASH' ? 'white' : '#666'} />
                <Text style={{ marginLeft: 8, color: paymentMethod === 'CASH' ? 'white' : '#666', fontWeight: 'bold' }}>Tiền mặt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.paymentTab, paymentMethod === 'TRANSFER' && styles.paymentTabActive]}
                onPress={() => setPaymentMethod('TRANSFER')}
              >
                <MaterialCommunityIcons name="qrcode-scan" size={24} color={paymentMethod === 'TRANSFER' ? 'white' : '#666'} />
                <Text style={{ marginLeft: 8, color: paymentMethod === 'TRANSFER' ? 'white' : '#666', fontWeight: 'bold' }}>Chuyển khoản</Text>
              </TouchableOpacity>
            </View>

            {/* Nếu chọn TIỀN MẶT -> Hiện ô nhập tiền khách đưa */}
            {paymentMethod === 'CASH' && (
              <View style={{ marginTop: 20 }}>
                <Text style={{ marginBottom: 10, fontWeight: '600' }}>Gợi ý tiền khách đưa:</Text>
                {renderQuickPayButtons()}

                <TextInput
                  mode="outlined"
                  label="Khách đưa"
                  value={customerPayInput ? formatNumberString(customerPayInput) : ''}
                  onChangeText={(text) => setCustomerPayInput(text.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  right={<TextInput.Affix text="đ" />}
                  style={{ backgroundColor: '#F9F9F9', fontSize: 18, fontWeight: 'bold' }}
                  activeOutlineColor={Colors.green}
                  textColor={Colors.green}
                />

                {/* Hiển thị tiền thừa */}
                <View style={[styles.row, { marginTop: 15, padding: 10, backgroundColor: '#E8F5E9', borderRadius: 8 }]}>
                  <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Tiền thừa trả khách:</Text>
                  <Text style={{ fontWeight: 'bold', fontSize: 20, color: changeAmount < 0 ? Colors.red : Colors.green }}>
                    {changeAmount < 0 ? "Thiếu tiền" : formatCurrency(changeAmount)}
                  </Text>
                </View>
              </View>
            )}

            {/* Nếu chọn CHUYỂN KHOẢN -> Hiện QR */}
            {paymentMethod === 'TRANSFER' && (
              <View style={{ alignItems: 'center', marginTop: 20 }}>
                <MaterialCommunityIcons name="qrcode" size={150} color="#333" />
                <Text style={{ marginTop: 10, color: '#666' }}>Quét mã VietQR để thanh toán</Text>
                <Text style={{ fontWeight: 'bold', fontSize: 18, color: Colors.primary, marginTop: 5 }}>
                  {formatCurrency(finalAmount)}
                </Text>
              </View>
            )}

          </Surface>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* FOOTER */}
      <Surface style={styles.footer} elevation={5}>
        <Button
          mode="contained"
          style={styles.payBtn}
          contentStyle={{ height: 56 }}
          icon="check-circle-outline"
          onPress={handlePayment}
          loading={isProcessing}
          disabled={paymentMethod === 'CASH' && changeAmount < 0} // Disable nếu khách đưa thiếu
          labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
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
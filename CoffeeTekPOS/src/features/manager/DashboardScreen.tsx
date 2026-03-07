import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/app.constant';
import { ManagerHeader } from '../../components/ManagerHeader';
import { useAuthStore } from '../../store/auth.store';

const { width } = Dimensions.get('window');
const CARD_GAP = 14;
const CARD_WIDTH = (width - 32 - CARD_GAP) / 2;

export const DashboardScreen = ({ navigation }: any) => {
  const user = useAuthStore(state => state.user);

  const MENU_ITEMS = [
    {
      id: 'tables',
      title: 'Bàn',
      subtitle: 'Sơ đồ & trạng thái',
      icon: 'table-furniture',
      color: '#FF9800',
      bgColor: '#FFF3E0',
      screen: 'TableManagementScreen'
    },
    {
      id: 'employees',
      title: 'Nhân sự',
      subtitle: 'Quản lý nhân viên',
      icon: 'account-group-outline',
      color: '#42A5F5',
      bgColor: '#E3F2FD',
      screen: 'EmployeeManagementScreen'
    },
    {
      id: 'menu',
      title: 'Thực đơn',
      subtitle: 'Món & tùy chọn',
      icon: 'silverware-fork-knife',
      color: '#66BB6A',
      bgColor: '#E8F5E9',
      screen: 'ProductManagementScreen'
    },
    {
      id: 'inventory',
      title: 'Kho',
      subtitle: 'Nhập & Xuất & Tồn',
      icon: 'package-variant',
      color: '#26A69A',
      bgColor: '#E0F2F1',
      screen: 'InventoryScreen'
    },
    {
      id: 'reports',
      title: 'Báo cáo',
      subtitle: 'Doanh thu thống kê',
      icon: 'chart-line',
      color: '#AB47BC',
      bgColor: '#F3E5F5',
      screen: 'ReportScreen'
    },
    {
      id: 'promo',
      title: 'Khuyến mãi',
      subtitle: 'KM & giảm giá',
      icon: 'tag-heart-outline',
      color: '#EC407A',
      bgColor: '#FCE4EC',
      screen: 'PromoManagementScreen'
    },
  ];

  const handlePress = (item: any) => {
    if (item.screen) {
      navigation.navigate(item.screen);
    } else {
      Alert.alert("Thông báo", `Tính năng ${item.title} đang được phát triển.`);
    }
  };

  return (
    <View style={styles.container}>
      <ManagerHeader
        title="Quản lý"
        subtitle="Hệ thống quản lý cửa hàng"
        showAvatar
        userInitial={user?.fullName ? user.fullName[0] : 'M'}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Chức năng</Text>
          <Text style={styles.sectionCount}>{MENU_ITEMS.length} mục</Text>
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.gridItem}
              onPress={() => handlePress(item)}
              activeOpacity={0.75}
            >
              <View style={styles.card}>
                {/* Icon container - squircle lớn */}
                <View style={[styles.iconBox, { backgroundColor: item.bgColor }]}>
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={28}
                    color={item.color}
                  />
                </View>

                {/* Text section */}
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>{item.subtitle}</Text>

                {/* Arrow indicator */}
                <View style={styles.arrowBox}>
                  <MaterialCommunityIcons name="arrow-right" size={16} color="#C5C5C5" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Đăng xuất */}
        <TouchableOpacity
          style={styles.logoutWrapper}
          onPress={() => useAuthStore.getState().logout()}
          activeOpacity={0.7}
        >
          <View style={styles.logoutCard}>
            <View style={styles.logoutIconBox}>
              <MaterialCommunityIcons name="logout" size={20} color={Colors.red} />
            </View>
            <Text style={styles.logoutText}>Đăng xuất</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#D4D4D4" />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F3F1',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D2D2D',
    letterSpacing: -0.3,
  },
  sectionCount: {
    fontSize: 13,
    color: '#A0A0A0',
    fontWeight: '500',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: CARD_WIDTH,
    marginBottom: CARD_GAP,
  },

  // Card - Dribbble POS style
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 22,
    paddingHorizontal: 18,
    // Shadow nhẹ tán rộng
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },

  // Icon box - squircle lớn
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#A8A8A8',
    fontWeight: '500',
  },

  // Arrow (góc phải dưới)
  arrowBox: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Logout
  logoutWrapper: {
    marginTop: 8,
    marginBottom: 20,
  },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  logoutIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFF1F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  logoutText: {
    flex: 1,
    color: Colors.red,
    fontWeight: '600',
    fontSize: 15,
  },
});
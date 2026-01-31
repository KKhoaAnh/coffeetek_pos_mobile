import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/app.constant';
import { ManagerHeader } from '../../components/ManagerHeader';
import { useAuthStore } from '../../store/auth.store';

export const DashboardScreen = ({ navigation }: any) => {
  const user = useAuthStore(state => state.user);

  // Định nghĩa các chức năng quản lý thực tế đã triển khai
  const MENU_ITEMS = [
    { 
      id: 'tables', 
      title: 'Bàn', 
      icon: 'table-settings', 
      color: '#FF9800', 
      screen: 'TableManagementScreen' 
    },
    { 
      id: 'employees', 
      title: 'Nhân sự', 
      icon: 'account-group', 
      color: '#2196F3', 
      screen: 'EmployeeManagementScreen' 
    },
    { 
      id: 'menu', 
      title: 'Thực đơn', 
      icon: 'silverware-variant', 
      color: '#4CAF50', 
      screen: 'ProductManagementScreen' 
    },
    { 
      id: 'inventory', 
      title: 'Kho', 
      icon: 'package-variant-closed', 
      color: '#00BFA5', 
      screen: 'InventoryScreen' 
    },
    { 
      id: 'reports', 
      title: 'Báo cáo', 
      icon: 'chart-bar', 
      color: '#9C27B0', 
      screen: 'ReportScreen'
    },
    { 
      id: 'promo', 
      title: 'Khuyến mãi', 
      icon: 'ticket-percent', 
      color: '#E91E63', 
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
      {/* Sử dụng ManagerHeader đã được nâng cấp */}
      <ManagerHeader 
        title="Quản Trị" 
        subtitle="Hệ thống quản lý cửa hàng" 
        showAvatar 
        userInitial={user?.fullName ? user.fullName[0] : 'M'} 
      />
      
      <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.gridItem}
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
          >
            <Surface style={styles.card} elevation={2}>
              <View style={[styles.iconCircle, { backgroundColor: item.color + '15' }]}>
                <MaterialCommunityIcons name={item.icon as any} size={32} color={item.color} />
              </View>
              <Text style={styles.itemTitle}>{item.title}</Text>
            </Surface>
          </TouchableOpacity>
        ))}
        
        {/* Nút Đăng xuất thiết kế đồng bộ */}
        <TouchableOpacity 
          style={styles.logoutWrapper}
          onPress={() => useAuthStore.getState().logout()}
        >
          <Surface style={styles.logoutCard} elevation={1}>
             <MaterialCommunityIcons name="logout" size={24} color={Colors.red} style={{marginRight: 10}} />
             <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
          </Surface>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6F8' },
  gridContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    padding: 16, 
    justifyContent: 'space-between' 
  },
  gridItem: { 
    width: '48%', 
    marginBottom: 16 
  },
  card: { 
    padding: 20, 
    borderRadius: 20, 
    backgroundColor: 'white', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: 140,
    // Đảm bảo bóng đổ hiển thị tốt trên cả 2 nền tảng
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  iconCircle: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  itemTitle: { 
    fontWeight: 'bold', 
    fontSize: 15, 
    color: '#444',
    textAlign: 'center'
  },
  logoutWrapper: { 
    width: '100%', 
    marginTop: 8, 
    marginBottom: 30 
  },
  logoutCard: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 16, 
    borderRadius: 16, 
    backgroundColor: '#FFF1F0', // Nền đỏ rất nhạt
    borderWidth: 1,
    borderColor: '#FFA39E'
  },
  logoutText: { 
    color: Colors.red, 
    fontWeight: 'bold',
    fontSize: 16
  }
});
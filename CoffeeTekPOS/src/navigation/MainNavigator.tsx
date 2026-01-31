import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/app.constant';
import { useAuthStore } from '../store/auth.store';
import { TableScreen } from '../features/home/TableScreen';
import { MenuScreen } from '../features/menu/MenuScreen';
import { ShiftScreen } from '../features/manager/ShiftScreen';
import { DashboardScreen } from '../features/manager/DashboardScreen';

const Tab = createBottomTabNavigator();

const SettingsScreen = () => (
  <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor: '#F5F6F8'}}>
    <TouchableOpacity 
      onPress={() => useAuthStore.getState().logout()} 
      style={{
        paddingVertical: 12, 
        paddingHorizontal: 24, 
        backgroundColor: '#FFE5E5', 
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
      }}
    >
      <MaterialCommunityIcons name="logout" size={20} color={Colors.red} style={{marginRight: 8}} />
      <Text style={{color: Colors.red, fontWeight: '600', fontSize: 16}}>Đăng xuất</Text>
    </TouchableOpacity>
  </View>
);

export const MainNavigator = () => {
  const user = useAuthStore(state => state.user);
  const isManager = user?.role === 'manager';
  
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarShowLabel: true,
        
        tabBarStyle: {
          height: 60 + (Platform.OS === 'ios' ? insets.bottom : 10),
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 10,
          paddingTop: 10,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen 
        name="Tables" 
        component={TableScreen} 
        options={{
          tabBarLabel: 'Sơ đồ',
          // [3] Icon thay đổi trạng thái (Outline vs Filled)
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? "table-furniture" : "table-furniture"} // Hoặc dùng "table" nếu muốn khác
              size={26} 
              color={color} 
              style={focused ? styles.activeIcon : null}
            />
          )
        }}
      />

      <Tab.Screen 
        name="Menu" 
        component={MenuScreen} 
        options={{
          tabBarLabel: 'Thực đơn',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              // Active: Sách mở, Inactive: Sách đóng hoặc Outline
              name={focused ? "book-open-variant" : "book-open-page-variant-outline"} 
              size={26} 
              color={color} 
              style={focused ? styles.activeIcon : null}
            />
          )
        }}
      />

      <Tab.Screen 
        name="Shift" 
        component={ShiftScreen} 
        options={{
          tabBarLabel: 'Ca làm việc',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? "clock" : "clock-outline"} 
              size={26} 
              color={color}
              style={focused ? styles.activeIcon : null}
            />
          )
        }}
      />

      <Tab.Screen 
        name="More" 
        component={isManager ? DashboardScreen : SettingsScreen} 
        options={{
          tabBarLabel: isManager ? 'Quản trị' : 'Cài đặt',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name={isManager 
                ? (focused ? "view-grid" : "view-grid-outline") 
                : (focused ? "cog" : "cog-outline")
              } 
              size={26} 
              color={color}
              style={focused ? styles.activeIcon : null}
            />
          )
        }}
      />
    </Tab.Navigator>
  );
};

// [4] Style phụ trợ
const styles = StyleSheet.create({
  activeIcon: {
    // Nếu muốn icon khi chọn nó nảy lên hoặc có bóng nhẹ thì thêm vào đây
    // Hiện tại để mặc định cho mượt
  }
});
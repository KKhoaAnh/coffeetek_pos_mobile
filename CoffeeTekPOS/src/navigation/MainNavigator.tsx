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
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F3F1' }}>
    <TouchableOpacity
      onPress={() => useAuthStore.getState().logout()}
      style={{
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#F0E6E4',
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 0.7,
        borderColor: '#D4A9A2',
      }}
    >
      <MaterialCommunityIcons name="logout" size={20} color="#B07A70" style={{ marginRight: 8 }} />
      <Text style={{ color: '#8B5E55', fontWeight: '600', fontSize: 16 }}>Đăng xuất</Text>
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
        tabBarActiveTintColor: '#5D4037',
        tabBarInactiveTintColor: '#B5AEA7',
        tabBarShowLabel: true,

        tabBarStyle: {
          height: 60 + (Platform.OS === 'ios' ? insets.bottom : 10),
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 10,
          paddingTop: 10,
          backgroundColor: '#EBE7E3',
          borderTopWidth: 0.0,
          borderTopColor: '#D9D4CE',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          // Shadow cực nhẹ
          shadowColor: '#8D6E63',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
          elevation: 2,
          // Overflow cho bo tròn
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
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
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "table-furniture" : "table-furniture"}
              size={24}
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
              name={focused ? "book-open-variant" : "book-open-page-variant-outline"}
              size={24}
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
              size={24}
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
          tabBarLabel: isManager ? 'Quản lý' : 'Cài đặt',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={isManager
                ? (focused ? "view-grid" : "view-grid-outline")
                : (focused ? "cog" : "cog-outline")
              }
              size={24}
              color={color}
              style={focused ? styles.activeIcon : null}
            />
          )
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  activeIcon: {
    // Giữ mặc định cho mượt
  }
});

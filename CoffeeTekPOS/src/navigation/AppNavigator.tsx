import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/auth.store';

import { LoginScreen } from '../features/auth/LoginScreen';
import { AuthContainer } from '../features/auth/AuthContainer';
import { MainNavigator } from './MainNavigator'; // [CẬP NHẬT] Dùng cái này

import { MenuScreen } from '../features/menu/MenuScreen';
import { CartScreen } from '../features/cart/CartScreen';
import { PaymentScreen } from '../features/payment/PaymentScreen';
import { ProductManagementScreen } from '../features/manager/ProductManagementScreen';
import { ProductEditScreen } from '../features/manager/ProductEditScreen';
import { ModifierManagementScreen } from '../features/manager/ModifierManagementScreen';
import { TableManagementScreen } from '../features/manager/TableManagementScreen';
import { EmployeeManagementScreen } from '../features/manager/EmployeeManagementScreen';
import { ReportScreen } from '../features/manager/ReportScreen';
import { InventoryScreen } from '../features/manager/InventoryScreen';
import { PromoManagementScreen } from '../features/manager/PromoManagementScreen';
import { PromoEditScreen } from '../features/manager/PromoEditScreen';
const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {isAuthenticated ? (
          <>
            {/* Vào thẳng Tab Chính */}
            <Stack.Screen name="Main" component={MainNavigator} />
            
            {/* Các màn hình con (nằm đè lên Tab) */}
            {/* Ví dụ: Bấm vào bàn -> Nhảy sang Menu Order riêng */}
            <Stack.Screen name="MenuOrder" component={MenuScreen} />
            <Stack.Screen name="CartScreen" component={CartScreen} />
            <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
            <Stack.Screen name="ProductManagementScreen" component={ProductManagementScreen} />
            <Stack.Screen name="ProductEditScreen" component={ProductEditScreen} />
            <Stack.Screen name="ModifierManagementScreen" component={ModifierManagementScreen} />
            <Stack.Screen name="TableManagementScreen" component={TableManagementScreen} />
            <Stack.Screen name="EmployeeManagementScreen" component={EmployeeManagementScreen} />
            <Stack.Screen name="ReportScreen" component={ReportScreen} />
            <Stack.Screen name="InventoryScreen" component={InventoryScreen} />
            <Stack.Screen name="PromoManagementScreen" component={PromoManagementScreen} />
            <Stack.Screen name="PromoEditScreen" component={PromoEditScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={AuthContainer} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
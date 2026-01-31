import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/app.constant';
import { authApi } from '../../api/auth.api';       // [MỚI]
import { useAuthStore } from '../../store/auth.store'; // [MỚI]

export const LoginScreen = () => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false); // [MỚI] Hiển thị loading khi gọi API
  const PIN_LENGTH = 6; 
  
  // Lấy hàm login từ Store
  const loginAction = useAuthStore(state => state.login);

  const handlePress = (val: string) => {
    if (loading) return; // Đang load thì không cho bấm

    if (val === 'delete') {
      setPin(prev => prev.slice(0, -1));
    } else if (val === 'faceid') {
      Alert.alert("Tính năng", "Đăng nhập FaceID sẽ phát triển sau");
    } else {
      if (pin.length < PIN_LENGTH) {
        const newPin = pin + val;
        setPin(newPin);
        
        // Tự động submit khi đủ ký tự
        if (newPin.length === PIN_LENGTH) {
          handleLoginSubmit(newPin);
        }
      }
    }
  };

  const handleLoginSubmit = async (finalPin: string) => {
    try {
      setLoading(true); // Bật loading

      // 1. Gọi API
      const response = await authApi.loginWithPin(finalPin);
      
      // 2. Lấy dữ liệu từ Backend trả về
      const { user, token } = response.data;

      // 3. Map dữ liệu Backend (snake_case) sang Frontend (camelCase)
      const mappedUser = {
        id: user.user_id,
        fullName: user.full_name,
        role: user.role,
        avatarUrl: user.avatar_url
      };

      // 4. Lưu vào Store -> App tự chuyển sang Home
      loginAction(mappedUser, token);

    } catch (error: any) {
      console.log('Login Error:', error);
      
      // Reset PIN để nhập lại
      setPin(''); 
      
      // Hiển thị lỗi từ Backend gửi về (nếu có)
      const message = error.response?.data?.message || 'Mã PIN không đúng hoặc lỗi kết nối';
      Alert.alert('Đăng nhập thất bại', message);
      
    } finally {
      setLoading(false); // Tắt loading
    }
  };

  // ... (Phần renderDots và renderKey GIỮ NGUYÊN như code cũ) ...
  const renderDots = () => {
    return (
      <View style={styles.dotContainer}>
        {[...Array(PIN_LENGTH)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i < pin.length ? Colors.primary : '#E0E0E0' }
            ]}
          />
        ))}
      </View>
    );
  };

  type MCIIconName = keyof typeof MaterialCommunityIcons.glyphMap;


  const renderKey = (
    val: string,
    label?: string,
    icon?: MCIIconName
  ) => {
    return (
        <TouchableOpacity
        style={styles.keyButton}
        onPress={() => handlePress(val)}
        activeOpacity={0.7}
        >
        {icon ? (
            <MaterialCommunityIcons
            name={icon}
            size={28}
            color={Colors.primary}
            />
        ) : (
            <Text style={styles.keyText}>{label ?? val}</Text>
        )}
        </TouchableOpacity>
    );
  };


  return (
    <View style={styles.container}>
      {/* Phần trên: Logo & Dots */}
      <View style={styles.topSection}>
        <Text variant="headlineMedium" style={styles.title}>Nhập Mã PIN</Text>
        <Text style={styles.subtitle}>Vui lòng nhập mã định danh của bạn</Text>
        
        {renderDots()}

        {/* [MỚI] Hiển thị vòng xoay loading nếu đang gọi API */}
        {loading && (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
        )}
      </View>

      {/* Phần dưới: Bàn phím số */}
      <View style={styles.keyboardContainer}>
        <View style={styles.row}>
          {renderKey('1')}
          {renderKey('2')}
          {renderKey('3')}
        </View>
        <View style={styles.row}>
          {renderKey('4')}
          {renderKey('5')}
          {renderKey('6')}
        </View>
        <View style={styles.row}>
          {renderKey('7')}
          {renderKey('8')}
          {renderKey('9')}
        </View>
        <View style={styles.row}>
          {renderKey('faceid', '', 'face-recognition')}
          {renderKey('0')}
          {renderKey('delete', '', 'backspace-outline')}
        </View>
      </View>
      
      <Text style={styles.footerText}>CoffeeTek POS Mobile v1.0</Text>
    </View>
  );
};

// ... (Phần styles GIỮ NGUYÊN như code cũ) ...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  topSection: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 20,
  },
  title: {
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.secondary,
    marginBottom: 30,
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  keyboardContainer: {
    flex: 3,
    paddingHorizontal: 40,
    paddingTop: 40,
    justifyContent: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  keyButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  keyText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  footerText: {
    textAlign: 'center',
    color: '#999',
    marginBottom: 20,
    fontSize: 12,
  }
});
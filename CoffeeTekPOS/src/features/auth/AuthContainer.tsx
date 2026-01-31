import React, { useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Animated, StatusBar } from 'react-native';
import { LoginScreen } from './LoginScreen';
import { WelcomeOverlay } from './WelcomeOverlay';

const { height } = Dimensions.get('window');

export const AuthContainer = () => {
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(true);
  
  // Giá trị Animation: chạy từ 0 đến -height
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleDismissWelcome = () => {
    Animated.timing(slideAnim, {
      toValue: -height, // Trượt lên hết màn hình
      duration: 600,    // Chậm hơn chút cho mượt (600ms)
      useNativeDriver: true,
    }).start(() => {
      setIsWelcomeVisible(false); // Ẩn hẳn sau khi chạy xong
    });
  };

  // [MA THUẬT] Tạo hiệu ứng Mờ dần (Fade Out) dựa trên vị trí trượt
  const opacityAnim = slideAnim.interpolate({
    inputRange: [-height / 2, 0], // Khi trượt được nửa đường -> Đến vị trí gốc
    outputRange: [0, 1],          // Thì độ mờ từ 0 (trong suốt) -> 1 (rõ)
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Lớp Login (Nằm dưới) - Luôn hiển thị */}
      <View style={styles.layerLogin}>
        <LoginScreen />
      </View>

      {/* Lớp Welcome (Nằm trên) - Có hiệu ứng Trượt + Mờ */}
      {isWelcomeVisible && (
        <Animated.View 
          style={[
            styles.layerWelcome, 
            { 
              transform: [{ translateY: slideAnim }], // 1. Hiệu ứng trượt lên
              opacity: opacityAnim                    // 2. Hiệu ứng mờ dần
            } 
          ]}
        >
          <WelcomeOverlay onDismiss={handleDismissWelcome} />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  layerLogin: { flex: 1, zIndex: 1 },
  layerWelcome: { ...StyleSheet.absoluteFillObject, zIndex: 2 },
});
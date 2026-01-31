import React from 'react';
import { View, StyleSheet, Platform, StatusBar, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/app.constant';

interface Props {
  title: string;
  subtitle?: string;
  showAvatar?: boolean;
  userInitial?: string;
  // [MỚI] Thêm tùy chọn nút bên phải
  rightIcon?: keyof typeof MaterialCommunityIcons.glyphMap; // Giới hạn tên icon cho chuẩn
  onRightPress?: () => void;
}

export const ManagerHeader = ({ 
  title, 
  subtitle, 
  showAvatar = false, 
  userInitial = "U",
  rightIcon,      // [MỚI]
  onRightPress    // [MỚI]
}: Props) => {
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack();

  return (
    <Surface style={styles.container} elevation={4}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={styles.content}>
        {/* TRÁI: Back hoặc Logo */}
        <View style={styles.leftSection}>
          {canGoBack ? (
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={styles.iconButton}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            >
              <MaterialCommunityIcons name="arrow-left" size={26} color={Colors.white} />
            </TouchableOpacity>
          ) : (
            <View style={styles.appIcon}>
              <MaterialCommunityIcons name="store" size={20} color={Colors.primary} />
            </View>
          )}
          
          <View style={{ marginLeft: 12 }}>
            <Text variant="titleMedium" style={styles.title}>{title}</Text>
            {subtitle && (
              <Text variant="bodySmall" style={styles.subtitle}>{subtitle}</Text>
            )}
          </View>
        </View>

        {/* PHẢI: Các nút hành động hoặc Avatar */}
        <View style={styles.rightSection}>
            {/* [MỚI] Nút hành động tùy chỉnh (Edit, Filter...) */}
            {rightIcon && (
                <TouchableOpacity 
                    onPress={onRightPress} 
                    style={[styles.iconButton, { marginRight: showAvatar ? 8 : 0 }]} // Cách avatar ra nếu có
                >
                    <MaterialCommunityIcons name={rightIcon} size={24} color={Colors.white} />
                </TouchableOpacity>
            )}

            {/* Avatar User */}
            {showAvatar && (
                <View style={styles.avatar}>
                    <Text style={{color: Colors.primary, fontWeight: 'bold'}}>{userInitial}</Text>
                </View>
            )}
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#8D6E63', 
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight! + 10,
    paddingBottom: 15,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    zIndex: 10,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, 
  },
  rightSection: {
      flexDirection: 'row',
      alignItems: 'center'
  },
  // [SỬA] Đặt tên chung là iconButton để tái sử dụng style kính mờ
  iconButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)', // Hiệu ứng kính mờ sang trọng
    justifyContent: 'center',
    alignItems: 'center'
  },
  appIcon: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center'
  },
  title: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18, 
    backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 4, // Chỉnh lại margin chút
    elevation: 2
  }
});
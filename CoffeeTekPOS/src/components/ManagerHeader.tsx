import React from 'react';
import { View, StyleSheet, Platform, StatusBar, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/app.constant';

interface Props {
  title: string;
  subtitle?: string;
  showAvatar?: boolean;
  userInitial?: string;
  rightIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onRightPress?: () => void;
}

export const ManagerHeader = ({
  title,
  subtitle,
  showAvatar = false,
  userInitial = "U",
  rightIcon,
  onRightPress
}: Props) => {
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack();

  return (
    <LinearGradient
      colors={['#6D4C41', '#8D6E63', '#B5A59E', '#D6CEC9', '#F4F3F1']}
      locations={[0, 0.3, 0.6, 0.85, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.content}>
        {/* TRÁI: Back hoặc Logo */}
        <View style={styles.leftSection}>
          {canGoBack ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.iconButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.white} />
            </TouchableOpacity>
          ) : (
            <View style={styles.appIcon}>
              <MaterialCommunityIcons name="store" size={18} color="#6D4C41" />
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
          {rightIcon && (
            <TouchableOpacity
              onPress={onRightPress}
              style={[styles.iconButton, { marginRight: showAvatar ? 8 : 0 }]}
            >
              <MaterialCommunityIcons name={rightIcon} size={22} color={Colors.white} />
            </TouchableOpacity>
          )}

          {showAvatar && (
            <View style={styles.avatar}>
              <Text style={{ color: '#6D4C41', fontWeight: 'bold', fontSize: 14 }}>{userInitial}</Text>
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight ?? 24) + 10,
    paddingBottom: 20,
    paddingHorizontal: 16,
    // Không bo góc dưới - hòa vào nền
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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
    alignItems: 'center',
  },
  iconButton: {
    padding: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appIcon: {
    width: 34, height: 34, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center', alignItems: 'center',
  },
  title: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.3,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 1,
  },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 4,
  },
});

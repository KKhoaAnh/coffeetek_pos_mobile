import React, { useRef } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Animated, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Table } from '../store/table.store';
import { Colors } from '../constants/app.constant';

const { width } = Dimensions.get('window');
const GRID_CELL_SIZE = (width - 48) / 3;

interface Props {
  table: Table;
  onPress: (table: Table) => void;
}

export const TableItem = ({ table, onPress }: Props) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.93, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    onPress(table);
  };

  // --- LOGIC HÌNH DÁNG ---
  let borderRadius = 18;
  let heightRatio = 1;
  let iconName = 'table-furniture';

  const isRectangle = table.shape === 'RECTANGLE' || ((table.width ?? 0) > (table.height ?? 0));

  if (table.shape === 'CIRCLE') {
    borderRadius = GRID_CELL_SIZE / 2;
    iconName = 'record-circle-outline';
  } else if (isRectangle) {
    borderRadius = 12;
    heightRatio = 0.65;
  }

  // --- LOGIC TRẠNG THÁI ---
  const isOccupied = table.status === 'OCCUPIED';
  const isCleaning = table.status === 'CLEANING';

  // Màu nền ấm, hòa vào nền chung
  let bgColor = '#ffffffff';       // Bàn trống - be ấm (giống ProductItem)
  let borderColor = '#C8D6C2';   // Viền xanh rất nhạt cho bàn trống
  let iconColor = '#A09B94';
  let nameColor = '#6B6560';
  let badgeColor = '#8DB580';    // Xanh nhẹ

  if (isOccupied) {
    bgColor = '#ffffffff';         // Hồng be rất nhạt
    borderColor = '#db523dff';     // Viền hồng nâu rất nhạt
    iconName = 'account-group';
    iconColor = '#db523dff';
    nameColor = '#8B5E55';
    badgeColor = '#db523dff';      // Đỏ nâu nhẹ
  }

  if (isCleaning) {
    bgColor = '#ffffffff';
    borderColor = '#dcb749ff';
    iconName = 'broom';
    iconColor = '#dcb749ff';
    nameColor = '#8A8378';
    badgeColor = '#dcb749ff';
  }

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      delayPressIn={150}
    >
      <View style={styles.gridCellWrapper}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <View style={[
            styles.tableCard,
            {
              backgroundColor: bgColor,
              borderColor: borderColor,
              borderRadius: borderRadius,
              height: GRID_CELL_SIZE * heightRatio,
              width: GRID_CELL_SIZE,
            }
          ]}>

            {/* Badge trạng thái - nhỏ và tinh tế */}
            <View style={[
              styles.badge,
              { backgroundColor: badgeColor }
            ]} />

            <View style={{ alignItems: 'center' }}>
              <MaterialCommunityIcons name={iconName as any} size={24} color={iconColor} />

              <Text style={[
                styles.tableName,
                { color: nameColor }
              ]} numberOfLines={1}>
                {table.table_name}
              </Text>
            </View>

          </View>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  gridCellWrapper: {
    width: GRID_CELL_SIZE,
    height: GRID_CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  tableCard: {
    justifyContent: 'center',
    alignItems: 'center',
    // Đường viền mảnh thiệt mảnh - chỉ đủ phát hiện
    borderWidth: 0.7,
    // Shadow cực nhẹ, hòa nền
    shadowColor: '#8D6E63',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  tableName: {
    fontWeight: '600',
    marginTop: 5,
    fontSize: 12,
    letterSpacing: -0.2,
  },
  badge: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

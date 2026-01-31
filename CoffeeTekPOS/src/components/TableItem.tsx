import React, { useRef } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Animated, Dimensions } from 'react-native';
import { Text, Surface } from 'react-native-paper';

// [SỬA] Dùng thư viện chuẩn của Expo
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
    Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    onPress(table);
  };

  // --- LOGIC HÌNH DÁNG ---
  let borderRadius = 16;
  let heightRatio = 1; 
  let iconName = 'table-furniture';

  // [SỬA] Logic kiểm tra an toàn hơn: (table.width ?? 0)
  // Nếu DB trả về null thì coi như là 0
  const isRectangle = table.shape === 'RECTANGLE' || ((table.width ?? 0) > (table.height ?? 0));

  if (table.shape === 'CIRCLE') {
    borderRadius = GRID_CELL_SIZE / 2; 
    iconName = 'record-circle-outline'; 
  } else if (isRectangle) { 
    borderRadius = 8;
    heightRatio = 0.65; 
  }

  // --- LOGIC TRẠNG THÁI ---
  const isOccupied = table.status === 'OCCUPIED';
  const bgColor = isOccupied ? '#FFEBEE' : '#FFFFFF';
  const borderColor = isOccupied ? Colors.red : '#E0E0E0';
  const iconColor = isOccupied ? Colors.red : '#9E9E9E';

  if (isOccupied) iconName = 'account-group';

  return (
    <TouchableWithoutFeedback 
      onPressIn={handlePressIn} 
      onPressOut={handlePressOut}
      delayPressIn={150} 
    >
      <View style={styles.gridCellWrapper}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Surface style={[
            styles.surfaceTable, 
            { 
              backgroundColor: bgColor, 
              borderColor: borderColor,
              borderRadius: borderRadius,
              height: GRID_CELL_SIZE * heightRatio,
              width: GRID_CELL_SIZE,
            }
          ]} elevation={isOccupied ? 4 : 1}>
            
            <View style={[
              styles.badge, 
              { backgroundColor: isOccupied ? Colors.red : Colors.green }
            ]} />

            <View style={{alignItems: 'center'}}>
               <MaterialCommunityIcons name={iconName as any} size={28} color={iconColor} />
               
               <Text variant="labelMedium" style={[
                  styles.tableName, 
                  { color: isOccupied ? Colors.red : '#555' }
                ]} numberOfLines={1}>
                  {table.table_name}
               </Text>
            </View>

          </Surface>
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
  surfaceTable: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tableName: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  }
});
import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, IconButton, TextInput, ActivityIndicator, RadioButton, Checkbox, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Modal from 'react-native-modal';

import { Colors, getImageUrl } from '../constants/app.constant';
import { Product } from '../store/menu.store';
import { productApi } from '../api/product.api';
import { formatCurrency } from '../utils/format';
import { useCartStore, CartItem, SelectedModifier } from '../store/cart.store';

const { height } = Dimensions.get('window');

interface ModifierGroup {
  group_id: number;
  group_name: string;
  is_multi_select: boolean;
  is_required: boolean;
  modifiers: {
    modifier_id: number;
    modifier_name: string;
    extra_price: number;
    is_input_required: boolean;
  }[];
}

interface Props {
  isVisible: boolean;
  product: Product | null;
  onClose: () => void;
  editingCartItem?: CartItem | null; 
}

export const ProductDetailModal = ({ isVisible, product, onClose, editingCartItem }: Props) => {
  const { addToCart, removeFromCart } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [selections, setSelections] = useState<Record<number, number[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isVisible && product) {
      loadModifiersAndSetup();
    }
  }, [isVisible, product, editingCartItem]);

  const loadModifiersAndSetup = async () => {
    if (!product) return;
    
    // 1. Setup dữ liệu cơ bản
    if (editingCartItem) {
      setQuantity(editingCartItem.quantity);
      setNote(editingCartItem.note || '');
    } else {
      setQuantity(1);
      setNote('');
    }

    setLoading(true);
    try {
      // 2. Load Modifier
      let groups: ModifierGroup[] = [];
      if (product.has_modifiers) {
        const res = await productApi.getProductModifiers(product.product_id);
        groups = res.data;
      }
      setModifierGroups(groups);
      
      // 3. Setup Selections (Logic Fix: Ép kiểu Number toàn bộ để so sánh)
      const initialSelections: Record<number, number[]> = {};

      if (editingCartItem) {
        // Lấy danh sách ID đã chọn trong giỏ hàng (Chắc chắn là Number)
        const selectedModifierIds = editingCartItem.modifiers.map(m => Number(m.modifier_id));

        groups.forEach(g => {
          // Ép kiểu ID group và ID modifier từ API về Number
          const groupID = Number(g.group_id);
          const availableIdsInGroup = g.modifiers.map(m => Number(m.modifier_id));
          
          // Tìm điểm chung
          const intersection = selectedModifierIds.filter(id => availableIdsInGroup.includes(id));
          
          initialSelections[groupID] = intersection;
        });

      } else {
        // Logic thêm mới
        groups.forEach(g => {
          const groupID = Number(g.group_id);
          if (g.is_required && !g.is_multi_select && g.modifiers.length > 0) {
            initialSelections[groupID] = [Number(g.modifiers[0].modifier_id)];
          } else {
            initialSelections[groupID] = [];
          }
        });
      }
      
      setSelections(initialSelections);

    } catch (error) {
      console.error("Lỗi load modifiers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOption = (group: ModifierGroup, modId: number) => {
    const groupID = Number(group.group_id); // [FIX] Ép kiểu
    const currentSelected = selections[groupID] || [];
    let newSelected = [...currentSelected];

    if (group.is_multi_select) {
      if (newSelected.includes(modId)) {
        newSelected = newSelected.filter(id => id !== modId);
      } else {
        newSelected.push(modId);
      }
    } else {
      newSelected = [modId];
    }
    setSelections({ ...selections, [groupID]: newSelected });
  };

  const totalPrice = useMemo(() => {
    if (!product) return 0;
    let total = product.price_value;
    
    modifierGroups.forEach(group => {
      const groupID = Number(group.group_id); // [FIX] Ép kiểu
      const selectedIds = selections[groupID] || [];
      
      selectedIds.forEach(modId => {
        // So sánh 2 số (Number vs Number)
        const mod = group.modifiers.find(m => Number(m.modifier_id) === modId);
        if (mod) total += mod.extra_price;
      });
    });
    
    return total * quantity;
  }, [product, modifierGroups, selections, quantity]);

  const isValid = useMemo(() => {
    for (const group of modifierGroups) {
      if (group.is_required) {
        const groupID = Number(group.group_id); // [FIX] Ép kiểu
        const selected = selections[groupID];
        if (!selected || selected.length === 0) return false;
      }
    }
    return true;
  }, [modifierGroups, selections]);

  const handleSubmit = () => {
    if (!product) return;

    const selectedModifiers: SelectedModifier[] = [];
    
    modifierGroups.forEach(group => {
       const groupID = Number(group.group_id); // [FIX] Ép kiểu
       const selectedIds = selections[groupID] || [];
       
       selectedIds.forEach(modId => {
         const mod = group.modifiers.find(m => Number(m.modifier_id) === modId);
         if (mod) {
           selectedModifiers.push({
             modifier_id: Number(mod.modifier_id),
             modifier_name: mod.modifier_name,
             extra_price: mod.extra_price,
             quantity: 1,
             group_name: group.group_name
           });
         }
       });
    });

    const newItem: CartItem = {
      cartItemId: '', // Store sẽ tự tạo
      product: product,
      quantity: quantity,
      modifiers: selectedModifiers,
      note: note,
      totalPrice: totalPrice
    };

    if (editingCartItem) {
      removeFromCart(editingCartItem.cartItemId);
    }

    addToCart(newItem);
    onClose();
  };

  if (!product) return null;

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={styles.modal}
      propagateSwipe
    >
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <View style={styles.container}>
          
          <View style={styles.header}>
             <View style={styles.headerImageContainer}>
               {/* Dùng getImageUrl để hiển thị ảnh */}
               {product.image_url ? (
                 <Image source={{ uri: getImageUrl(product.image_url) }} style={styles.image} resizeMode="cover" />
               ) : (
                 <View style={[styles.image, {backgroundColor: '#EEE', justifyContent:'center', alignItems:'center'}]}>
                    <MaterialCommunityIcons name="coffee" size={40} color="#CCC"/>
                 </View>
               )}
             </View>
             <IconButton icon="close" size={24} style={styles.closeBtn} onPress={onClose} containerColor="#F0F0F0"/>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.titleSection}>
              <Text variant="headlineSmall" style={styles.productName}>
                {editingCartItem ? `Sửa: ${product.product_name}` : product.product_name}
              </Text>
              <Text variant="titleMedium" style={{color: Colors.primary, fontWeight: 'bold'}}>
                {formatCurrency(product.price_value)}
              </Text>
            </View>

            {loading ? (
              <ActivityIndicator style={{marginTop: 20}} color={Colors.primary} />
            ) : (
              <View>
                {modifierGroups.map(group => {
                  const groupID = Number(group.group_id); // [FIX] Ép kiểu để lấy key
                  return (
                    <View key={groupID} style={styles.groupContainer}>
                      <View style={styles.groupHeader}>
                        <Text variant="titleMedium" style={{fontWeight: 'bold'}}>{group.group_name}</Text>
                        {group.is_required && (
                          <View style={styles.requiredBadge}>
                             <Text style={{color: 'white', fontSize: 10, fontWeight: 'bold'}}>BẮT BUỘC</Text>
                          </View>
                        )}
                        {group.is_multi_select && (
                          <Text style={{color: '#888', fontSize: 12, marginLeft: 8}}>(Chọn nhiều)</Text>
                        )}
                      </View>

                      {group.modifiers.map(mod => {
                        const modID = Number(mod.modifier_id); // [FIX] Ép kiểu ID
                        const isSelected = selections[groupID]?.includes(modID);
                        return (
                          <TouchableOpacity 
                            key={modID} 
                            style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                            onPress={() => handleToggleOption(group, modID)}
                            activeOpacity={0.7}
                          >
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                              {group.is_multi_select ? (
                                <Checkbox status={isSelected ? 'checked' : 'unchecked'} color={Colors.primary} />
                              ) : (
                                <RadioButton.Android value="1" status={isSelected ? 'checked' : 'unchecked'} color={Colors.primary} />
                              )}
                              <Text style={[styles.optionText, isSelected && {fontWeight: 'bold', color: Colors.primary}]}>
                                {mod.modifier_name}
                              </Text>
                            </View>
                            {mod.extra_price > 0 && (
                              <Text style={{color: '#666'}}>+{formatCurrency(mod.extra_price)}</Text>
                            )}
                          </TouchableOpacity>
                        )
                      })}
                    </View>
                  );
                })}

                <View style={styles.groupContainer}>
                   <Text variant="titleMedium" style={{fontWeight: 'bold', marginBottom: 10}}>Ghi chú</Text>
                   <TextInput
                     mode="outlined"
                     placeholder="Ví dụ: Ít đá, nhiều sữa..."
                     value={note}
                     onChangeText={setNote}
                     outlineColor="#DDD"
                     activeOutlineColor={Colors.primary}
                     style={{backgroundColor: '#FFF'}}
                   />
                </View>
              </View>
            )}
            <View style={{height: 100}} />
          </ScrollView>

          <Surface style={styles.footer} elevation={4}>
            <View style={styles.quantityControl}>
               <IconButton 
                 icon="minus" 
                 mode="contained" 
                 containerColor="#F0F0F0" 
                 iconColor="#333" 
                 size={18}
                 onPress={() => quantity > 1 && setQuantity(q => q - 1)}
               />
               <Text variant="titleLarge" style={{fontWeight: 'bold', minWidth: 30, textAlign: 'center'}}>{quantity}</Text>
               <IconButton 
                 icon="plus" 
                 mode="contained" 
                 containerColor={Colors.primary} 
                 iconColor="white" 
                 size={18}
                 onPress={() => setQuantity(q => q + 1)}
               />
            </View>

            <Button 
              mode="contained" 
              style={[styles.addButton, !isValid && {backgroundColor: '#CCC'}]} 
              contentStyle={{height: 50}}
              onPress={handleSubmit}
              disabled={!isValid}
            >
               {editingCartItem ? "Cập Nhật" : "Thêm"} - {formatCurrency(totalPrice)}
            </Button>
          </Surface>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: { margin: 0, justifyContent: 'flex-end' },
  container: { backgroundColor: '#fff', height: height * 0.85, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  header: { height: 180, width: '100%', position: 'relative' },
  headerImageContainer: { width: '100%', height: '100%' },
  image: { width: '100%', height: '100%' },
  closeBtn: { position: 'absolute', top: 10, right: 10, zIndex: 1 },
  content: { flex: 1, paddingHorizontal: 20 },
  titleSection: { paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  productName: { fontWeight: 'bold', marginBottom: 4 },
  groupContainer: { marginTop: 20 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  requiredBadge: { backgroundColor: Colors.red, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F9F9F9' },
  optionRowSelected: { backgroundColor: '#FFF8F6', borderRadius: 8, paddingHorizontal: 8, marginHorizontal: -8 },
  optionText: { fontSize: 15, marginLeft: 4, color: '#444' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0', backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quantityControl: { flexDirection: 'row', alignItems: 'center' },
  addButton: { flex: 1, marginLeft: 20, backgroundColor: Colors.primary, borderRadius: 12 },
});
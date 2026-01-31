import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Text, TextInput, Button, Checkbox, Surface, Divider } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ManagerHeader } from '../../components/ManagerHeader';
import { Colors, getImageUrl } from '../../constants/app.constant';
import { productApi } from '../../api/product.api';
import { modifierApi } from '../../api/modifier.api'; // Cần import API lấy danh sách toàn bộ modifier

export const ProductEditScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Nếu có params.product -> Chế độ EDIT. Nếu không -> Chế độ CREATE
  const { product } = (route.params as any) || {}; 
  const isEditMode = !!product;

  // --- FORM STATE ---
  const [name, setName] = useState(isEditMode ? product.product_name : '');
  const [price, setPrice] = useState(isEditMode ? (product.price_value || 0).toString() : '');
  const [categoryId, setCategoryId] = useState(isEditMode ? product.category_id : '1'); // Mặc định category 1 (hoặc làm dropdown chọn sau)
  const [description, setDescription] = useState(isEditMode ? (product.description || '') : '');
  const [image, setImage] = useState<any>(null);

  // --- MODIFIER STATE ---
  const [allGroups, setAllGroups] = useState<any[]>([]); // Danh sách toàn bộ nhóm & modifier
  const [selectedModIds, setSelectedModIds] = useState<number[]>([]); // Danh sách ID đang chọn
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- LOAD DATA ---
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoadingData(true);
    try {
        // 1. Lấy tất cả Modifier có sẵn trong hệ thống
        const modRes = await modifierApi.getAll();
        setAllGroups(modRes.data);

        // 2. Nếu đang Sửa -> Lấy danh sách modifier hiện tại của món
        if (isEditMode) {
            const currentIdsRes = await productApi.getProductModifierIds(product.product_id);
            // API trả về mảng string hoặc number, ép về number cho chắc
            const ids = currentIdsRes.data.map((id: any) => Number(id));
            setSelectedModIds(ids);
        }
    } catch (error) {
        console.error(error);
        Alert.alert("Lỗi", "Không thể tải dữ liệu tùy chọn");
    } finally {
        setIsLoadingData(false);
    }
  };

  // --- LOGIC CHỌN ẢNH ---
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  // --- LOGIC CHECKBOX ---

  // Kiểm tra 1 nhóm có được chọn hết không
  const isGroupSelected = (group: any) => {
    if (group.modifiers.length === 0) return false;
    // Nhóm được coi là "đang chọn" nếu TẤT CẢ con của nó đều nằm trong selectedModIds
    return group.modifiers.every((m: any) => selectedModIds.includes(m.modifier_id));
  };

  // Toggle cả nhóm
  const handleToggleGroup = (group: any) => {
    const allChildIds = group.modifiers.map((m: any) => m.modifier_id);
    const isSelected = isGroupSelected(group);

    if (isSelected) {
        // Nếu đang chọn hết -> Bỏ chọn hết (Lọc bỏ các id thuộc nhóm này)
        setSelectedModIds(prev => prev.filter(id => !allChildIds.includes(id)));
    } else {
        // Nếu chưa chọn hết -> Chọn hết (Thêm các id chưa có vào)
        // Dùng Set để tránh trùng lặp
        const newSet = new Set([...selectedModIds, ...allChildIds]);
        setSelectedModIds(Array.from(newSet));
    }
  };

  // Toggle từng món lẻ
  const handleToggleModifier = (modId: number) => {
    if (selectedModIds.includes(modId)) {
        setSelectedModIds(prev => prev.filter(id => id !== modId));
    } else {
        setSelectedModIds(prev => [...prev, modId]);
    }
  };

  // --- LOGIC LƯU (CREATE / UPDATE) ---
  const handleSave = async () => {
    if (!name || !price) {
        Alert.alert("Thiếu thông tin", "Tên món và giá không được để trống");
        return;
    }

    setIsSaving(true);
    try {
        const payload = {
            product_name: name,
            price: parseFloat(price),
            category_id: categoryId,
            description: description,
            modifier_ids: selectedModIds // Gửi kèm danh sách modifier
        };

        if (isEditMode) {
            // UPDATE
            await productApi.updateProduct(product.product_id, payload, image);
            Alert.alert("Thành công", "Cập nhật món thành công!", [{ text: "OK", onPress: () => navigation.goBack() }]);
        } else {
            // CREATE
            await productApi.createProduct(payload, image);
            Alert.alert("Thành công", "Thêm món mới thành công!", [{ text: "OK", onPress: () => navigation.goBack() }]);
        }

    } catch (error) {
        console.error(error);
        Alert.alert("Lỗi", "Không thể lưu món ăn.");
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ManagerHeader 
        title={isEditMode ? "Sửa Món Ăn" : "Thêm Món Mới"} 
        subtitle={isEditMode ? product.product_name : "Nhập thông tin món"} 
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* 1. ẢNH */}
        <View style={{alignItems: 'center', marginBottom: 20}}>
            <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
                {image ? (
                    <Image source={{ uri: image.uri }} style={styles.image} />
                ) : (
                    <Image 
                        source={isEditMode && product.image_url ? { uri: getImageUrl(product.image_url) } : require('../../../assets/welcome-background.jpg')} 
                        style={styles.image} 
                    />
                )}
                <View style={styles.cameraIcon}>
                    <MaterialCommunityIcons name="camera" size={20} color="white" />
                </View>
            </TouchableOpacity>
        </View>

        {/* 2. THÔNG TIN CƠ BẢN */}
        <Surface style={styles.section} elevation={1}>
            <TextInput
                label="Tên món *"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
                activeOutlineColor={Colors.primary}
            />
            <View style={{flexDirection: 'row', gap: 10}}>
                <TextInput
                    label="Giá bán *"
                    value={price}
                    onChangeText={setPrice}
                    mode="outlined"
                    keyboardType="numeric"
                    style={[styles.input, {flex: 1}]}
                    right={<TextInput.Affix text="đ" />}
                    activeOutlineColor={Colors.primary}
                />
                <TextInput
                    label="Danh mục ID"
                    value={String(categoryId)}
                    onChangeText={setCategoryId}
                    mode="outlined"
                    keyboardType="numeric"
                    style={[styles.input, {flex: 0.5}]}
                    activeOutlineColor={Colors.primary}
                />
            </View>
            <TextInput
                label="Mô tả ngắn"
                value={description}
                onChangeText={setDescription}
                mode="outlined"
                multiline
                numberOfLines={2}
                style={[styles.input, {marginBottom: 0}]}
                activeOutlineColor={Colors.primary}
            />
        </Surface>

        {/* 3. CHỌN MODIFIER */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Tùy chọn đi kèm (Topping)</Text>
        
        {isLoadingData ? (
            <ActivityIndicator style={{marginTop: 20}} color={Colors.primary} />
        ) : (
            allGroups.map(group => (
                <Surface key={group.group_id} style={styles.groupCard} elevation={1}>
                    {/* Header Nhóm: Cho phép Select All */}
                    <TouchableOpacity 
                        style={styles.groupHeader} 
                        onPress={() => handleToggleGroup(group)}
                        activeOpacity={0.7}
                    >
                        <Checkbox 
                            status={isGroupSelected(group) ? 'checked' : 'unchecked'} 
                            onPress={() => handleToggleGroup(group)}
                            color={Colors.primary}
                        />
                        <Text style={{fontWeight: 'bold', fontSize: 16, flex: 1}}>
                            {group.group_name} 
                            <Text style={{fontWeight: 'normal', color: '#666', fontSize: 14}}> (Chọn cả nhóm)</Text>
                        </Text>
                    </TouchableOpacity>
                    
                    <Divider />

                    {/* Danh sách Modifier con */}
                    <View style={styles.modList}>
                        {group.modifiers.map((mod: any) => (
                            <TouchableOpacity 
                                key={mod.modifier_id}
                                style={styles.modItem}
                                onPress={() => handleToggleModifier(mod.modifier_id)}
                            >
                                <Checkbox 
                                    status={selectedModIds.includes(mod.modifier_id) ? 'checked' : 'unchecked'} 
                                    onPress={() => handleToggleModifier(mod.modifier_id)}
                                    color={Colors.primary}
                                />
                                <Text style={{flex: 1}}>{mod.modifier_name}</Text>
                                {mod.extra_price > 0 && (
                                    <Text style={{color: '#888', fontSize: 12}}>+{mod.extra_price.toLocaleString()}</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </Surface>
            ))
        )}
        
        <View style={{height: 20}} />

        <Button 
            mode="contained" 
            onPress={handleSave} 
            loading={isSaving}
            style={styles.saveBtn}
            contentStyle={{height: 50}}
            icon="content-save"
        >
            {isEditMode ? "LƯU THAY ĐỔI" : "TẠO MÓN MỚI"}
        </Button>
        <View style={{height: 50}} />

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6F8' },
  content: { padding: 16 },
  
  imageContainer: { position: 'relative' },
  image: { width: 120, height: 120, borderRadius: 12, backgroundColor: '#EEE', borderWidth: 1, borderColor: '#DDD' },
  cameraIcon: {
    position: 'absolute', bottom: -5, right: -5,
    backgroundColor: Colors.primary, padding: 8, borderRadius: 20,
    borderWidth: 2, borderColor: 'white'
  },
  
  section: { padding: 16, borderRadius: 12, backgroundColor: 'white', marginBottom: 20 },
  input: { marginBottom: 12, backgroundColor: 'white' },
  
  sectionTitle: { fontWeight: 'bold', marginBottom: 10, color: '#444', marginLeft: 4 },
  
  groupCard: { backgroundColor: 'white', borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  groupHeader: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#FAFAFA' },
  modList: { paddingLeft: 10, paddingVertical: 5 },
  modItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingRight: 10 },
  
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 8 }
});
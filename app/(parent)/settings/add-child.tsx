import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StatusBar, ActivityIndicator, ScrollView, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFamilyStore } from '@/store/familyStore';
import { addChild, getChildren, uploadChildAvatar } from '@/services/childService';
import Toast from 'react-native-toast-message';

export default function AddChildScreen() {
  const router = useRouter();
  const { family, setChildren, setSelectedChildId } = useFamilyStore();

  const [name, setName]     = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Image Picker Error', text2: e.message || 'Failed to pick image.' });
    }
  };

  const handleAdd = async () => {
    if (!name.trim()) { Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please enter a name.' }); return; }
    if (!family)      { Toast.show({ type: 'error', text1: 'Session Error', text2: 'No family found. Please sign in again.' }); return; }
    setLoading(true);
    try {
      const child = await addChild(family.id, name.trim());
      if (avatarUri) {
        await uploadChildAvatar(child.id, avatarUri);
      }
      // Refresh children list
      const updated = await getChildren(family.id);
      setChildren(updated);
      setSelectedChildId(child.id);
      Toast.show({ type: 'success', text1: 'Child Added', text2: `${name.trim()} was successfully added.` });
      router.back();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Add Failed', text2: e.message ?? 'Failed to add child.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />
      <ScrollView className="flex-1 px-8" keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} className="mt-4 mb-8">
          <Text className="text-text-muted text-base">← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View className="items-center mb-8">
          <TouchableOpacity onPress={handlePickImage} className="items-center mb-4">
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} className="w-24 h-24 rounded-full border-2 border-accent" />
            ) : (
              <View className="w-24 h-24 rounded-full bg-accent/20 border border-accent/40 items-center justify-center relative">
                <Text style={{ fontSize: 36 }}>👦</Text>
                <View className="absolute bottom-0 right-0 bg-bg-card rounded-full p-1.5 border-2 border-border">
                  <Text style={{ fontSize: 12 }}>📷</Text>
                </View>
              </View>
            )}
            <Text className="text-accent text-sm font-semibold mt-2">Choose Photo</Text>
          </TouchableOpacity>
          <Text className="text-text-primary text-2xl font-bold">Add a Child</Text>
          <Text className="text-text-muted text-sm text-center mt-1">
            Create a profile to monitor this child's device.
          </Text>
        </View>

        {/* Name input */}
        <Text className="text-text-muted text-sm font-medium mb-2">Child's first name</Text>
        <TextInput
          id="input-new-child-name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Alex"
          placeholderTextColor="#9090A8"
          autoFocus
          className="bg-bg-card border border-border rounded-2xl px-4 py-4 text-text-primary text-base mb-6"
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />

        <TouchableOpacity
          id="btn-confirm-add-child"
          onPress={handleAdd}
          disabled={loading || !name.trim()}
          className={`py-4 rounded-2xl items-center ${name.trim() ? 'bg-accent' : 'bg-bg-elevated'}`}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text className={`font-bold text-base ${name.trim() ? 'text-white' : 'text-text-muted'}`}>
              Add Child
            </Text>
          )}
        </TouchableOpacity>

        <View className="mt-6 bg-bg-card rounded-2xl p-4 border border-border">
          <Text className="text-text-muted text-xs text-center leading-5">
            After adding, you'll generate a pairing code in the child's profile settings, then enter it on the child's device to link it.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

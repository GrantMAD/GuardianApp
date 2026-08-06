import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Alert, Image
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFamilyStore } from '@/store/familyStore';
import { supabase } from '@/services/supabase';
import { getChildren, uploadChildAvatar } from '@/services/childService';
import { generatePairingCode } from '@/services/pairingService';
import { ChildAvatar } from '@/components/ui/ChildAvatar';
import Toast from 'react-native-toast-message';
import BackButton from '@/components/ui/BackButton';

export default function ChildProfileScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const router = useRouter();
  const { family, children, setChildren } = useFamilyStore();

  const child = children.find((c) => c.id === childId);

  const [name, setName]         = useState(child?.name ?? '');
  const [saving, setSaving]     = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);
  const [avatarLoading, setAvatarLoading]   = useState(false);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatarLoading(true);
        const updatedChild = await uploadChildAvatar(child!.id, result.assets[0].uri);
        if (family) {
          const updated = await getChildren(family.id);
          setChildren(updated);
        }
        Toast.show({ type: 'success', text1: 'Photo Updated', text2: 'Avatar changed successfully.' });
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Upload Failed', text2: e.message || 'Failed to upload image.' });
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Name cannot be empty.' }); return; }
    setSaving(true);
    try {
      await supabase.from('children').update({ name: name.trim() }).eq('id', childId);
      if (family) {
        const updated = await getChildren(family.id);
        setChildren(updated);
      }
      Toast.show({ type: 'success', text1: 'Profile Saved', text2: 'Child profile updated successfully.' });
      router.back();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Save Failed', text2: e.message ?? 'Failed to save.' });
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePairing = async () => {
    if (!family || !childId) return;
    setPairingLoading(true);
    try {
      const code = await generatePairingCode(family.id, childId);
      setPairingCode(code);
      Toast.show({ type: 'success', text1: 'Code Generated', text2: 'Pairing code generated successfully.' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Generation Failed', text2: e.message ?? 'Could not generate pairing code.' });
    } finally {
      setPairingLoading(false);
    }
  };

  const handleDeactivate = () => {
    Alert.alert(
      'Deactivate Child',
      `Remove ${child?.name}'s device from this family?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('children').update({ is_active: false }).eq('id', childId);
            if (family) {
              const updated = await getChildren(family.id);
              setChildren(updated);
            }
            Toast.show({ type: 'success', text1: 'Child Deactivated', text2: 'Child profile deactivated.' });
            router.back();
          },
        },
      ]
    );
  };

  if (!child) {
    return (
      <SafeAreaView className="flex-1 bg-bg-primary items-center justify-center">
        <Text className="text-text-muted">Child not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />
      <ScrollView className="flex-1 px-5">
        <BackButton onPress={() => router.back()} />

        {/* Avatar */}
        <View className="items-center mb-6">
          <View className="relative">
            <ChildAvatar name={child.name} avatarUrl={child.avatar_url} size="lg" hideName={true} />
            {avatarLoading && (
              <View className="absolute inset-0 bg-black/50 rounded-full items-center justify-center">
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </View>
          <TouchableOpacity 
            onPress={handlePickImage}
            disabled={avatarLoading}
            className="mt-3 bg-bg-elevated px-4 py-2 rounded-full border border-border flex-row items-center"
          >
            <Text className="text-accent text-sm font-semibold">📷 Change Photo</Text>
          </TouchableOpacity>
          <Text className="text-text-primary text-xl font-bold mt-4">{child.name}</Text>
          <Text className="text-text-muted text-xs mt-0.5">
            {child.is_active ? '✅ Active' : '⚫ Inactive'}
          </Text>
        </View>

        {/* Edit name */}
        <Text className="text-text-muted text-sm font-medium mb-2">Name</Text>
        <TextInput
          id="input-child-name"
          value={name}
          onChangeText={setName}
          className="bg-bg-card border border-border rounded-2xl px-4 py-4 text-text-primary text-base mb-5"
        />

        <TouchableOpacity
          id="btn-save-child"
          onPress={handleSave}
          disabled={saving}
          className="bg-accent py-4 rounded-2xl items-center mb-6"
        >
          {saving ? <ActivityIndicator color="#fff" /> : (
            <Text className="text-white font-bold text-base">Save Changes</Text>
          )}
        </TouchableOpacity>

        {/* Pairing code */}
        <View className="bg-bg-card rounded-2xl p-4 border border-border mb-5">
          <Text className="text-text-primary font-semibold mb-1">Device Pairing Code</Text>
          <Text className="text-text-muted text-xs mb-3">
            Generate a new 6-digit code to link a child device to this profile.
          </Text>
          {pairingCode ? (
            <View className="bg-bg-elevated rounded-xl py-4 items-center mb-3">
              <Text className="text-accent text-4xl font-bold tracking-widest">{pairingCode}</Text>
              <Text className="text-text-muted text-xs mt-1">Expires in 24 hours</Text>
            </View>
          ) : null}
          <TouchableOpacity
            id="btn-gen-pairing"
            onPress={handleGeneratePairing}
            disabled={pairingLoading}
            className="border border-accent/40 rounded-xl py-3 items-center"
          >
            {pairingLoading ? <ActivityIndicator color="#7C6AF5" /> : (
              <Text className="text-accent font-semibold text-sm">
                {pairingCode ? 'Regenerate Code' : 'Generate Pairing Code'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Device info */}
        {(child.device_name || child.os_type) && (
          <View className="bg-bg-card rounded-2xl p-4 border border-border mb-5">
            <Text className="text-text-primary font-semibold mb-2">Linked Device</Text>
            <Text className="text-text-muted text-sm">📱 {child.device_name ?? 'Unknown device'}</Text>
            <Text className="text-text-muted text-sm capitalize">💻 {child.os_type ?? 'Unknown OS'}</Text>
          </View>
        )}

        {/* Deactivate */}
        <TouchableOpacity
          id="btn-deactivate-child"
          onPress={handleDeactivate}
          className="border border-danger/40 rounded-2xl py-4 items-center mb-8"
        >
          <Text className="text-danger font-semibold">Deactivate Child Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

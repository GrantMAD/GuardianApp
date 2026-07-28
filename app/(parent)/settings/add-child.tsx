import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StatusBar, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFamilyStore } from '@/store/familyStore';
import { addChild, getChildren } from '@/services/childService';

export default function AddChildScreen() {
  const router = useRouter();
  const { family, setChildren, setSelectedChildId } = useFamilyStore();

  const [name, setName]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleAdd = async () => {
    if (!name.trim()) { setError('Please enter a name.'); return; }
    if (!family)      { setError('No family found. Please sign in again.'); return; }
    setLoading(true);
    setError('');
    try {
      const child = await addChild(family.id, name.trim());
      // Refresh children list
      const updated = await getChildren(family.id);
      setChildren(updated);
      setSelectedChildId(child.id);
      router.back();
    } catch (e: any) {
      setError(e.message ?? 'Failed to add child.');
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
          <View className="w-20 h-20 rounded-full bg-accent/20 border border-accent/40 items-center justify-center mb-4">
            <Text style={{ fontSize: 36 }}>👦</Text>
          </View>
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

        {error ? (
          <View className="bg-danger/20 border border-danger/40 rounded-xl p-3 mb-4">
            <Text className="text-danger text-sm">{error}</Text>
          </View>
        ) : null}

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

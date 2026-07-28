import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

interface ChildAvatarProps {
  name: string;
  avatarUrl?: string | null;
  isActive?: boolean;
  isSelected?: boolean;
  onPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function ChildAvatar({ name, avatarUrl, isActive, isSelected, onPress, size = 'md' }: ChildAvatarProps) {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  const initial = name.charAt(0).toUpperCase();

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container onPress={onPress} className="items-center mr-4">
      <View className={`rounded-full ${sizeMap[size]} border-2 ${isSelected ? 'border-accent' : 'border-transparent'} items-center justify-center bg-bg-elevated relative`}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} className="w-full h-full rounded-full" />
        ) : (
          <Text className="text-text-primary font-bold text-lg">{initial}</Text>
        )}
        {isActive !== undefined && (
          <View className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border border-bg-primary ${isActive ? 'bg-success' : 'bg-text-muted'}`} />
        )}
      </View>
      <Text className={`mt-1 text-xs font-medium ${isSelected ? 'text-accent' : 'text-text-muted'}`}>
        {name}
      </Text>
    </Container>
  );
}

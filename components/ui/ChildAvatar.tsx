import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

interface ChildAvatarProps {
  name: string;
  avatarUrl?: string | null;
  isActive?: boolean;
  isSelected?: boolean;
  onPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
  hideName?: boolean;
}

export function ChildAvatar({ name, avatarUrl, isActive, isSelected, onPress, size = 'md', hideName = false }: ChildAvatarProps) {
  const { isDark } = useAppTheme();
  
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  const initial = name.length > 0 ? name.charAt(0).toUpperCase() : '?';
  const Container = onPress ? TouchableOpacity : View;

  // Generate a vibrant color based on the child's name
  const hue = (name.length > 0 ? name.charCodeAt(0) * 137.508 : 0) % 360;
  const lightnessBg = isDark ? '25%' : '85%';
  const lightnessText = isDark ? '85%' : '30%';
  const bgStyle = { backgroundColor: `hsl(${hue}, 80%, ${lightnessBg})` };
  const textStyle = { color: `hsl(${hue}, 80%, ${lightnessText})` };

  return (
    <Container onPress={onPress} className="items-center">
      <View 
        className={`rounded-full ${sizeMap[size]} ${isSelected ? 'border-[3px] border-accent' : 'border-[3px] border-transparent'} items-center justify-center relative`}
        style={!avatarUrl ? bgStyle : undefined}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} className="w-full h-full rounded-full" />
        ) : (
          <Text className="font-bold text-xl" style={textStyle}>{initial}</Text>
        )}
        {isActive !== undefined && (
          <View className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-bg-primary ${isActive ? 'bg-success' : 'bg-text-muted'}`} />
        )}
      </View>
      {!hideName && (
        <Text className={`mt-1 text-xs font-medium ${isSelected ? 'text-accent' : 'text-text-muted'}`}>
          {name}
        </Text>
      )}
    </Container>
  );
}

import React from 'react';
import { View, Text } from 'react-native';
import { BaseToastProps } from 'react-native-toast-message';

export const toastConfig = {
  success: (props: BaseToastProps) => (
    <View className="bg-bg-elevated border-l-4 border-success rounded-xl shadow-sm px-4 py-3 w-[90%] flex-row items-center mt-2">
      <View className="flex-1">
        <Text className="text-text-primary font-bold text-sm">{props.text1}</Text>
        {props.text2 ? <Text className="text-text-muted text-xs mt-0.5">{props.text2}</Text> : null}
      </View>
    </View>
  ),
  error: (props: BaseToastProps) => (
    <View className="bg-bg-elevated border-l-4 border-danger rounded-xl shadow-sm px-4 py-3 w-[90%] flex-row items-center mt-2">
      <View className="flex-1">
        <Text className="text-text-primary font-bold text-sm">{props.text1}</Text>
        {props.text2 ? <Text className="text-text-muted text-xs mt-0.5">{props.text2}</Text> : null}
      </View>
    </View>
  ),
  info: (props: BaseToastProps) => (
    <View className="bg-bg-elevated border-l-4 border-accent rounded-xl shadow-sm px-4 py-3 w-[90%] flex-row items-center mt-2">
      <View className="flex-1">
        <Text className="text-text-primary font-bold text-sm">{props.text1}</Text>
        {props.text2 ? <Text className="text-text-muted text-xs mt-0.5">{props.text2}</Text> : null}
      </View>
    </View>
  ),
};

import React from 'react';
import { View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ visible, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View className="flex-1 bg-black/50 justify-center items-center px-5">
          <TouchableWithoutFeedback>
            <View className="bg-bg-card border border-border w-full rounded-2xl p-5 shadow-lg">
              <Text className="text-text-primary text-xl font-bold mb-2">{title}</Text>
              <Text className="text-text-muted text-base mb-6">{message}</Text>
              <View className="flex-row justify-end gap-3">
                <TouchableOpacity onPress={onCancel} className="px-4 py-2 rounded-xl border border-border">
                  <Text className="text-text-primary font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { onConfirm(); onCancel(); }} className="px-4 py-2 bg-danger rounded-xl">
                  <Text className="text-white font-medium">Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

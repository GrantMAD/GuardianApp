import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { PermissionRequest } from '@/services/permissionRequestService';

interface PermissionRequestCardProps {
  request: PermissionRequest;
  onApprove: (minutes: number) => void;
  onDeny: () => void;
}

export function PermissionRequestCard({ request, onApprove, onDeny }: PermissionRequestCardProps) {
  const isExtraTime = request.request_type === 'extra_time';
  const childName = request.children?.name ?? 'Child';
  const appName = request.installed_apps?.app_name ?? 'an app';

  return (
    <View className="bg-bg-card border border-warning/40 rounded-2xl p-4 mb-3">
      {/* Header */}
      <View className="flex-row items-center mb-2">
        <View className="w-8 h-8 rounded-full bg-warning/20 items-center justify-center mr-2">
          <Text>{isExtraTime ? '⏱️' : '🔓'}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-text-primary font-semibold text-sm">
            {childName}
          </Text>
          <Text className="text-text-muted text-xs">
            {isExtraTime
              ? `Wants ${request.extra_minutes ?? 'some'}m extra time on ${appName}`
              : `Wants to unblock ${appName}`}
          </Text>
        </View>
      </View>

      {/* Message */}
      {request.message && (
        <View className="bg-bg-elevated rounded-xl p-3 mb-3">
          <Text className="text-text-muted text-xs italic">"{request.message}"</Text>
        </View>
      )}

      {/* Actions */}
      <View className="flex-row gap-x-2">
        <TouchableOpacity
          onPress={onDeny}
          className="flex-1 py-2 rounded-xl border border-border items-center"
        >
          <Text className="text-danger font-semibold text-sm">Deny</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onApprove(request.extra_minutes ?? 15)}
          className="flex-1 py-2 rounded-xl bg-accent items-center"
        >
          <Text className="text-white font-semibold text-sm">Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

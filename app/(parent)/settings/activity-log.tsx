import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StatusBar, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFamilyStore } from '@/store/familyStore';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getAuditLog, AuditLogEntry } from '@/services/auditService';

export default function ActivityLogScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { family } = useFamilyStore();
  
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async () => {
    if (!family) return;
    try {
      const data = await getAuditLog(family.id, 50);
      setLogs(data);
    } catch (err) {
      console.warn('Failed to load activity log:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [family]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit'
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bgPrimary} />
      
      {/* Header */}
      <View className="flex-row items-center px-5 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
          <Text className="text-text-primary text-xl">←</Text>
        </TouchableOpacity>
        <Text className="text-text-primary text-2xl font-bold">Activity Log</Text>
      </View>
      
      <View className="px-5 mb-4">
        <Text className="text-text-muted text-sm">
          A history of rule changes and settings adjustments for your family.
        </Text>
      </View>

      {/* List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#7C6AF5" />
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C6AF5" />}
          ListEmptyComponent={
            <View className="items-center justify-center mt-20">
              <Text className="text-4xl mb-4">📋</Text>
              <Text className="text-text-primary font-bold text-lg mb-2">No activity yet</Text>
              <Text className="text-text-muted text-center max-w-[250px]">
                When you create rules or change settings, they will appear here.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-bg-card border border-border rounded-xl p-4 mb-3">
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 mr-2">
                  <Text className="text-text-primary font-bold">{item.action}</Text>
                </View>
                <Text className="text-text-muted text-xs">{formatDate(item.created_at)}</Text>
              </View>
              {item.details && (
                <Text className="text-text-muted text-sm">{item.details}</Text>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

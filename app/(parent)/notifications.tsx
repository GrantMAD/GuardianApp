import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { useFamilyStore } from '@/store/familyStore';

interface NotificationLog {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  sent_at: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { family } = useFamilyStore();
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    if (!family) return;
    try {
      const { data, error } = await supabase
        .from('notifications_log')
        .select('*')
        .eq('family_id', family.id)
        .eq('target_role', 'parent')
        .order('sent_at', { ascending: false })
        .limit(50);
        
      if (!error && data) {
        setNotifications(data as NotificationLog[]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async () => {
    if (!family) return;
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length > 0) {
      await supabase
        .from('notifications_log')
        .update({ is_read: true })
        .in('id', unreadIds);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [family]);

  useEffect(() => {
    // Mark as read when screen is opened and data is loaded
    if (notifications.some(n => !n.is_read)) {
      markAsRead();
    }
  }, [notifications]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'request_received': return '💬';
      case 'limit_warning': return '⚠️';
      case 'app_blocked': return '🔒';
      case 'daily_report': return '📊';
      default: return '🔔';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />
      
      {/* Header */}
      <View className="flex-row items-center px-5 py-4 border-b border-border">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-bg-elevated rounded-full items-center justify-center mr-3"
        >
          <Text className="text-text-primary text-lg">←</Text>
        </TouchableOpacity>
        <Text className="text-text-primary text-xl font-bold">Notifications</Text>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C6AF5" />}
      >
        {loading ? (
          <ActivityIndicator color="#7C6AF5" className="mt-10" />
        ) : notifications.length === 0 ? (
          <View className="mt-20 items-center px-5">
            <Text className="text-4xl mb-4">📭</Text>
            <Text className="text-text-primary text-lg font-semibold mb-2">All caught up!</Text>
            <Text className="text-text-muted text-center text-sm">
              You don't have any notifications right now.
            </Text>
          </View>
        ) : (
          <View className="px-5 pt-4">
            {notifications.map(notif => (
              <View 
                key={notif.id} 
                className={`flex-row p-4 mb-3 rounded-2xl border ${notif.is_read ? 'bg-bg-card border-border' : 'bg-bg-elevated border-accent/30'}`}
              >
                <View className="w-10 h-10 rounded-full bg-bg-primary items-center justify-center mr-3">
                  <Text className="text-xl">{getIconForType(notif.type)}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-text-primary font-semibold mb-1">{notif.title}</Text>
                  <Text className="text-text-muted text-sm leading-5">{notif.body}</Text>
                  <Text className="text-text-muted/60 text-xs mt-2">
                    {new Date(notif.sent_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </Text>
                </View>
                {!notif.is_read && (
                  <View className="w-2 h-2 rounded-full bg-accent mt-2" />
                )}
              </View>
            ))}
            <View className="h-10" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

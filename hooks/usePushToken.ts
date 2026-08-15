import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { useFamilyStore } from '@/store/familyStore';

export function usePushToken() {
  const { role, childId } = useAuthStore();
  const { family } = useFamilyStore();

  useEffect(() => {
    async function registerForPushNotificationsAsync() {
      if (!Device.isDevice) return;
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;
      
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      if (role === 'parent' && family?.id) {
        await supabase.from('families').update({ push_token: token }).eq('id', family.id);
      } else if (role === 'child' && childId) {
        await supabase.from('children').update({ push_token: token }).eq('id', childId);
      }
    }

    if ((role === 'parent' && family?.id) || (role === 'child' && childId)) {
      registerForPushNotificationsAsync();
    }
  }, [role, childId, family?.id]);
}

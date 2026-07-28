import { supabase } from './supabase';

export interface AppNotification {
  id: string;
  family_id: string;
  child_id: string | null;
  target_role: 'parent' | 'child';
  type: string;
  title: string;
  body: string;
  data: any;
  is_read: boolean;
  sent_at: string;
}

export async function getNotifications(familyId: string, limit = 50) {
  const { data, error } = await supabase
    .from('notifications_log')
    .select('*')
    .eq('family_id', familyId)
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as AppNotification[];
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications_log')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) throw error;
}

export async function getUnreadCount(familyId: string) {
  const { count, error } = await supabase
    .from('notifications_log')
    .select('*', { count: 'exact', head: true })
    .eq('family_id', familyId)
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
}

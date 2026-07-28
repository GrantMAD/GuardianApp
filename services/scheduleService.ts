import { supabase } from './supabase';
import type { Schedule } from '@/utils/scheduleEvaluator';

export async function getSchedules(childId: string) {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('child_id', childId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Schedule[];
}

export async function createSchedule(
  schedule: Omit<Schedule, 'id' | 'is_active'>
) {
  const { data, error } = await supabase
    .from('schedules')
    .insert(schedule)
    .select()
    .single();

  if (error) throw error;
  return data as Schedule;
}

export async function deleteSchedule(scheduleId: string) {
  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', scheduleId);

  if (error) throw error;
}

export async function toggleSchedule(scheduleId: string, isActive: boolean) {
  const { error } = await supabase
    .from('schedules')
    .update({ is_active: isActive })
    .eq('id', scheduleId);

  if (error) throw error;
}

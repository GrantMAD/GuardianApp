import { supabase } from './supabase';
import type { Schedule } from '@/utils/scheduleEvaluator';
import { logParentAction } from './auditService';

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

  try {
    const { data: child } = await supabase.from('children').select('family_id').eq('id', schedule.child_id).single();
    if (child?.family_id) {
      await logParentAction(child.family_id, 'SCHEDULE_CREATED', `Created a new schedule: ${schedule.name}`, schedule.child_id);
    }
  } catch (e) {
    console.warn('Failed to log SCHEDULE_CREATED', e);
  }

  return data as Schedule;
}

export async function deleteSchedule(scheduleId: string) {
  let familyId = null;
  let childId = null;
  let scheduleName = '';
  try {
    const { data: sched } = await supabase.from('schedules').select('child_id, name').eq('id', scheduleId).single();
    if (sched?.child_id) {
      childId = sched.child_id;
      scheduleName = sched.name;
      const { data: child } = await supabase.from('children').select('family_id').eq('id', childId).single();
      familyId = child?.family_id;
    }
  } catch (e) {
    console.warn('Failed to fetch schedule info for audit logging', e);
  }

  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', scheduleId);

  if (error) throw error;

  if (familyId) {
    await logParentAction(familyId, 'SCHEDULE_REMOVED', `Deleted a schedule: ${scheduleName}`, childId);
  }
}

export async function toggleSchedule(scheduleId: string, isActive: boolean) {
  let familyId = null;
  let childId = null;
  try {
    const { data: sched } = await supabase.from('schedules').select('child_id').eq('id', scheduleId).single();
    if (sched?.child_id) {
      childId = sched.child_id;
      const { data: child } = await supabase.from('children').select('family_id').eq('id', childId).single();
      familyId = child?.family_id;
    }
  } catch (e) {
    console.warn('Failed to fetch schedule info for audit logging', e);
  }

  const { error } = await supabase
    .from('schedules')
    .update({ is_active: isActive })
    .eq('id', scheduleId);

  if (error) throw error;

  if (familyId) {
    await logParentAction(familyId, 'SCHEDULE_UPDATED', `Toggled a schedule ${isActive ? 'on' : 'off'}`, childId);
  }
}

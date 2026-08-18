import { supabase } from './supabase';

export interface RewardTask {
  id: string;
  child_id: string;
  title: string;
  description: string | null;
  reward_minutes: number;
  status: 'pending' | 'awaiting_approval' | 'completed' | 'cancelled';
  app_id: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  installed_apps?: {
    app_name: string;
    icon_url: string | null;
  } | null;
}

export interface CreateRewardTaskPayload {
  child_id: string;
  title: string;
  description?: string;
  reward_minutes: number;
  app_id?: string;
}

export async function getTasks(childId: string): Promise<RewardTask[]> {
  const { data, error } = await supabase
    .from('reward_tasks')
    .select('*, installed_apps(app_name, icon_url)')
    .eq('child_id', childId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as RewardTask[];
}

export async function createTask(payload: CreateRewardTaskPayload): Promise<RewardTask | null> {
  const { data, error } = await supabase
    .from('reward_tasks')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data as RewardTask;
}

export async function updateTaskStatus(
  taskId: string, 
  status: 'pending' | 'awaiting_approval' | 'completed' | 'cancelled'
): Promise<void> {
  const updatePayload: any = { status };
  if (status === 'completed') {
    updatePayload.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('reward_tasks')
    .update(updatePayload)
    .eq('id', taskId);

  if (error) throw error;
}

export async function getTodayCompletedTaskMinutes(childId: string): Promise<Record<string, number>> {
  const today = new Date().toISOString().slice(0, 10);
  
  const { data, error } = await supabase
    .from('reward_tasks')
    .select('reward_minutes, app_id')
    .eq('child_id', childId)
    .eq('status', 'completed')
    .gte('completed_at', `${today}T00:00:00Z`);

  if (error) throw error;

  const result: Record<string, number> = {};
  for (const task of data || []) {
    const key = task.app_id || 'any';
    result[key] = (result[key] || 0) + (task.reward_minutes || 0);
  }

  return result;
}

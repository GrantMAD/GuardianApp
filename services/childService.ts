import { supabase } from './supabase';

export interface Family {
  id: string;
  parent_id: string;
  name: string;
  timezone: string;
}

export interface Child {
  id: string;
  family_id: string;
  name: string;
  date_of_birth: string | null;
  avatar_url: string | null;
  pin_hash: string | null;
  device_id: string | null;
  device_name: string | null;
  os_type: 'android' | 'ios' | null;
  os_version: string | null;
  push_token: string | null;
  is_active: boolean;
  last_seen_at: string | null;
}

export async function createFamily(name: string, timezone: string = 'UTC') {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('families')
    .insert({ parent_id: user.user.id, name, timezone })
    .select()
    .single();

  if (error) throw error;
  return data as Family;
}

export async function getFamily() {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;

  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('parent_id', user.user.id)
    .maybeSingle();

  if (error) throw error;
  return data as Family | null;
}

export async function getChildren(familyId: string) {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('family_id', familyId)
    .order('name');

  if (error) throw error;
  return data as Child[];
}

export async function addChild(familyId: string, name: string) {
  const { data, error } = await supabase
    .from('children')
    .insert({ family_id: familyId, name })
    .select()
    .single();

  if (error) throw error;
  return data as Child;
}

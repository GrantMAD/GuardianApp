import { supabase } from './supabase';
import { logParentAction } from './auditService';

export interface Family {
  id: string;
  parent_id: string;
  name: string;
  timezone: string;
  has_completed_onboarding: boolean;
  theme: 'light' | 'dark';
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
  emergency_pin_hash: string | null;
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

export async function updateFamilyTheme(familyId: string, theme: 'light' | 'dark') {
  const { data, error } = await supabase
    .from('families')
    .update({ theme })
    .eq('id', familyId)
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

  try {
    await logParentAction(familyId, 'CHILD_ADDED', `Added child profile for ${name}`, data.id);
  } catch (e) {
    console.warn('Failed to log CHILD_ADDED', e);
  }

  return data as Child;
}

export async function uploadChildAvatar(childId: string, imageUri: string) {
  // Convert local URI to Blob
  const response = await fetch(imageUri);
  const blob = await response.blob();

  // Create unique filename
  const ext = imageUri.split('.').pop() || 'jpg';
  const fileName = `${childId}-${Date.now()}.${ext}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, blob, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  // Update child record
  const { data, error: updateError } = await supabase
    .from('children')
    .update({ avatar_url: publicUrl })
    .eq('id', childId)
    .select()
    .single();

  if (updateError) throw updateError;
  return data as Child;
}

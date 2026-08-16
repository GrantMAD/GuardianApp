import { supabase } from './supabase';

export interface AuditLogEntry {
  id: string;
  family_id: string;
  child_id?: string | null;
  action: string;
  details?: string | null;
  created_at: string;
}

export async function logParentAction(
  familyId: string,
  action: string,
  details: string | null = null,
  childId: string | null = null
): Promise<void> {
  if (!familyId) return;

  try {
    const { error } = await supabase.from('parent_audit_log').insert({
      family_id: familyId,
      action,
      details,
      child_id: childId,
    });
    if (error) {
      console.warn('Supabase error logging parent action:', error);
    }
  } catch (error) {
    console.warn('Failed to log parent action:', error);
  }
}

export async function getAuditLog(familyId: string, limit: number = 50): Promise<AuditLogEntry[]> {
  if (!familyId) return [];

  try {
    const { data, error } = await supabase
      .from('parent_audit_log')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch audit log:', error);
    return [];
  }
}

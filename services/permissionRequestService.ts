import { supabase } from './supabase';

export interface PermissionRequest {
  id: string;
  child_id: string;
  app_id: string | null;
  request_type: 'extra_time' | 'unblock';
  extra_minutes: number | null;
  message: string | null;
  status: 'pending' | 'approved' | 'denied';
  approved_minutes: number | null;
  responded_at: string | null;
  created_at: string;
  // joined fields
  children?: { name: string; avatar_url: string | null };
  installed_apps?: { app_name: string; icon_url: string | null };
}

export async function getTodayApprovedExtraMinutes(childId: string): Promise<Record<string, number>> {
  const today = new Date().toISOString().slice(0, 10);
  
  const { data, error } = await supabase
    .from('permission_requests')
    .select('app_id, approved_minutes, created_at')
    .eq('child_id', childId)
    .eq('status', 'approved')
    .gte('created_at', `${today}T00:00:00.000Z`)
    .lt('created_at', `${today}T23:59:59.999Z`);
    
  if (error || !data) return {};
  
  return data.reduce((acc, req) => {
    const key = req.app_id || 'any';
    acc[key] = (acc[key] || 0) + (req.approved_minutes ?? 0);
    return acc;
  }, {} as Record<string, number>);
}

export async function getPendingRequests(familyId: string): Promise<PermissionRequest[]> {
  // To get pending requests for a family, we can query by children's family_id
  const { data, error } = await supabase
    .from('permission_requests')
    .select(`
      *,
      children!inner(name, avatar_url, family_id),
      installed_apps(app_name, icon_url)
    `)
    .eq('children.family_id', familyId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Error fetching pending requests:', error);
    return [];
  }
  
  return data as unknown as PermissionRequest[];
}

export async function updateRequestStatus(requestId: string, status: 'approved' | 'denied', approvedMinutes: number | null = null): Promise<boolean> {
  const { error } = await supabase
    .from('permission_requests')
    .update({ 
      status, 
      approved_minutes: approvedMinutes,
      responded_at: new Date().toISOString()
    })
    .eq('id', requestId);
    
  if (error) {
    console.error('Error updating request status:', error);
    return false;
  }
  return true;
}

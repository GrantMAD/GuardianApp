import { supabase } from './supabase';

/**
 * Calls the generate_pairing_code Postgres RPC to create a new 6-character
 * alphanumeric code for linking a child device. Code expires in 24 hours.
 */
export async function generatePairingCode(familyId: string, childId: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_pairing_code', {
    p_family_id: familyId,
    p_child_id:  childId,
  });

  if (error) throw error;
  return data as string;
}

/**
 * Calls the consume_pairing_code Postgres RPC to validate the code,
 * create a child device record, and return { child_id, family_id }.
 */
export async function consumePairingCode(
  pairingCode: string,
  deviceName: string,
  osType: 'android' | 'ios',
  deviceId: string = 'web-device',
) {
  const { data, error } = await supabase.rpc('consume_pairing_code', {
    p_code:        pairingCode,
    p_device_name: deviceName,
    p_os_type:     osType,
    p_device_id:   deviceId,
  });

  if (error) throw error;
  return data as { child_id: string; family_id: string };
}

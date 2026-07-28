import { supabase } from './supabase';

/**
 * Invokes the 'generate-pairing-code' edge function
 * to create a new 6-digit code for linking a child device.
 */
export async function generatePairingCode(familyId: string) {
  const { data, error } = await supabase.functions.invoke('generate-pairing-code', {
    body: { familyId },
  });

  if (error) throw error;
  return data.pairingCode as string;
}

/**
 * Invokes the 'child-auth-token' edge function
 * to consume a 6-digit code and get a JWT for the child device.
 */
export async function consumePairingCode(pairingCode: string, deviceName: string, osType: 'android' | 'ios') {
  const { data, error } = await supabase.functions.invoke('child-auth-token', {
    body: { pairingCode, deviceName, osType },
  });

  if (error) throw error;
  return data; // { token: string, childId: string, familyId: string }
}

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar,
  TextInput, ActivityIndicator, Alert, Modal, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { useFamilyStore } from '@/store/familyStore';
import {
  getLocationProfiles,
  createLocationProfile,
  deleteLocationProfile,
  LocationProfile,
} from '@/services/locationProfileService';
import BackButton from '@/components/ui/BackButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import Toast from 'react-native-toast-message';
import * as Location from 'expo-location';

export default function LocationsScreen() {
  const router = useRouter();
  const { selectedChildId, children } = useFamilyStore();
  const selectedChild = children.find((c) => c.id === selectedChildId);

  const [profiles, setProfiles] = useState<LocationProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form state
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState(200);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!selectedChildId) return;
    setLoading(true);
    try {
      const data = await getLocationProfiles(selectedChildId);
      setProfiles(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [selectedChildId]);

  const handleUseCurrentLocation = async () => {
    setFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Location permission is required.' });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLat(pos.coords.latitude.toFixed(6));
      setLng(pos.coords.longitude.toFixed(6));
      Toast.show({ type: 'success', text1: 'Location Set', text2: 'Current coordinates captured.' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Failed', text2: e.message ?? 'Could not get location.' });
    } finally {
      setFetchingLocation(false);
    }
  };

  const handleSave = async () => {
    if (!selectedChildId) return;
    if (!name.trim()) { Toast.show({ type: 'error', text1: 'Name required' }); return; }
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) {
      Toast.show({ type: 'error', text1: 'Invalid coordinates', text2: 'Use "Use Current Location" or enter manually.' });
      return;
    }
    setSaving(true);
    try {
      await createLocationProfile(selectedChildId, name.trim(), latNum, lngNum, radius);
      Toast.show({ type: 'success', text1: 'Profile Created', text2: `"${name}" location saved.` });
      setShowForm(false);
      setName(''); setLat(''); setLng(''); setRadius(200);
      load();
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Failed', text2: e.message ?? 'Could not save profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (profile: LocationProfile) => {
    Alert.alert(
      'Delete Location',
      `Remove "${profile.name}"? Rules scoped to this location will become global.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            await deleteLocationProfile(profile.id);
            Toast.show({ type: 'success', text1: 'Deleted', text2: `"${profile.name}" removed.` });
            load();
          },
        },
      ]
    );
  };

  const radiusLabel = (r: number) =>
    r >= 1000 ? `${(r / 1000).toFixed(1)} km` : `${r} m`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F14' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />
      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }}>
        <BackButton onPress={() => router.back()} />

        <Text style={{ color: '#E8E8F0', fontSize: 24, fontWeight: '700', marginBottom: 4 }}>
          📍 Location Profiles
        </Text>
        {selectedChild && (
          <Text style={{ color: '#9090A8', fontSize: 14, marginBottom: 20 }}>
            Rules that activate automatically based on where {selectedChild.name} is.
          </Text>
        )}

        {/* Info card */}
        <View
          style={{
            backgroundColor: 'rgba(124,106,245,0.08)',
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: 'rgba(124,106,245,0.25)',
            marginBottom: 20,
          }}
        >
          <Text style={{ color: '#9090A8', fontSize: 13, lineHeight: 20 }}>
            💡 Create named places (e.g. "School", "Home") with a GPS coordinate and radius.
            Then scope any rule to a location — it will only apply when the child is inside that zone.
            Rules without a location scope apply everywhere.
          </Text>
        </View>

        {/* Add button */}
        <TouchableOpacity
          id="btn-add-location"
          onPress={() => setShowForm(true)}
          style={{
            backgroundColor: 'rgba(124,106,245,0.2)',
            borderWidth: 1,
            borderColor: 'rgba(124,106,245,0.4)',
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <Text style={{ color: '#7C6AF5', fontWeight: '700', fontSize: 15 }}>+ Add Location</Text>
        </TouchableOpacity>

        {/* Profiles list */}
        <SectionHeader title={`Saved Locations (${profiles.length})`} icon="🗺️" />

        {loading ? (
          <View style={{ gap: 10, marginTop: 8 }}>
            <Skeleton style={{ height: 80, width: '100%' }} />
            <Skeleton style={{ height: 80, width: '100%' }} />
          </View>
        ) : profiles.length === 0 ? (
          <Text style={{ color: '#9090A8', textAlign: 'center', paddingVertical: 24 }}>
            No locations added yet.
          </Text>
        ) : (
          profiles.map((p) => (
            <View
              key={p.id}
              style={{
                backgroundColor: '#1A1A2E',
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: '#2A2A3E',
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#E8E8F0', fontWeight: '700', fontSize: 15 }}>
                  📍 {p.name}
                </Text>
                <Text style={{ color: '#9090A8', fontSize: 12, marginTop: 3 }}>
                  {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)} · {radiusLabel(p.radius_meters)} radius
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(p)}>
                <Text style={{ color: '#F87171', fontSize: 13, fontWeight: '600' }}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Add Location Modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.6)',
          }}
        >
          <View
            style={{
              backgroundColor: '#141420',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              borderTopWidth: 1,
              borderColor: '#2A2A3E',
            }}
          >
            <Text style={{ color: '#E8E8F0', fontSize: 18, fontWeight: '700', marginBottom: 20 }}>
              New Location Profile
            </Text>

            <Text style={{ color: '#9090A8', fontSize: 13, marginBottom: 6 }}>Location Name</Text>
            <TextInput
              id="input-location-name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. School, Home, Grandma's"
              placeholderTextColor="#5A5A6E"
              style={{
                backgroundColor: '#1A1A2E',
                borderWidth: 1,
                borderColor: '#2A2A3E',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: '#E8E8F0',
                fontSize: 15,
                marginBottom: 16,
              }}
            />

            <TouchableOpacity
              id="btn-use-current-location"
              onPress={handleUseCurrentLocation}
              disabled={fetchingLocation}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(124,106,245,0.15)',
                borderWidth: 1,
                borderColor: 'rgba(124,106,245,0.3)',
                borderRadius: 12,
                paddingVertical: 12,
                marginBottom: 12,
                gap: 8,
              }}
            >
              {fetchingLocation
                ? <ActivityIndicator color="#7C6AF5" />
                : <Text style={{ color: '#7C6AF5', fontWeight: '700' }}>📍 Use Current Location</Text>}
            </TouchableOpacity>

            {(lat || lng) && (
              <View
                style={{
                  backgroundColor: 'rgba(34,197,94,0.08)',
                  borderRadius: 10,
                  padding: 10,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(34,197,94,0.2)',
                }}
              >
                <Text style={{ color: '#4ADE80', fontSize: 12 }}>
                  📌 {parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)}
                </Text>
              </View>
            )}

            {/* Manual lat/lng inputs */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              <TextInput
                value={lat}
                onChangeText={setLat}
                placeholder="Latitude"
                placeholderTextColor="#5A5A6E"
                keyboardType="numeric"
                style={{
                  flex: 1,
                  backgroundColor: '#1A1A2E',
                  borderWidth: 1,
                  borderColor: '#2A2A3E',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: '#E8E8F0',
                  fontSize: 13,
                }}
              />
              <TextInput
                value={lng}
                onChangeText={setLng}
                placeholder="Longitude"
                placeholderTextColor="#5A5A6E"
                keyboardType="numeric"
                style={{
                  flex: 1,
                  backgroundColor: '#1A1A2E',
                  borderWidth: 1,
                  borderColor: '#2A2A3E',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: '#E8E8F0',
                  fontSize: 13,
                }}
              />
            </View>

            <Text style={{ color: '#9090A8', fontSize: 13, marginBottom: 4 }}>
              Radius: <Text style={{ color: '#7C6AF5', fontWeight: '700' }}>{radiusLabel(radius)}</Text>
            </Text>
            <Slider
              style={{ width: '100%', height: 36 }}
              minimumValue={50}
              maximumValue={2000}
              step={50}
              value={radius}
              onValueChange={setRadius}
              minimumTrackTintColor="#7C6AF5"
              maximumTrackTintColor="#2A2A3E"
              thumbTintColor="#7C6AF5"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ color: '#5A5A6E', fontSize: 11 }}>50 m</Text>
              <Text style={{ color: '#5A5A6E', fontSize: 11 }}>2 km</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => { setShowForm(false); setName(''); setLat(''); setLng(''); setRadius(200); }}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: '#2A2A3E',
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#9090A8', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                id="btn-save-location"
                onPress={handleSave}
                disabled={saving}
                style={{
                  flex: 1,
                  backgroundColor: '#7C6AF5',
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ color: '#fff', fontWeight: '700' }}>Save Location</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

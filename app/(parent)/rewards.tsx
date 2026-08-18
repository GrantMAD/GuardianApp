import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar, TextInput, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFamilyStore } from '@/store/familyStore';
import { getTasks, createTask, updateTaskStatus, RewardTask } from '@/services/rewardTaskService';
import { getRules } from '@/services/ruleService';
import { logParentAction } from '@/services/auditService';
import { getInstalledApps, InstalledApp } from '@/services/usageService';
import { Skeleton } from '@/components/ui/Skeleton';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function RewardsScreen() {
  const { selectedChildId, children, family } = useFamilyStore();
  const [tasks, setTasks] = useState<RewardTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minutes, setMinutes] = useState(15);
  const [appId, setAppId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [apps, setApps] = useState<InstalledApp[]>([]);

  const selectedChild = children.find((c) => c.id === selectedChildId);

  const load = async () => {
    if (!selectedChildId) return;
    setLoading(true);
    try {
      const [data, fetchedApps, rules] = await Promise.all([
        getTasks(selectedChildId),
        getInstalledApps(selectedChildId),
        getRules(selectedChildId)
      ]);
      setTasks(data);
      
      const timeLimitRules = (rules || []).filter(rule => rule.rule_type === 'TIME_LIMIT');
      const timeLimitedApps = (fetchedApps || []).filter(app => 
        timeLimitRules.some(rule => rule.app_id === app.id || rule.category === app.category)
      );
      
      setApps(timeLimitedApps);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [selectedChildId]);

  const handleSave = async () => {
    if (!selectedChildId || !title.trim() || !family) return;
    setSaving(true);
    try {
      await createTask({
        child_id: selectedChildId,
        title: title.trim(),
        description: description.trim(),
        reward_minutes: minutes,
        app_id: appId || undefined,
      });
      await logParentAction(family.id, 'REWARD_TASK_CREATED', `Created a new task: ${title.trim()}`);
      setShowForm(false);
      setTitle('');
      setDescription('');
      setMinutes(15);
      setAppId('');
      await load();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save task.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (task: RewardTask, status: 'pending' | 'completed' | 'cancelled') => {
    if (!family) return;
    try {
      await updateTaskStatus(task.id, status);
      await logParentAction(family.id, 'REWARD_TASK_UPDATED', `Updated task ${task.title} status to ${status}`);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status } : t));
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to update task status.');
    }
  };

  const awaitingTasks = tasks.filter(t => t.status === 'awaiting_approval');
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />
      <ScrollView className="flex-1 px-5">
        <Text className="text-text-primary text-2xl font-bold pt-4 pb-1">🎁 Rewards</Text>
        {selectedChild && (
          <Text className="text-text-muted text-sm mb-4">Assign tasks for {selectedChild.name} to earn bonus screen time.</Text>
        )}

        <TouchableOpacity
          onPress={() => setShowForm(!showForm)}
          className="bg-accent/20 border border-accent/40 rounded-2xl p-4 items-center mb-6"
        >
          <Text className="text-accent font-semibold text-base">{showForm ? 'Cancel' : '➕ Add Task'}</Text>
        </TouchableOpacity>

        {showForm && (
          <View className="bg-bg-card rounded-2xl p-4 border border-border mb-6">
            <Text className="text-text-primary font-bold mb-2">New Task</Text>
            
            <Text className="text-text-muted text-xs mb-1">Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Do homework"
              placeholderTextColor="#666"
              className="bg-bg-elevated border border-border rounded-xl px-4 py-3 text-text-primary mb-3"
            />
            
            <Text className="text-text-muted text-xs mb-1">Description (optional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Additional details..."
              placeholderTextColor="#666"
              className="bg-bg-elevated border border-border rounded-xl px-4 py-3 text-text-primary mb-3"
            />
            
            <Text className="text-text-muted text-xs mb-1">Target App (optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 flex-row">
              <TouchableOpacity
                onPress={() => setAppId('')}
                className={`mr-2 rounded-xl px-4 py-2 border ${!appId ? 'bg-accent/20 border-accent/40' : 'bg-bg-elevated border-border'}`}
              >
                <Text className={!appId ? 'text-accent font-semibold text-xs' : 'text-text-muted text-xs'}>Any App</Text>
              </TouchableOpacity>
              {apps.map(app => (
                <TouchableOpacity
                  key={app.id}
                  onPress={() => setAppId(app.id)}
                  className={`mr-2 rounded-xl px-4 py-2 border flex-row items-center gap-2 ${appId === app.id ? 'bg-accent/20 border-accent/40' : 'bg-bg-elevated border-border'}`}
                >
                  <Text className={appId === app.id ? 'text-accent font-semibold text-xs' : 'text-text-muted text-xs'}>{app.app_name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text className="text-text-muted text-xs mb-1">Reward (minutes)</Text>
            <View className="flex-row gap-x-2 mb-4">
              {[15, 30, 45, 60].map(mins => (
                <TouchableOpacity
                  key={mins}
                  onPress={() => setMinutes(mins)}
                  className={`flex-1 rounded-lg py-2 items-center ${
                    minutes === mins ? 'bg-accent/20 border border-accent/40' : 'bg-bg-elevated border border-border'
                  }`}
                >
                  <Text className={minutes === mins ? 'text-accent font-semibold text-xs' : 'text-text-muted text-xs'}>
                    {mins}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving || !title.trim()}
              className={`rounded-xl py-3 items-center ${
                saving || !title.trim() ? 'bg-accent/50' : 'bg-accent'
              }`}
            >
              {saving ? (
                <ActivityIndicator color="#0F0F14" />
              ) : (
                <Text className="text-bg-primary font-bold text-base">Save Task</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View className="mt-4 gap-y-3">
            <Skeleton style={{ height: 72, width: '100%' }} />
            <Skeleton style={{ height: 72, width: '100%' }} />
          </View>
        ) : (
          <>
            {/* Awaiting Approval */}
            {awaitingTasks.length > 0 && (
              <>
                <SectionHeader title={`Needs Approval (${awaitingTasks.length})`} icon="👀" />
                {awaitingTasks.map(t => (
                  <View key={t.id} className="bg-accent/10 rounded-2xl p-4 border border-accent/30 mb-3">
                    <Text className="text-text-primary font-semibold text-base">{t.title}</Text>
                    {t.description && <Text className="text-text-muted text-sm mt-1">{t.description}</Text>}
                    <Text className="text-accent font-semibold text-sm mt-2">Reward: {t.reward_minutes} min {t.installed_apps ? `for ${t.installed_apps.app_name}` : 'for any app'}</Text>
                    
                    <View className="flex-row gap-x-3 mt-4">
                      <TouchableOpacity
                        onPress={() => handleStatusUpdate(t, 'completed')}
                        className="flex-1 bg-success/20 border border-success/30 rounded-xl py-2 items-center"
                      >
                        <Text className="text-success font-semibold text-sm">Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleStatusUpdate(t, 'pending')}
                        className="flex-1 bg-danger/10 border border-danger/20 rounded-xl py-2 items-center"
                      >
                        <Text className="text-danger font-semibold text-sm">Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Pending */}
            <SectionHeader title={`Pending Tasks (${pendingTasks.length})`} icon="⏳" />
            {pendingTasks.length === 0 ? (
              <Text className="text-text-muted text-sm text-center py-4">No pending tasks</Text>
            ) : (
              pendingTasks.map(t => (
                <View key={t.id} className="bg-bg-card rounded-2xl p-4 border border-border mb-3 flex-row items-center justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="text-text-primary font-semibold text-base">{t.title}</Text>
                    {t.description && <Text className="text-text-muted text-xs mt-0.5" numberOfLines={1}>{t.description}</Text>}
                    <Text className="text-accent font-semibold text-xs mt-1">Reward: {t.reward_minutes} min {t.installed_apps ? `for ${t.installed_apps.app_name}` : 'for any app'}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleStatusUpdate(t, 'cancelled')}>
                    <Text className="text-text-muted text-sm font-medium">Cancel</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* Completed */}
            {completedTasks.length > 0 && (
              <>
                <SectionHeader title={`Completed (${completedTasks.length})`} icon="✅" />
                {completedTasks.map(t => (
                  <View key={t.id} className="bg-bg-card/50 rounded-2xl p-4 border border-border/50 mb-3 opacity-70">
                    <Text className="text-text-primary font-semibold text-base line-through">{t.title}</Text>
                    <Text className="text-text-muted text-xs mt-1">Granted {t.reward_minutes} min {t.installed_apps ? `for ${t.installed_apps.app_name}` : 'for any app'}</Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

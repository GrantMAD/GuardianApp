import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StatusBar, ActivityIndicator, RefreshControl, TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFamilyStore } from '@/store/familyStore';
import { getWeeklyUsage } from '@/services/reportService';
import { UsageBarChart } from '@/components/ui/UsageBarChart';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatCard } from '@/components/ui/StatCard';
import { formatMinutes } from '@/utils/formatTime';
import { CATEGORY_COLORS } from '@/constants/categories';

export default function ReportsScreen() {
  const { selectedChildId, children } = useFamilyStore();
  const selectedChild = children.find((c) => c.id === selectedChildId);

  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<7 | 30>(7);
  const [weekData, setWeekData]   = useState<{ date: string; label: string; total: number; data: any[] }[]>([]);
  const [expandedDates, setExpandedDates] = useState<string[]>([]);

  const toggleDate = (date: string) => {
    setExpandedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  };

  const load = async () => {
    if (!selectedChildId) return;
    setLoading(true);
    try {
      const d = new Date();
      d.setDate(d.getDate() - (timeRange - 1));
      const startDate = d.toISOString().slice(0, 10);
      
      const usageData = await getWeeklyUsage(selectedChildId, startDate, timeRange);
      
      const days: { date: string; label: string; total: number; data: any[] }[] = [];
      for (let i = timeRange - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const date  = d.toISOString().slice(0, 10);
        const label = i === 0 ? 'Today' : d.toLocaleDateString('en', { weekday: 'short' });
        
        const dayData = usageData.find(u => u.date === date);
        days.push({ 
          date, 
          label, 
          total: dayData?.total_minutes ?? 0, 
          data: dayData?.logs ?? [] 
        });
      }
      setWeekData(days);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [selectedChildId, timeRange]);

  const totalWeekMins = weekData.reduce((sum, d) => sum + d.total, 0);
  const avgDailyMins  = weekData.length ? Math.round(totalWeekMins / weekData.length) : 0;
  const peakDay       = weekData.reduce((best, d) => d.total > best.total ? d : best, { date: '', label: '-', total: 0, data: [] });

  const weekBarData = weekData.map((d) => ({ label: d.label, minutes: d.total }));

  // Top apps across the whole week
  const appTotals: Record<string, { label: string; minutes: number; color: string }> = {};
  weekData.forEach((day) => {
    day.data.forEach((u: any) => {
      const name = u.installed_apps?.app_name ?? 'Unknown';
      const cat  = u.installed_apps?.category ?? 'other';
      if (!appTotals[name]) {
        appTotals[name] = { label: name, minutes: 0, color: CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] ?? '#7C6AF5' };
      }
      appTotals[name].minutes += u.usage_minutes;
    });
  });
  const topApps = Object.values(appTotals).sort((a, b) => b.minutes - a.minutes).slice(0, 5);

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" />
      <ScrollView
        className="flex-1 px-5"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#7C6AF5" />}
      >
        <View className="flex-row items-end justify-between">
          <View className="flex-1 mr-4">
            <Text className="text-text-primary text-2xl font-bold pt-4 pb-1">📈 Reports</Text>
            {selectedChild && (
              <Text className="text-text-muted text-sm mb-5">Review screen time and app usage for {selectedChild.name} over the last {timeRange} days.</Text>
            )}
          </View>
          <View className="flex-row bg-bg-elevated rounded-xl p-1 mb-5">
            <TouchableOpacity 
              onPress={() => setTimeRange(7)}
              className={`px-3 py-1.5 rounded-lg ${timeRange === 7 ? 'bg-bg-card shadow-sm border border-border/50' : ''}`}
            >
              <Text className={`text-xs font-semibold ${timeRange === 7 ? 'text-text-primary' : 'text-text-muted'}`}>7d</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setTimeRange(30)}
              className={`px-3 py-1.5 rounded-lg ${timeRange === 30 ? 'bg-bg-card shadow-sm border border-border/50' : ''}`}
            >
              <Text className={`text-xs font-semibold ${timeRange === 30 ? 'text-text-primary' : 'text-text-muted'}`}>30d</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color="#7C6AF5" className="mt-12" size="large" />
        ) : (
          <>
            {/* Summary stats */}
            <View className="flex-row gap-x-3 mb-1">
              <StatCard label="This week" value={formatMinutes(totalWeekMins)} />
              <StatCard label="Daily avg" value={formatMinutes(avgDailyMins)} />
            </View>
            <View className="flex-row gap-x-3 mb-2">
              <StatCard label="Peak day" value={peakDay.label} />
              <StatCard label="Peak time" value={formatMinutes(peakDay.total)} />
            </View>

            {/* Daily breakdown chart */}
            <SectionHeader 
              title="Daily Screen Time" 
              icon="📊" 
              description="Total device usage for each day over the past week."
            />
            <View className="bg-bg-card rounded-2xl p-4 border border-border mb-4">
              {weekBarData.every((d) => d.minutes === 0) ? (
                <Text className="text-text-muted text-sm text-center py-4">No usage data for this period.</Text>
              ) : (
                <UsageBarChart data={weekBarData} />
              )}
            </View>

            {/* Top apps */}
            <SectionHeader 
              title="Top Apps This Week" 
              icon="📱" 
              description="The most used applications by total duration."
            />
            {topApps.length === 0 ? (
              <View className="bg-bg-card rounded-2xl p-6 border border-border items-center mb-4">
                <Text className="text-text-muted text-sm">No app data yet.</Text>
              </View>
            ) : (
              <View className="bg-bg-card rounded-2xl p-4 border border-border mb-4">
                <UsageBarChart data={topApps} />
              </View>
            )}

            {/* Per-day breakdown */}
            <SectionHeader 
              title="Day by Day" 
              icon="📅" 
              description="Detailed usage breakdown for individual days."
            />
            {weekData.map((day) => {
              const isExpanded = expandedDates.includes(day.date);
              return (
                <View key={day.date} className="bg-bg-card rounded-2xl border border-border mb-3 overflow-hidden">
                  <TouchableOpacity
                    onPress={() => toggleDate(day.date)}
                    className={`flex-row justify-between items-center p-4 ${isExpanded ? 'border-b border-border/50 mb-2' : ''}`}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center gap-x-2">
                      <Text className="text-text-primary font-semibold">{day.label}</Text>
                      <Text className="text-text-muted text-xs">{isExpanded ? '▲' : '▼'}</Text>
                    </View>
                    <Text className="text-accent font-bold">{formatMinutes(day.total)}</Text>
                  </TouchableOpacity>
                  
                  {isExpanded && (
                    <View className="px-4 pb-4">
                      {day.data.length > 0 ? (
                        <UsageBarChart
                          data={day.data.slice(0, 4).map((u: any) => ({
                            label: u.installed_apps?.app_name ?? 'App',
                            minutes: u.usage_minutes,
                            color: CATEGORY_COLORS[u.installed_apps?.category as keyof typeof CATEGORY_COLORS] ?? '#7C6AF5',
                          }))}
                          maxMinutes={day.total}
                        />
                      ) : (
                        <Text className="text-text-muted text-xs">No usage</Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
            <View className="h-8" />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useData } from '../src/lib/DataContext';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InsightsScreen() {
  const { intentions, logs, refresh, loading } = useData();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);

  const completedCount = logs.filter((l) => l.completed).length;
  const missedCount = logs.filter((l) => !l.completed).length;
  const totalCount = intentions.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Category performance analyzer
  const categories = useMemo(() => {
    const data = {
      work: { completed: 0, total: 0 },
      health: { completed: 0, total: 0 },
      learning: { completed: 0, total: 0 },
      personal: { completed: 0, total: 0 },
    };

    intentions.forEach((item) => {
      const cat = item.category as keyof typeof data;
      if (data[cat] !== undefined) {
        data[cat].total++;
        const log = logs.find((l) => l.intentionId === item.id);
        if (log?.completed) {
          data[cat].completed++;
        }
      }
    });

    return Object.entries(data).map(([name, val]) => {
      const rate = val.total > 0 ? Math.round((val.completed / val.total) * 100) : 0;
      return { name, ...val, rate };
    });
  }, [intentions, logs]);

  // Client-side AI Insights Generator
  const aiFeedback = useMemo(() => {
    const list = [];
    if (intentions.length === 0 || logs.length === 0) return [];

    // Milestone celebration
    if (completedCount >= 10) {
      list.push({
        title: '🚀 Double Digits Achieved!',
        desc: "You've completed 10+ intentions! You are building solid momentum. The gap is closing.",
        type: 'celebration',
        icon: '🎉',
        color: '#fbbf24',
      });
    } else if (completedCount >= 5) {
      list.push({
        title: '🎯 First 5 Victories!',
        desc: "You've completed 5 intentions! Your willpower momentum is starting to accumulate.",
        type: 'celebration',
        icon: '✨',
        color: '#60a5fa',
      });
    }

    // Willpower leakage detection (Low completion rate)
    if (completionRate < 40) {
      list.push({
        title: '⚠️ Willpower Leakage Detected',
        desc: `Your completion rate is currently low (${completionRate}%). You may be over-planning or scheduling tasks during energy drains. Try scheduling just 2 focus tasks tomorrow.`,
        type: 'alert',
        icon: '🔋',
        color: '#ef4444',
      });
    }

    // Category Struggles
    categories.forEach((cat) => {
      if (cat.rate < 40 && cat.total >= 3) {
        list.push({
          title: `📊 ${cat.name.toUpperCase()} Gap Warning`,
          desc: `You are completing only ${cat.rate}% of tasks in ${cat.name}. This is currently a vulnerability in your cognitive stack.`,
          type: 'warning',
          icon: '📉',
          color: '#fb923c',
        });
      }
    });

    // Healthy momentum recommendation
    if (completionRate >= 75 && totalCount >= 5) {
      list.push({
        title: '🔥 High-Integrity Alignment',
        desc: 'Exceptional consistency! You are planning realistically and keeping promises. Your self-trust credit rating is in excellent standing.',
        type: 'success',
        icon: '🛡️',
        color: '#10b981',
      });
    }

    return list;
  }, [intentions, logs, completionRate, completedCount, categories]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>AI Insights</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        {/* Ring Gauge Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>ALIGNMENT SCORE</Text>
          <Text style={styles.summaryRate}>{completionRate}%</Text>
          <Text style={styles.summaryDesc}>
            Completed {completedCount} out of {totalCount} scheduled intentions.
          </Text>
        </View>

        {/* Category Consistency Section */}
        <Text style={styles.sectionTitle}>Category Consistency</Text>
        <View style={styles.categoriesCard}>
          {categories.map((cat) => (
            <View key={cat.name} style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryName}>{cat.name.toUpperCase()}</Text>
                <Text style={styles.categoryValue}>
                  {cat.completed}/{cat.total} ({cat.rate}%)
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${cat.rate}%`,
                      backgroundColor:
                        cat.rate >= 75
                          ? '#10b981'
                          : cat.rate >= 40
                          ? '#fb923c'
                          : '#ef4444',
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* AI Recommendations */}
        <Text style={styles.sectionTitle}>AI Feedback & Recommendations</Text>
        {aiFeedback.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Insufficient behavioral data.</Text>
            <Text style={styles.emptyDesc}>Schedule more intentions and log results to trigger diagnostic behavioral logs.</Text>
          </View>
        ) : (
          aiFeedback.map((item, idx) => (
            <View key={idx} style={[styles.aiCard, { borderColor: item.color + '22' }]}>
              <View style={styles.aiHeader}>
                <Text style={styles.aiIcon}>{item.icon}</Text>
                <Text style={[styles.aiTitle, { color: item.color }]}>{item.title}</Text>
              </View>
              <Text style={styles.aiDesc}>{item.desc}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#141414',
  },
  backButton: {
    backgroundColor: '#141414',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  backText: { color: '#aaa', fontSize: 13, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  headerRight: { width: 60 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  // Summary Card
  summaryCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  summaryLabel: { color: '#666', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  summaryRate: { color: '#fff', fontSize: 48, fontWeight: '900', marginVertical: 10 },
  summaryDesc: { color: '#888', fontSize: 13, textAlign: 'center' },

  // Categories Card
  sectionTitle: { color: '#fff', fontWeight: '800', fontSize: 18, marginBottom: 14, marginTop: 12 },
  categoriesCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  categoryItem: { marginBottom: 16 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  categoryName: { color: '#aaa', fontWeight: '600', fontSize: 12, letterSpacing: 0.5 },
  categoryValue: { color: '#fff', fontSize: 12, fontWeight: '700' },
  progressBarBg: { height: 6, backgroundColor: '#0a0a0a', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  // AI Feedback Card
  aiCard: {
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  aiIcon: { fontSize: 20 },
  aiTitle: { fontWeight: '800', fontSize: 14, flex: 1 },
  aiDesc: { color: '#aaa', fontSize: 13, lineHeight: 18, paddingLeft: 30 },

  // Empty State
  emptyCard: {
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  emptyText: { color: '#888', fontSize: 14, fontWeight: '600' },
  emptyDesc: { color: '#555', fontSize: 11, textAlign: 'center', marginTop: 6, lineHeight: 16 },
});

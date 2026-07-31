import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useData } from '../src/lib/DataContext';
import { format, parse, startOfWeek, endOfWeek } from 'date-fns';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WeeklyReviewScreen() {
  const { intentions, logs, trustTransactions, refresh } = useData();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);

  // Computations for the current week's metrics
  const weeklyData = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });

    const weekIntentions = intentions.filter((i) => {
      const d = parse(i.date, 'yyyy-MM-dd', new Date());
      return d >= start && d <= end;
    });

    const weekLogs = logs.filter((l) => {
      const d = parse(l.date, 'yyyy-MM-dd', new Date());
      return d >= start && d <= end;
    });

    const weekTx = trustTransactions.filter((t) => {
      const d = parse(t.date, 'yyyy-MM-dd', new Date());
      return d >= start && d <= end;
    });

    const completedCount = weekLogs.filter((l) => l.completed).length;
    const missedCount = weekLogs.filter((l) => !l.completed).length;
    const integrityRate =
      weekIntentions.length > 0 ? Math.round((completedCount / weekIntentions.length) * 100) : 0;

    const netTrustEarned = weekTx.reduce((acc, t) => {
      const amount = t.type === 'deposit' ? Math.abs(t.amount) : -Math.abs(t.amount);
      return acc + amount;
    }, 0);

    // Filter top completed tasks as wins
    const wins = weekLogs
      .filter((l) => l.completed)
      .map((l) => {
        const item = intentions.find((i) => i.id === l.intentionId);
        return item ? item.title : 'Kept promise';
      })
      .slice(0, 3);

    // Filter missed tasks
    const misses = weekIntentions
      .filter((i) => {
        const log = logs.find((l) => l.intentionId === i.id);
        return log && !log.completed;
      })
      .map((i) => i.title)
      .slice(0, 3);

    return {
      integrityRate,
      completedCount,
      missedCount,
      netTrustEarned,
      wins,
      misses,
      weekLogs,
    };
  }, [intentions, logs, trustTransactions]);

  // Correspondence from Future You generator
  const futureYouLetter = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    weeklyData.weekLogs
      .filter((l) => l.completed)
      .forEach((l) => {
        const item = intentions.find((i) => i.id === l.intentionId);
        if (item) {
          categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
        }
      });

    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'general';

    let message = '';
    let categoryTitle = 'Self-Mastery';

    if (topCategory === 'work') {
      categoryTitle = 'Professional Focus';
      message =
        'Because you protected your professional focus blocks and coded/worked consistently even when fatigue pulled at you, our project deliveries are entering deployment smoothly.';
    } else if (topCategory === 'health') {
      categoryTitle = 'Physical Vitality';
      message =
        'Because you showed up for your exercise intentions and treated movement as a non-negotiable priority, I am entering this next week feeling energetic, strong, and centered.';
    } else if (topCategory === 'learning') {
      categoryTitle = 'Cognitive Growth';
      message =
        'Because you logged consistent study blocks and read through pages when procrastination set in, I am starting our placements preparation phase confidently.';
    } else {
      categoryTitle = 'Behavioral Integrity';
      message =
        'Because you kept your daily promises and logged reflections even on difficult friction days, I am living with higher self-trust and clarity.';
    }

    return {
      category: categoryTitle,
      text: message,
    };
  }, [weeklyData, intentions]);

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
        <Text style={styles.title}>Weekly Review</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        {/* Core Weekly Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsSubtitle}>WEEKLY PERFORMANCE</Text>
          <Text style={styles.statsTitle}>{weeklyData.integrityRate}% Integrity</Text>
          <View style={styles.statsBreakdown}>
            <Text style={styles.breakdownText}>✅ {weeklyData.completedCount} Kept</Text>
            <Text style={styles.breakdownText}>❌ {weeklyData.missedCount} Missed</Text>
            <Text
              style={[
                styles.breakdownText,
                { color: weeklyData.netTrustEarned >= 0 ? '#10b981' : '#ef4444' },
              ]}
            >
              🪙 {weeklyData.netTrustEarned >= 0 ? '+' : ''}
              {weeklyData.netTrustEarned} CR
            </Text>
          </View>
        </View>

        {/* Future You Letter */}
        <Text style={styles.sectionTitle}>Envelope from "Future You"</Text>
        <View style={styles.letterCard}>
          <View style={styles.letterHeader}>
            <Text style={styles.letterTag}>POSTMARKED FROM THE FUTURE</Text>
            <Text style={styles.letterSubject}>{futureYouLetter.category}</Text>
          </View>
          <Text style={styles.letterText}>&quot;{futureYouLetter.text}&quot;</Text>
          <Text style={styles.letterSignature}>— Yours truly, Future You</Text>
        </View>

        {/* Wins and Misses Grid */}
        <View style={styles.gridRow}>
          <View style={styles.gridColumn}>
            <Text style={styles.gridTitle}>Top Wins</Text>
            {weeklyData.wins.length === 0 ? (
              <Text style={styles.gridEmpty}>No wins logged yet.</Text>
            ) : (
              weeklyData.wins.map((win, idx) => (
                <View key={idx} style={styles.winItem}>
                  <Text style={styles.itemBullet}>✓</Text>
                  <Text style={styles.itemText} numberOfLines={2}>
                    {win}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.gridColumn}>
            <Text style={styles.gridTitle}>Unresolved Gaps</Text>
            {weeklyData.misses.length === 0 ? (
              <Text style={styles.gridEmpty}>No gaps recorded!</Text>
            ) : (
              weeklyData.misses.map((miss, idx) => (
                <View key={idx} style={styles.missItem}>
                  <Text style={styles.itemBullet}>✗</Text>
                  <Text style={styles.itemText} numberOfLines={2}>
                    {miss}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
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

  // Stats Card
  statsCard: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#222',
    alignItems: 'center',
  },
  statsSubtitle: { color: '#666', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  statsTitle: { color: '#fff', fontSize: 26, fontWeight: '900', marginVertical: 12 },
  statsBreakdown: { flexDirection: 'row', gap: 16, marginTop: 4 },
  breakdownText: { color: '#aaa', fontSize: 13, fontWeight: '600' },

  // Letter from Future You
  sectionTitle: { color: '#fff', fontWeight: '800', fontSize: 18, marginBottom: 14 },
  letterCard: {
    backgroundColor: '#1c1917',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#292524',
  },
  letterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#292524',
    paddingBottom: 10,
    marginBottom: 14,
  },
  letterTag: { color: '#fb923c', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  letterSubject: { color: '#aaa', fontSize: 11, fontWeight: '600' },
  letterText: { color: '#e7e5e4', fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  letterSignature: { color: '#878685', fontSize: 12, marginTop: 14, alignSelf: 'flex-end', fontWeight: '600' },

  // Grid Wins and Gaps
  gridRow: { flexDirection: 'row', gap: 16 },
  gridColumn: { flex: 1, backgroundColor: '#141414', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#222' },
  gridTitle: { color: '#fff', fontWeight: '700', fontSize: 15, marginBottom: 12 },
  gridEmpty: { color: '#555', fontSize: 12, fontStyle: 'italic' },
  winItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  missItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  itemBullet: { fontSize: 14, fontWeight: 'bold' },
  itemText: { color: '#bbb', fontSize: 12, flex: 1, lineHeight: 16 },
});

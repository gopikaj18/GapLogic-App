import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '../../src/lib/SessionContext';
import { useData } from '../../src/lib/DataContext';
import { useState, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';

export default function DashboardScreen() {
  const { user, logout } = useSession();
  const { intentions, logs, refresh, loading } = useData();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const completedCount = logs.filter((l) => l.completed).length;
  const missedCount = logs.filter((l) => !l.completed).length;
  const completionRate =
    intentions.length > 0 ? Math.round((completedCount / intentions.length) * 100) : 0;

  // Simple static estimate for trust transactions if we want to preview balance
  // Deposits = +15 for completed, withdrawals = -20 for missed, base is 100
  const selfTrustBalance = useMemo(() => {
    let balance = 100;
    logs.forEach((log) => {
      if (log.completed) {
        balance += 15;
      } else {
        balance -= 20;
      }
    });
    return Math.max(0, balance);
  }, [logs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
    >
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>GapLogic</Text>
          <Text style={styles.subtitle}>Hi, {user?.name || 'User'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Self Trust HUD Card */}
      <TouchableOpacity style={styles.trustCard} onPress={() => router.push('/trust-bank' as any)}>
        <View style={styles.trustCardHeader}>
          <Text style={styles.trustLabel}>SELF-TRUST CREDIT</Text>
          <Text style={styles.trustCardBrand}>GAP CARD</Text>
        </View>
        <Text style={styles.trustBalance}>{selfTrustBalance} CR</Text>
        <View style={styles.trustCardFooter}>
          <Text style={styles.trustNumber}>•••• •••• •••• {user?.id ? user.id.slice(-4).toUpperCase() : '0000'}</Text>
          <Text style={styles.trustAction}>View Ledger →</Text>
        </View>
      </TouchableOpacity>

      {/* Primary Stats Grid */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{loading ? '—' : `${completionRate}%`}</Text>
          <Text style={styles.statLabel}>Completion</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>{completedCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>{missedCount}</Text>
          <Text style={styles.statLabel}>Missed</Text>
        </View>
      </View>

      {/* Features Action Menu */}
      <Text style={styles.sectionTitle}>Daily Practices</Text>
      <View style={styles.menuGrid}>
        <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/(tabs)/modeler')}>
          <Text style={styles.menuIcon}>🎯</Text>
          <Text style={styles.menuTitle}>Model Intentions</Text>
          <Text style={styles.menuDesc}>Plan blocks</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/(tabs)/focus')}>
          <Text style={styles.menuIcon}>⚡</Text>
          <Text style={styles.menuTitle}>Start Focus</Text>
          <Text style={styles.menuDesc}>Record reality</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/journal' as any)}>
          <Text style={styles.menuIcon}>📖</Text>
          <Text style={styles.menuTitle}>Daily Journal</Text>
          <Text style={styles.menuDesc}>Log gratitude</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuCard} onPress={() => router.push('/insights' as any)}>
          <Text style={styles.menuIcon}>📊</Text>
          <Text style={styles.menuTitle}>AI Insights</Text>
          <Text style={styles.menuDesc}>Willpower stats</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.wideMenuCard} onPress={() => router.push('/weekly-review' as any)}>
        <View style={styles.wideMenuLeft}>
          <Text style={styles.wideMenuIcon}>📅</Text>
          <View>
            <Text style={styles.wideMenuTitle}>Weekly Review</Text>
            <Text style={styles.wideMenuDesc}>Future You letter & weekly metrics</Text>
          </View>
        </View>
        <Text style={styles.wideMenuArrow}>→</Text>
      </TouchableOpacity>

      {/* Recent Activity */}
      <View style={styles.recentHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Text style={styles.recentHint}>Pull down to refresh</Text>
      </View>

      {intentions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No intentions scheduled yet.</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/(tabs)/modeler')}>
            <Text style={styles.emptyButtonText}>Add your first intention</Text>
          </TouchableOpacity>
        </View>
      ) : (
        intentions.slice(0, 5).map((intention) => {
          const log = logs.find((l) => l.intentionId === intention.id);
          return (
            <View key={intention.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{intention.title}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: log?.completed
                        ? '#064e3b'
                        : log
                        ? '#7f1d1d'
                        : '#1e3a8a',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: log?.completed
                          ? '#34d399'
                          : log
                          ? '#f87171'
                          : '#60a5fa',
                      },
                    ]}
                  >
                    {log?.completed ? 'Completed' : log ? 'Missed' : 'Pending'}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>
                {intention.category.toUpperCase()} • {intention.date} at {intention.scheduledTime}
              </Text>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 24,
  },
  title: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  subtitle: { color: '#888', fontSize: 14, marginTop: 4 },
  logoutButton: {
    backgroundColor: '#1c1917',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#292524',
  },
  logoutText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },

  // Trust Card (Credit Card Design)
  trustCard: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#3b82f6',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 5,
  },
  trustCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trustLabel: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  trustCardBrand: { color: '#fff', fontSize: 12, fontWeight: '800', fontStyle: 'italic' },
  trustBalance: { color: '#fff', fontSize: 32, fontWeight: '900', marginVertical: 14 },
  trustCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  trustNumber: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 12, fontFamily: 'monospace' },
  trustAction: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Primary Stats Row
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  statValue: { fontSize: 22, fontWeight: '900', color: '#fff' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 6, fontWeight: '600', textTransform: 'uppercase' },

  // Menu Grid
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  menuCard: {
    width: '48%',
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  menuIcon: { fontSize: 24, marginBottom: 8 },
  menuTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  menuDesc: { color: '#666', fontSize: 11, marginTop: 4 },

  // Wide Menu Card
  wideMenuCard: {
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
    marginVertical: 12,
  },
  wideMenuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wideMenuIcon: { fontSize: 24 },
  wideMenuTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  wideMenuDesc: { color: '#666', fontSize: 11, marginTop: 2 },
  wideMenuArrow: { color: '#888', fontSize: 18, fontWeight: 'bold' },

  // Section Headers
  sectionTitle: { color: '#fff', fontWeight: '800', fontSize: 18, marginBottom: 14 },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  recentHint: { fontSize: 11, color: '#444' },

  // Empty State
  emptyCard: {
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  emptyText: { color: '#888', fontSize: 14, marginBottom: 16 },
  emptyButton: { backgroundColor: '#3b82f6', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  emptyButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  // Cards (Activity)
  card: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  cardMeta: { color: '#666', fontSize: 11, marginTop: 8, fontWeight: '600' },
});

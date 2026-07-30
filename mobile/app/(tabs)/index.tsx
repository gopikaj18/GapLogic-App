import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '../../src/lib/SessionContext';
import { useData } from '../../src/lib/DataContext';
import { useState } from 'react';

export default function DashboardScreen() {
  const { user, logout } = useSession();
  const { intentions, logs, loading, refresh } = useData();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const completedCount = logs.filter((l) => l.completed).length;
  const missedCount = logs.filter((l) => !l.completed).length;
  const completionRate =
    intentions.length > 0 ? Math.round((completedCount / intentions.length) * 100) : 0;

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
      <View style={styles.header}>
        <Text style={styles.title}>GapLogic</Text>
        <Text style={styles.subtitle}>Hi, {user?.name}</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{loading ? '—' : `${completionRate}%`}</Text>
          <Text style={styles.statLabel}>Completion</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{completedCount}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{missedCount}</Text>
          <Text style={styles.statLabel}>Missed</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/modeler')}>
        <Text style={styles.buttonText}>+ Add Intention</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={() => router.push('/(tabs)/focus')}>
        <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Start Focus</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Recent</Text>
      {intentions.slice(0, 8).map((intention) => {
        const log = logs.find((l) => l.intentionId === intention.id);
        return (
          <View key={intention.id} style={styles.card}>
            <Text style={styles.cardTitle}>{intention.title}</Text>
            <Text style={styles.cardMeta}>
              {intention.category} • {log?.completed ? 'Done' : log ? 'Missed' : 'Pending'}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 20, marginTop: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { color: '#888', marginTop: 4 },
  logout: { color: '#ef4444', marginTop: 8, fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4 },
  button: { backgroundColor: '#3b82f6', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 10 },
  buttonSecondary: { backgroundColor: '#1a1a1a' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  buttonTextSecondary: { color: '#3b82f6' },
  sectionTitle: { color: '#fff', fontWeight: 'bold', fontSize: 18, marginTop: 16, marginBottom: 10 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 12, marginBottom: 8 },
  cardTitle: { color: '#fff', fontWeight: '600' },
  cardMeta: { color: '#888', fontSize: 12, marginTop: 4 },
});

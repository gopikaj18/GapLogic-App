import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useData } from '../src/lib/DataContext';
import { apiFetch } from '../src/lib/api';
import { format, parse } from 'date-fns';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

const MOODS = [
  { val: 1, label: '😢' },
  { val: 2, label: '😕' },
  { val: 3, label: '😐' },
  { val: 4, label: '🙂' },
  { val: 5, label: '😀' },
];

export default function ReflectionJournalScreen() {
  const { journalEntries, refresh } = useData();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'write' | 'history'>('write');
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [content, setContent] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [lessons, setLessons] = useState('');
  const [wins, setWins] = useState('');
  const [mood, setMood] = useState<number>(3);

  const today = format(new Date(), 'yyyy-MM-dd');

  // Streak counter (baseline of kept consecutive entries)
  const streak = useMemo(() => {
    if (journalEntries.length === 0) return 0;
    const sorted = [...journalEntries].sort((a, b) => b.date.localeCompare(a.date));
    let currentStreak = 0;
    for (let i = 0; i < sorted.length; i++) {
      const d = parse(sorted[i].date, 'yyyy-MM-dd', new Date());
      const diffDays = Math.round(Math.abs((new Date().getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
      if (diffDays <= currentStreak + 1) {
        currentStreak++;
      } else {
        break;
      }
    }
    return currentStreak;
  }, [journalEntries]);

  const handleSaveEntry = async () => {
    if (!content.trim()) {
      Alert.alert('Empty Content', 'Write down some reflections before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Save entry
      await apiFetch('/api/journal', {
        method: 'POST',
        body: JSON.stringify({
          date: today,
          content: content.trim(),
          gratitude: gratitude.trim(),
          lessons: lessons.trim(),
          wins: wins.trim(),
          mood: Number(mood),
        }),
      });

      // 2. Deposit +8 Self Trust Credit
      await apiFetch('/api/trust', {
        method: 'POST',
        body: JSON.stringify({
          amount: 8,
          type: 'deposit',
          description: 'Logged Daily Journal Entry',
          date: today,
        }),
      });

      await refresh();
      Alert.alert('Journal Logged', 'Your daily reflection is saved and +8 CR has been deposited to your Trust Bank!');
      
      // Clear form
      setContent('');
      setGratitude('');
      setLessons('');
      setWins('');
      setMood(3);
      setActiveTab('history');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save entry');
    } finally {
      setSubmitting(false);
    }
  };

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
        <Text style={styles.title}>Journal</Text>
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>🔥 {streak}d</Text>
        </View>
      </View>

      {/* Segment Control Tab Bar */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'write' && styles.tabActive]}
          onPress={() => setActiveTab('write')}
        >
          <Text style={[styles.tabText, activeTab === 'write' && styles.tabTextActive]}>Write Reflection</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>History</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'write' ? (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.formLabel}>What is on your mind today? *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={content}
              onChangeText={setContent}
              placeholder="Dump your cognitive stack. Write freely about conflicts, patterns, or goals..."
              placeholderTextColor="#555"
              multiline
              numberOfLines={4}
            />

            <Text style={styles.formLabel}>Daily Gratitude</Text>
            <TextInput
              style={styles.input}
              value={gratitude}
              onChangeText={setGratitude}
              placeholder="One thing you are genuinely grateful for..."
              placeholderTextColor="#555"
            />

            <Text style={styles.formLabel}>Lessons Learned</Text>
            <TextInput
              style={styles.input}
              value={lessons}
              onChangeText={setLessons}
              placeholder="What friction occurred, and what did you learn?"
              placeholderTextColor="#555"
            />

            <Text style={styles.formLabel}>Today's Wins</Text>
            <TextInput
              style={styles.input}
              value={wins}
              onChangeText={setWins}
              placeholder="Highlight any wins or kept promises..."
              placeholderTextColor="#555"
            />

            {/* Mood selector */}
            <Text style={styles.formLabel}>Overall Mood</Text>
            <View style={styles.moodRow}>
              {MOODS.map((m) => (
                <TouchableOpacity
                  key={m.val}
                  style={[styles.moodItem, mood === m.val && styles.moodItemActive]}
                  onPress={() => setMood(m.val)}
                >
                  <Text style={styles.moodEmoji}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSaveEntry} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Commit Entry (+8 CR)</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
        >
          {journalEntries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Your journal is empty.</Text>
              <Text style={styles.emptyDesc}>Start writing today to track patterns and maintain your consistency streak.</Text>
            </View>
          ) : (
            journalEntries.map((entry) => (
              <View key={entry.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyDate}>{entry.date}</Text>
                  <Text style={styles.historyMood}>
                    {MOODS.find((m) => m.val === entry.mood)?.label || '😐'}
                  </Text>
                </View>
                <Text style={styles.historyContent}>{entry.content}</Text>
                {entry.gratitude ? (
                  <Text style={styles.historySub}>
                    <Text style={styles.historyLabel}>Gratitude: </Text>
                    {entry.gratitude}
                  </Text>
                ) : null}
                {entry.lessons ? (
                  <Text style={styles.historySub}>
                    <Text style={styles.historyLabel}>Lesson: </Text>
                    {entry.lessons}
                  </Text>
                ) : null}
                {entry.wins ? (
                  <Text style={styles.historySub}>
                    <Text style={styles.historyLabel}>Wins: </Text>
                    {entry.wins}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </ScrollView>
      )}
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
  streakBadge: {
    backgroundColor: '#1c1917',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#292524',
  },
  streakText: { color: '#fb923c', fontWeight: 'bold', fontSize: 13 },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#141414',
    marginHorizontal: 20,
    marginVertical: 14,
    borderRadius: 10,
    padding: 4,
  },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#1e3a8a' },
  tabText: { color: '#888', fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: '#60a5fa' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  formLabel: { color: '#aaa', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222',
    padding: 12,
    color: '#fff',
    fontSize: 14,
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 20 },
  moodItem: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#222',
  },
  moodItemActive: { borderColor: '#3b82f6', backgroundColor: '#1e3a8a' },
  moodEmoji: { fontSize: 20 },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  // History Card
  historyCard: {
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  historyDate: { color: '#888', fontWeight: '700', fontSize: 13 },
  historyMood: { fontSize: 20 },
  historyContent: { color: '#fff', fontSize: 14, lineHeight: 20, marginBottom: 10 },
  historySub: { color: '#aaa', fontSize: 12, marginTop: 4 },
  historyLabel: { color: '#666', fontWeight: '600' },

  // Empty List
  emptyContainer: {
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
    marginTop: 20,
  },
  emptyText: { color: '#888', fontSize: 14, fontWeight: '600' },
  emptyDesc: { color: '#555', fontSize: 11, textAlign: 'center', marginTop: 6, lineHeight: 16 },
});

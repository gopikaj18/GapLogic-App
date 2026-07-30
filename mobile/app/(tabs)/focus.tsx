import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useData } from '../../src/lib/DataContext';
import { addRealityLog } from '../../src/lib/data';
import { Intention } from '../../src/lib/schema';

export default function FocusScreen() {
  const { intentions, refresh } = useData();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [active, setActive] = useState<Intention | null>(null);
  const [completed, setCompleted] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const todayIntentions = useMemo(
    () => intentions.filter((i) => i.date === today),
    [intentions, today]
  );

  const saveOutcome = async () => {
    if (!active) return;
    setSubmitting(true);
    try {
      await addRealityLog({
        intentionId: active.id,
        completed,
        actualEffort: 3,
        frictionNote: '',
        contextNote: '',
        date: today,
      });
      await refresh();
      setActive(null);
      Alert.alert('Saved', 'Session outcome recorded.');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  if (active) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{active.title}</Text>
        <Text style={styles.subtitle}>Record outcome</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Completed?</Text>
          <Switch value={completed} onValueChange={setCompleted} />
        </View>
        <TouchableOpacity style={styles.button} onPress={saveOutcome} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? 'Saving...' : 'Save Outcome'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActive(null)}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Focus</Text>
      <Text style={styles.subtitle}>Pick an intention for today</Text>
      {todayIntentions.length === 0 ? (
        <Text style={styles.empty}>No intentions for today. Add some in Modeler.</Text>
      ) : (
        todayIntentions.map((item) => (
          <TouchableOpacity key={item.id} style={styles.card} onPress={() => setActive(item)}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>{item.scheduledTime} • {item.estimatedDuration} min</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 16 },
  content: { paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  subtitle: { color: '#888', marginBottom: 16 },
  empty: { color: '#666', marginTop: 20 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardTitle: { color: '#fff', fontWeight: '600', fontSize: 16 },
  cardMeta: { color: '#888', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 24 },
  label: { color: '#fff', fontSize: 16 },
  button: { backgroundColor: '#3b82f6', borderRadius: 12, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  cancel: { color: '#888', textAlign: 'center', marginTop: 16 },
});

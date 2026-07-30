import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { format } from 'date-fns';
import { useData } from '../../src/lib/DataContext';
import { addIntention } from '../../src/lib/data';

export default function ModelerScreen() {
  const { intentions, refresh } = useData();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const todayIntentions = intentions.filter((i) => i.date === today);

  const handleAdd = async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Name your intention first.');
      return;
    }
    setSubmitting(true);
    try {
      await addIntention({
        title: title.trim(),
        category: 'work',
        effortEstimate: 3,
        estimatedDuration: 25,
        scheduledTime: format(new Date(), 'HH:mm'),
        date: today,
      });
      await refresh();
      setTitle('');
      Alert.alert('Saved', 'Intention added.');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Modeler</Text>
      <Text style={styles.subtitle}>Plan today&apos;s intentions</Text>

      <TextInput
        style={styles.input}
        placeholder="Intention title"
        placeholderTextColor="#666"
        value={title}
        onChangeText={setTitle}
      />
      <TouchableOpacity style={styles.button} onPress={handleAdd} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Saving...' : 'Add Intention'}</Text>
      </TouchableOpacity>

      <Text style={styles.section}>Today ({todayIntentions.length})</Text>
      {todayIntentions.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardMeta}>{item.category} • {item.scheduledTime}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  subtitle: { color: '#888', marginBottom: 20 },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  button: { backgroundColor: '#3b82f6', borderRadius: 12, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  section: { color: '#fff', fontWeight: 'bold', marginTop: 24, marginBottom: 10 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 12, marginBottom: 8 },
  cardTitle: { color: '#fff', fontWeight: '600' },
  cardMeta: { color: '#888', fontSize: 12, marginTop: 4 },
});

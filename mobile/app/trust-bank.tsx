import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useData } from '../src/lib/DataContext';
import { useState, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TrustBankScreen() {
  const { trustTransactions, refresh, loading } = useData();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Balance calculator (Starting baseline is 100)
  const runningBalance = useMemo(() => {
    const credits = trustTransactions.filter(tx => tx.type === 'deposit').reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
    const debits = trustTransactions.filter(tx => tx.type === 'withdrawal').reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
    return 100 + credits - debits;
  }, [trustTransactions]);

  // Statistics
  const stats = useMemo(() => {
    const deposits = trustTransactions.filter(tx => tx.type === 'deposit').reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
    const withdrawals = trustTransactions.filter(tx => tx.type === 'withdrawal').reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
    return { deposits, withdrawals };
  }, [trustTransactions]);

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
        <Text style={styles.title}>Trust Bank</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        {/* Credit Card */}
        <View style={styles.trustCard}>
          <View style={styles.cardTop}>
            <Text style={styles.cardLabel}>SELF-TRUST CREDIT SYSTEM</Text>
            <Text style={styles.cardBrand}>GAP CARD</Text>
          </View>
          <Text style={styles.cardBalance}>{runningBalance} CR</Text>
          <View style={styles.cardBottom}>
            <Text style={styles.cardNumber}>•••• •••• •••• TRUST</Text>
            <Text style={styles.cardHolder}>INTEGRITY PROFILE</Text>
          </View>
        </View>

        {/* Ledger HUD */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>+{stats.deposits}</Text>
            <Text style={styles.statLabel}>Total Deposits</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>-{stats.withdrawals}</Text>
            <Text style={styles.statLabel}>Total Drafts</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{trustTransactions.length}</Text>
            <Text style={styles.statLabel}>Promises</Text>
          </View>
        </View>

        {/* Ledger List */}
        <Text style={styles.sectionTitle}>Transaction Ledger</Text>
        {trustTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No self-trust transactions recorded.</Text>
            <Text style={styles.emptyDesc}>Keep daily intentions to earn deposits, or miss them to trigger withdrawals.</Text>
          </View>
        ) : (
          trustTransactions.map((tx) => (
            <View key={tx.id} style={styles.ledgerItem}>
              <View style={styles.ledgerLeft}>
                <Text style={styles.ledgerDesc}>{tx.description}</Text>
                <Text style={styles.ledgerDate}>{tx.date} • {tx.type.toUpperCase()}</Text>
              </View>
              <Text
                style={[
                  styles.ledgerAmount,
                  { color: tx.type === 'deposit' ? '#10b981' : '#ef4444' }
                ]}
              >
                {tx.type === 'deposit' ? '+' : '-'}{Math.abs(tx.amount)} CR
              </Text>
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
  headerRight: { width: 60 }, // aligns title to center
  scrollContent: { padding: 20, paddingBottom: 40 },

  // Credit Card Design
  trustCard: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#3b82f6',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
    elevation: 8,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  cardBrand: { color: '#fff', fontSize: 13, fontWeight: '800', fontStyle: 'italic' },
  cardBalance: { color: '#fff', fontSize: 36, fontWeight: '900', marginVertical: 20 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardNumber: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 12, fontFamily: 'monospace' },
  cardHolder: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  // Ledger stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statBox: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  statValue: { fontSize: 18, fontWeight: '900', color: '#fff' },
  statLabel: { fontSize: 10, color: '#666', marginTop: 4, textAlign: 'center', fontWeight: '500' },

  // Ledger List
  sectionTitle: { color: '#fff', fontWeight: '800', fontSize: 18, marginBottom: 14 },
  ledgerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#222',
  },
  ledgerLeft: { flex: 1, marginRight: 16 },
  ledgerDesc: { color: '#fff', fontWeight: '600', fontSize: 14 },
  ledgerDate: { color: '#666', fontSize: 11, marginTop: 4 },
  ledgerAmount: { fontSize: 15, fontWeight: '800' },

  // Empty State
  emptyContainer: {
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

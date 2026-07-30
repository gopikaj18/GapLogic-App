import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SessionProvider } from '../src/lib/SessionContext';
import { DataProvider } from '../src/lib/DataContext';

export default function RootLayout() {
  return (
    <SessionProvider>
      <DataProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0a0a0a' } }} />
      </DataProvider>
    </SessionProvider>
  );
}

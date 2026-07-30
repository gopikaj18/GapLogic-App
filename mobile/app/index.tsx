import { Redirect } from 'expo-router';
import { useSession } from '../src/lib/SessionContext';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { user, loading } = useSession();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' }}>
        <ActivityIndicator color="#3b82f6" size="large" />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

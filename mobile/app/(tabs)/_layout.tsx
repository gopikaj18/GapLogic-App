import { Redirect, Tabs } from 'expo-router';
import { useSession } from '../../src/lib/SessionContext';
import { View, ActivityIndicator } from 'react-native';

export default function TabsLayout() {
  const { user, loading } = useSession();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' }}>
        <ActivityIndicator color="#3b82f6" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111',
          borderTopColor: '#222',
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="modeler" options={{ title: 'Modeler' }} />
      <Tabs.Screen name="focus" options={{ title: 'Focus' }} />
    </Tabs>
  );
}

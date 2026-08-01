import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, BackHandler, Platform, SafeAreaView, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';

// Dev target pointing to Next.js dev server on the host machine's loopback interface
// In production, update this fallback URL or set EXPO_PUBLIC_WEB_URL in .env
const DEV_URL = Platform.OS === 'android' ? 'http://10.0.2.2:9002' : 'http://localhost:9002';
const TARGET_URL = process.env.EXPO_PUBLIC_WEB_URL || DEV_URL;

export default function WebViewScreen() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [key, setKey] = useState(0); // Used to reload WebView on retry

  // Handle Android hardware back button
  useEffect(() => {
    const onBackPress = () => {
      if (webViewRef.current && canGoBack) {
        webViewRef.current.goBack();
        return true; // Prevent default behavior (exiting app)
      }
      return false; // Exit app if cannot go back
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => {
      subscription.remove();
    };
  }, [canGoBack]);

  const handleRetry = () => {
    setHasError(false);
    setLoading(true);
    setKey(prev => prev + 1); // Triggers re-mounting/reload
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar style="light" backgroundColor="#060608" />
      <View style={styles.container}>
        {!hasError ? (
          <WebView
            key={key}
            ref={webViewRef}
            source={{ uri: TARGET_URL }}
            style={styles.webview}
            userAgent="GapLogicMobile"
            onNavigationStateChange={(navState) => {
              setCanGoBack(navState.canGoBack);
              setLoading(navState.loading);
            }}
            onShouldStartLoadWithRequest={(request) => {
              const { url } = request;
              if (url.startsWith('gaplogic-open-browser://') || url.includes('open_external=true')) {
                let realUrl = url;
                if (url.startsWith('gaplogic-open-browser://')) {
                  realUrl = url.substring('gaplogic-open-browser://'.length);
                  if (realUrl.startsWith('http//')) {
                    realUrl = 'http://' + realUrl.substring(6);
                  } else if (realUrl.startsWith('https//')) {
                    realUrl = 'https://' + realUrl.substring(7);
                  }
                }
                Linking.openURL(realUrl).catch((err) =>
                  console.error('Failed to open external URL:', err)
                );
                return false;
              }
              return true;
            }}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setHasError(true);
              setLoading(false);
            }}
            onHttpError={() => {
              setHasError(true);
              setLoading(false);
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loaderText}>Syncing session...</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Connection Failed</Text>
            <Text style={styles.errorDesc}>
              Could not establish connection to the GapLogic server. Ensure Next.js is running at {TARGET_URL}.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Global Loading Overlay */}
        {loading && !hasError && (
          <View style={styles.overlayLoader}>
            <ActivityIndicator size="small" color="#3b82f6" />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#060608',
  },
  container: {
    flex: 1,
    backgroundColor: '#060608',
  },
  webview: {
    flex: 1,
    backgroundColor: '#060608',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#060608',
  },
  loaderText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
    letterSpacing: 0.5,
  },
  overlayLoader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#060608',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  errorDesc: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    maxWidth: 280,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#3b82f6',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

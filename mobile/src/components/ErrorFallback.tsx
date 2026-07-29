import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { FallbackProps } from 'react-error-boundary';

export function ErrorFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size='large' color='#111827' />
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.subtitle}>
        We couldn't load this screen. Please check your connection and try
        again.
      </Text>
      <Pressable style={styles.button} onPress={resetErrorBoundary}>
        <Text style={styles.buttonText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 24,
    gap: 12,
  },
  title: { fontSize: 17, fontWeight: '700', color: '#111827', marginTop: 4 },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});

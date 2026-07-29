import { useState } from 'react';
import {
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';
import { createPost, PostError } from '@/services/post.service';

const MAX_LENGTH = 280;

export default function CreatePostScreen() {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    setError(null);
    if (!text.trim()) {
      setError('Post cannot be empty');
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      await createPost(text, user.id, user.username);
      router.back();
    } catch (err) {
      setError(err instanceof PostError ? err.message : 'Failed to post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.body}>
        <TextInput
          style={styles.input}
          placeholder="What's on your mind?"
          placeholderTextColor='#9CA3AF'
          multiline
          autoFocus
          maxLength={MAX_LENGTH}
          value={text}
          onChangeText={setText}
        />
        <Text style={styles.counter}>
          {text.length}/{MAX_LENGTH}
        </Text>
        {error && <Text style={styles.error}>{error}</Text>}
      </Animated.View>
      <Pressable
        style={styles.postBtn}
        onPress={handlePost}
        disabled={loading || !text.trim()}
      >
        {loading ? (
          <ActivityIndicator size='small' color='#fff' />
        ) : (
          <Text style={styles.postBtnText}>Post</Text>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cancel: { fontSize: 15, color: '#6B7280' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  post: { fontSize: 15, fontWeight: '700', color: '#111827' },
  postDisabled: { color: '#D1D5DB' },
  body: { padding: 20 },
  input: {
    fontSize: 18,
    color: '#111827',
    minHeight: 140,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#11182780',
    borderRadius: 12,
    padding: 12,
  },
  counter: { textAlign: 'right', color: '#9CA3AF', fontSize: 13, marginTop: 8 },
  error: { color: '#DC2626', fontSize: 14, marginTop: 8 },
  postBtn: {
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  postBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});

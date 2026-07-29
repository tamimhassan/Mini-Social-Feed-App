import { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Post } from '@/types/models';
import { getPostById, addComment, PostError } from '@/services/post.service';
import { useAuth } from '@/context/AuthContext';
import PostCard from '@/components/PostCard';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commentInputRef = useRef<TextInput>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPostById(id);
      setPost(result);
    } catch {
      setError('Post not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddComment = async () => {
    if (!commentText.trim() || !user || !post) return;
    setSubmitting(true);
    try {
      await addComment(post.id, commentText, user.id, user.username);
      setCommentText('');
      await load();
    } catch (err) {
      setError(err instanceof PostError ? err.message : 'Failed to comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size='large' color='#111827' />
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Post not found'}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <FlatList
          data={post.comments}
          keyExtractor={(c) => c.id}
          ListHeaderComponent={
            <>
              <PostCard post={post} commentInputRef={commentInputRef} />
              <Text style={styles.commentsLabel}>
                Comments ({post.comments.length})
              </Text>
            </>
          }
          renderItem={({ item }) => (
            <Animated.View entering={FadeIn} style={styles.commentRow}>
              <View style={styles.commentAvatar}>
                <Text style={styles.commentAvatarText}>
                  {item.username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.commentBubble}>
                <Text style={styles.commentUsername}>{item.username}</Text>
                <Text style={styles.commentText}>{item.text}</Text>
              </View>
            </Animated.View>
          )}
          ListEmptyComponent={
            <Text style={styles.noComments}>
              No comments yet — be the first!
            </Text>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.commentInput}
            placeholder='Add a comment...'
            placeholderTextColor='#9CA3AF'
            value={commentText}
            onChangeText={setCommentText}
            ref={commentInputRef}
          />
          <Pressable
            style={[
              styles.sendBtn,
              !commentText.trim() && styles.sendBtnDisabled,
            ]}
            onPress={handleAddComment}
            disabled={submitting || !commentText.trim()}
          >
            {submitting ? (
              <ActivityIndicator size='small' color='#fff' />
            ) : (
              <Text style={styles.sendText}>Send</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', paddingTop: 12 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  errorText: { color: '#6B7280', fontSize: 15 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  commentsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 6,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: { fontWeight: '700', color: '#374151', fontSize: 13 },
  commentBubble: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
  },
  commentUsername: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  commentText: { fontSize: 14, color: '#374151' },
  noComments: { textAlign: 'center', color: '#9CA3AF', marginTop: 20 },
  inputBar: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendBtnDisabled: { backgroundColor: '#D1D5DB' },
  sendText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});

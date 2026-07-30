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
import { observer } from 'mobx-react-lite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { getPostById, addComment, PostError } from '@/services/post.service';
import { TComment } from '@/types/models';
import { useAuth } from '@/context/AuthContext';
import { commentSchema, CommentFormData } from '@/utils/validation';
import { postStore } from '@/stores/PostStore';
import PostCard from '@/components/PostCard';

export default observer(function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [comments, setComments] = useState<TComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const commentInputRef = useRef<TextInput>(null);
  const sendScale = useSharedValue(1);
  const sendAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommentFormData>({
    resolver: yupResolver(commentSchema),
    defaultValues: { text: '' },
  });

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const detail = await getPostById(id);
      const { comments: fetchedComments, ...card } = detail;
      postStore.upsertPost(card);
      setComments(fetchedComments);
    } catch (err) {
      setLoadError(
        err instanceof PostError ? err.message : 'Failed to load post',
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const post = postStore.getPost(id);

  const onSubmitComment = async (data: CommentFormData) => {
    if (!user || !post) return;
    setServerError(null);
    try {
      const comment = await addComment(
        post.id,
        data.text,
        user.id,
        user.username,
      );
      setComments((prev) => [...prev, comment]);
      postStore.incrementCommentCount(post.id);
      reset({ text: '' });
    } catch (err) {
      setServerError(
        err instanceof PostError ? err.message : 'Failed to add comment',
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size='large' color='#111827' />
      </SafeAreaView>
    );
  }

  if (loadError || !post) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{loadError ?? 'Post not found'}</Text>
        <Pressable style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#fff' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.listArea}>
          <FlatList
            data={comments}
            keyExtractor={(c) => c.id}
            keyboardShouldPersistTaps='handled'
            ListHeaderComponent={
              <>
                <PostCard postId={post.id} commentInputRef={commentInputRef} />
                <View style={styles.commentsHeaderRow}>
                  <Text style={styles.commentsTitle}>Comments</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{comments.length}</Text>
                  </View>
                </View>
              </>
            }
            renderItem={({ item, index }) => (
              <Animated.View
                entering={FadeInDown.duration(300)
                  .delay(Math.min(index, 8) * 50)
                  .springify()
                  .damping(16)}
                style={styles.commentRow}
              >
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>
                    {item.user.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.commentBubble}>
                  <Text style={styles.commentUsername}>
                    {item.user.username}
                  </Text>
                  <Text style={styles.commentText}>{item.content}</Text>
                </View>
              </Animated.View>
            )}
            ListEmptyComponent={
              <Animated.View
                entering={FadeInDown.duration(400).springify().damping(14)}
                style={styles.emptyWrap}
              >
                <View style={styles.emptyCircle}>
                  <Text style={[styles.sparkle, styles.sparkleTopLeft]}>✦</Text>
                  <Text style={[styles.sparkle, styles.sparkleTopRight]}>
                    ✦
                  </Text>
                  <Text style={[styles.sparkle, styles.sparkleBottomLeft]}>
                    ✦
                  </Text>
                  <Text style={[styles.sparkle, styles.sparkleBottomRight]}>
                    ✦
                  </Text>
                  <Ionicons
                    name='chatbubble-outline'
                    size={38}
                    color='#9CA3AF'
                  />
                </View>
                <Text style={styles.emptyTitle}>No comments yet</Text>
                <Text style={styles.emptySubtitle}>
                  Be the first to leave a comment.
                </Text>
              </Animated.View>
            }
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>

        <View style={styles.bottomWrap}>
          <View style={styles.inputBar}>
            <View style={styles.commentInputWrap}>
              <Text style={styles.emojiIcon}>🙂</Text>
              <Controller
                control={control}
                name='text'
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.commentInput}
                    placeholder='Add a comment...'
                    placeholderTextColor='#9CA3AF'
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    ref={commentInputRef}
                  />
                )}
              />
            </View>
            <Animated.View style={sendAnimatedStyle}>
              <Pressable
                style={[styles.sendBtn, isSubmitting && styles.sendBtnDisabled]}
                onPress={handleSubmit(onSubmitComment)}
                onPressIn={() => {
                  if (!isSubmitting)
                    sendScale.value = withSpring(0.92, { duration: 100 });
                }}
                onPressOut={() => {
                  sendScale.value = withSpring(1, { duration: 150 });
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size='small' color='#fff' />
                ) : (
                  <Text style={styles.sendText}>Send</Text>
                )}
              </Pressable>
            </Animated.View>
          </View>
          {(errors.text || serverError) && (
            <Animated.Text
              entering={FadeIn.duration(200)}
              style={styles.inlineError}
            >
              {errors.text?.message ?? serverError}
            </Animated.Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  listArea: { flex: 1, backgroundColor: '#F3F4F8' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    gap: 12,
  },
  errorText: { color: '#6B7280', fontSize: 15 },
  retryBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontWeight: '600' },

  commentsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  commentsTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  countBadge: {
    backgroundColor: '#E9EAF1',
    borderRadius: 999,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: { fontSize: 12, fontWeight: '700', color: '#4B5563' },

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

  emptyWrap: { alignItems: 'center', marginTop: 48, paddingHorizontal: 24 },
  emptyCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#E9EAF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  sparkle: { position: 'absolute', color: '#C4B5FD', fontSize: 14 },
  sparkleTopLeft: { top: -6, left: -2 },
  sparkleTopRight: { top: -2, right: -10 },
  sparkleBottomLeft: { bottom: -2, left: -12 },
  sparkleBottomRight: { bottom: -8, right: -4 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },

  bottomWrap: { backgroundColor: '#fff' },
  inputBar: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  commentInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    paddingHorizontal: 14,
  },
  emojiIcon: { fontSize: 16, marginRight: 6 },
  commentInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  sendBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
  },
  sendBtnDisabled: { backgroundColor: '#D1D5DB' },
  sendText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  inlineError: {
    color: '#DC2626',
    fontSize: 13,
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
});

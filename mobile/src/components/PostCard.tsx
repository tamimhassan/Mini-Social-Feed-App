import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import { router, usePathname } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Post } from '../types/models';
import { toggleLike } from '../services/post.service';

interface Props {
  post: Post;
  commentInputRef?: React.RefObject<TextInput | null>;
  onLikeChange?: (
    postId: string,
    likeCount: number,
    likedByMe: boolean,
  ) => void;
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function PostCard({
  post,
  onLikeChange,
  commentInputRef,
}: Props) {
  const [likedByMe, setLikedByMe] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [busy, setBusy] = useState(false);
  const scale = useSharedValue(1);
  const pathname = usePathname();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleLike = async () => {
    if (busy) return;
    setBusy(true);

    const prevLiked = likedByMe;
    const prevCount = likeCount;
    setLikedByMe(!prevLiked);
    setLikeCount(prevCount + (!prevLiked ? 1 : -1));

    scale.value = withSequence(
      withSpring(1.3, { duration: 150 }),
      withSpring(0.95, { duration: 100 }),
      withSpring(1, { duration: 150 }),
    );

    try {
      const result = await toggleLike(post.id);
      setLikedByMe(result.likedByMe);
      setLikeCount(result.likeCount);
      onLikeChange?.(post.id, result.likeCount, result.likedByMe);
    } catch {
      setLikedByMe(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setBusy(false);
    }
  };

  const handleComment = () => {
    if (pathname.includes(post.id)) {
      commentInputRef?.current?.focus();
      return;
    }
    router.push(`/(app)/post/${post.id}`);
  };

  return (
    <Pressable style={styles.card} onPress={handleComment}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {post.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.username}>{post.username}</Text>
          <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
        </View>
      </View>

      <Text style={styles.text}>{post.text}</Text>

      <View style={styles.footer}>
        <Pressable style={styles.actionBtn} onPress={handleLike} hitSlop={8}>
          <Animated.Text
            style={[styles.icon, animatedStyle, likedByMe && styles.liked]}
          >
            {likedByMe ? '❤️' : '🤍'}
          </Animated.Text>
          <Text style={[styles.actionText, likedByMe && styles.likedText]}>
            {likeCount}
          </Text>
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={handleComment} hitSlop={8}>
          <Text style={styles.icon}>💬</Text>
          <Text style={styles.actionText}>{post.comments.length}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  username: { fontWeight: '600', fontSize: 15, color: '#111827' },
  time: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  text: { fontSize: 15, color: '#1F2937', lineHeight: 21, marginBottom: 12 },
  footer: {
    flexDirection: 'row',
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  icon: { fontSize: 16 },
  liked: {},
  actionText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  likedText: { color: '#DC2626' },
});

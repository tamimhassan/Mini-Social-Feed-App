import React, { useState } from 'react';
import { Text, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { observer } from 'mobx-react-lite';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  ZoomIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { toggleLike } from '../services/post.service';
import { postStore } from '../stores/PostStore';

interface Props {
  postId: string;
  commentInputRef?: React.RefObject<TextInput | null>;
  index?: number;
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

const PostCard = observer(function PostCard({
  postId,
  commentInputRef,
  index,
}: Props) {
  const post = postStore.getPost(postId);
  const [busy, setBusy] = useState(false);
  const scale = useSharedValue(1);
  const cardScale = useSharedValue(1);
  const pathname = usePathname();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  if (!post) return null;

  const handleLike = async () => {
    if (busy) return;
    setBusy(true);

    scale.value = withSequence(
      withSpring(1.3, { duration: 150 }),
      withSpring(0.95, { duration: 100 }),
      withSpring(1, { duration: 150 }),
    );

    const prevLiked = post.likedByMe;
    const prevCount = post.likeCount;
    postStore.setLike(post.id, !prevLiked, prevCount + (!prevLiked ? 1 : -1));

    try {
      const result = await toggleLike(post.id);
      postStore.setLike(post.id, result.likedByMe, result.likeCount);
    } catch {
      postStore.setLike(post.id, prevLiked, prevCount);
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
    <Animated.View
      entering={ZoomIn.duration(300)
        .delay(Math.min(index ?? 0, 8) * 50)
        .damping(10)}
    >
      <Animated.View style={cardAnimatedStyle}>
        <Pressable
          style={styles.postCard}
          onPress={handleComment}
          onPressIn={() => {
            cardScale.value = withSpring(0.98, { duration: 100 });
          }}
          onPressOut={() => {
            cardScale.value = withSpring(1, { duration: 150 });
          }}
        >
          <View style={styles.postHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {post.author.username.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.username}>{post.author.username}</Text>
              <Text style={styles.handle}>
                @{post.author.username} · {timeAgo(post.createdAt)}
              </Text>
            </View>
          </View>

          <Text style={styles.postContent}>{post.content}</Text>

          <View style={styles.divider} />

          <View style={styles.pillRow}>
            <Pressable style={styles.pill} onPress={handleLike} hitSlop={8}>
              <Animated.Text style={[styles.pillIcon, animatedStyle]}>
                {post.likedByMe ? '❤️' : '🤍'}
              </Animated.Text>
              <Text style={styles.pillCount}>{post.likeCount}</Text>
              <Text style={styles.pillLabel}>Likes</Text>
            </Pressable>

            <Pressable style={styles.pill} onPress={handleComment}>
              <Ionicons name='chatbubble-outline' size={17} color='#111827' />
              <Text style={styles.pillCount}>{post.commentCount}</Text>
              <Text style={styles.pillLabel}>Comments</Text>
            </Pressable>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 19 },
  username: { fontWeight: '700', fontSize: 17, color: '#111827' },
  handle: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  postContent: { fontSize: 17, color: '#1F2937', lineHeight: 24 },
  divider: {
    height: 1,
    backgroundColor: '#F1F2F6',
    marginTop: 18,
    marginBottom: 14,
  },
  pillRow: { flexDirection: 'row', gap: 12 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  pillIcon: { fontSize: 15 },
  pillCount: { fontWeight: '700', color: '#DC2626', fontSize: 14 },
  pillLabel: { fontSize: 14, color: '#374151' },
});

export default React.memo(PostCard);

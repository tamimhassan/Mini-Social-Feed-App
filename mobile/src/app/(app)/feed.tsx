import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TPostCard } from '@/types/models';
import { getPosts, PostError } from '@/services/post.service';
import { useAuth } from '@/context/AuthContext';
import PostCard from '@/components/PostCard';

export default function FeedScreen() {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState<TPostCard[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadFeed = useCallback(async (username: string, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);
    try {
      const result = await getPosts(null, username);
      setPosts(result.posts);
      setNextCursor(result.nextCursor);
    } catch (err) {
      setPosts([]);
      setNextCursor(null);
      setLoadError(
        err instanceof PostError ? err.message : 'Unable to load feed',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFeed(filter);
    }, [filter, loadFeed]),
  );

  // debounce the username filter so we don't re-fetch every keystroke
  useEffect(() => {
    const timeout = setTimeout(() => {
      loadFeed(filter);
    }, 500);
    return () => clearTimeout(timeout);
  }, [filter]);

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await getPosts(nextCursor, filter);
      setPosts((prev) => [...prev, ...result.posts]);
      setNextCursor(result.nextCursor);
    } catch (err) {
      console.warn(
        'Failed to load more posts:',
        err instanceof Error ? err.message : err,
      );
    } finally {
      setLoadingMore(false);
    }
  };

  const handleLogoutPress = () => {
    Alert.alert('Log out?', "You'll need to log in again to see your feed.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Feed</Text>
          <Text style={styles.greeting}>Hi, {user?.username} 👋</Text>
        </View>
        <Pressable
          onPress={handleLogoutPress}
          hitSlop={8}
          style={styles.logoutBtn}
        >
          <Ionicons name='log-out-outline' size={18} color='#DC2626' />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons
          name='search-outline'
          size={18}
          color='#9CA3AF'
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.search}
          placeholder='Filter by username...'
          placeholderTextColor='#9CA3AF'
          value={filter}
          onChangeText={setFilter}
          autoCapitalize='none'
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size='large' color='#111827' />
        </View>
      ) : loadError ? (
        <Animated.View entering={FadeIn} style={styles.centered}>
          <Text style={styles.emptyText}>{loadError}</Text>
          <Pressable style={styles.retryBtn} onPress={() => loadFeed(filter)}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </Animated.View>
      ) : posts.length === 0 ? (
        <Animated.View entering={FadeIn} style={styles.centered}>
          <Text style={styles.emptyText}>No posts found</Text>
        </Animated.View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} />}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 140 }}
          removeClippedSubviews={Platform.OS === 'android'}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadFeed(filter, true)}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={{ marginVertical: 16 }} />
            ) : null
          }
        />
      )}

      {/* Fade the feed out behind the FAB instead of a hard cut-off:
          transparent at the top of the gradient, solid page-color at the bottom. */}
      <LinearGradient
        colors={['rgba(243,244,248,0)', 'rgba(243,244,248,1)']}
        style={styles.bottomFade}
        pointerEvents='none'
      />

      <Pressable
        style={styles.fab}
        onPress={() => router.push('/(app)/create-post')}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F8' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '700', color: '#111827' },
  greeting: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: { marginRight: 8 },
  search: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 30, fontWeight: '400', marginTop: -2 },
});

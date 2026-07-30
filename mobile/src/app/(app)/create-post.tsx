import { useState } from 'react';
import {
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  View,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';
import { createPost, PostError } from '@/services/post.service';
import { CreatePostFormData, createPostSchema } from '@/utils/validation';
import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';
import { SafeAreaView } from 'react-native-safe-area-context';

const POST_CONTENT_MAX_LENGTH = 2000;

export default function CreatePostScreen() {
  const { user } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const postBtnScale = useSharedValue(1);
  const postBtnAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: postBtnScale.value }],
  }));

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<CreatePostFormData>({
    resolver: yupResolver(createPostSchema),
    defaultValues: { content: '' },
    mode: 'onChange',
  });

  const contentValue = watch('content');

  const onSubmit = async (data: CreatePostFormData) => {
    if (!user) return;
    setServerError(null);
    try {
      await createPost(data.content, user.id, user.username);
      router.back();
    } catch (err) {
      setServerError(err instanceof PostError ? err.message : 'Failed to post');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={styles.card}
          >
            <View style={styles.composerHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.postingAs}>
                Posting as{' '}
                <Text style={styles.postingAsBold}>{user?.username}</Text>
              </Text>
            </View>

            <Controller
              control={control}
              name='content'
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="What's on your mind?"
                  placeholderTextColor='#9CA3AF'
                  multiline
                  autoFocus
                  numberOfLines={10}
                  maxLength={POST_CONTENT_MAX_LENGTH}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            <Text style={styles.counter}>
              {(contentValue ?? '').length}/{POST_CONTENT_MAX_LENGTH}
            </Text>

            {errors.content && (
              <Animated.Text entering={FadeIn.duration(200)} style={styles.error}>
                {errors.content.message}
              </Animated.Text>
            )}
            {serverError && (
              <Animated.Text entering={FadeIn.duration(200)} style={styles.error}>
                {serverError}
              </Animated.Text>
            )}
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <Animated.View style={postBtnAnimatedStyle}>
            <Pressable
              style={[
                styles.postBtn,
                (isSubmitting || !isValid) && styles.postBtnDisabled,
              ]}
              onPress={handleSubmit(onSubmit)}
              onPressIn={() => {
                if (!isSubmitting && isValid)
                  postBtnScale.value = withSpring(0.96, { duration: 100 });
              }}
              onPressOut={() => {
                postBtnScale.value = withSpring(1, { duration: 150 });
              }}
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting ? (
                <ActivityIndicator size='small' color='#fff' />
              ) : (
                <Text style={styles.postBtnText}>Post now</Text>
              )}
            </Pressable>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F8' },
  scrollContent: { flexGrow: 1, padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  composerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  postingAs: { fontSize: 14, color: '#6B7280' },
  postingAsBold: { color: '#111827', fontWeight: '700' },
  input: {
    color: '#111827',
    minHeight: 160,
    textAlignVertical: 'top',
    fontSize: 16,
    lineHeight: 22,
  },
  counter: { textAlign: 'right', color: '#9CA3AF', fontSize: 13, marginTop: 8 },
  error: { color: '#DC2626', fontSize: 14, marginTop: 8 },
  footer: {
    padding: 16,
    backgroundColor: '#F3F4F8',
  },
  postBtn: {
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#111827',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  postBtnDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  postBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

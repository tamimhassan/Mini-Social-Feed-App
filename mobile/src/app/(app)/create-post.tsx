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
import { CreatePostFormData, createPostSchema } from '@/utils/validation';
import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';
import { SafeAreaView } from 'react-native-safe-area-context';

const POST_CONTENT_MAX_LENGTH = 2000;

export default function CreatePostScreen() {
  const { user } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

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
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.body}>
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
            <Text style={styles.error}>{errors.content.message}</Text>
          )}
          {serverError && <Text style={styles.error}>{serverError}</Text>}
        </Animated.View>
        <Pressable
          style={styles.postBtn}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting || !isValid}
        >
          {isSubmitting ? (
            <ActivityIndicator size='small' color='#fff' />
          ) : (
            <Text style={[styles.post, !isValid && styles.postDisabled]}>
              Post now
            </Text>
          )}
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  post: { fontSize: 15, fontWeight: '700', color: '#fff' },
  postDisabled: { color: '#9CA3AF' },
  body: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  input: {
    color: '#111827',
    minHeight: 140,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  counter: { textAlign: 'right', color: '#9CA3AF', fontSize: 13, marginTop: 4 },
  error: {
    color: '#DC2626',
    fontSize: 14,
    marginBottom: 8,
    position: 'absolute',
    bottom: 0,
    left: 20,
  },
  postBtn: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  postBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});

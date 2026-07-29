import * as yup from 'yup';

export const loginSchema = yup.object({
  email: yup
    .string()
    .trim()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: yup.string().required('Password is required'),
});

export const signupSchema = yup.object({
  username: yup
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be 20 characters or fewer')
    .matches(
      /^[a-zA-Z0-9_]+$/,
      'Only letters, numbers, and underscores allowed',
    )
    .required('Username is required'),
  email: yup
    .string()
    .trim()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords do not match')
    .required('Please confirm your password'),
});

export const createPostSchema = yup.object({
  content: yup
    .string()
    .trim()
    .required('Post cannot be empty')
    .max(2000, 'Post must be 2000 characters or fewer'),
});

export const commentSchema = yup.object({
  text: yup
    .string()
    .trim()
    .required('Comment cannot be empty')
    .max(1000, 'Comment must be 1000 characters or fewer'),
});

export type CommentFormData = yup.InferType<typeof commentSchema>;
export type CreatePostFormData = yup.InferType<typeof createPostSchema>;
export type LoginFormData = yup.InferType<typeof loginSchema>;
export type SignupFormData = yup.InferType<typeof signupSchema>;

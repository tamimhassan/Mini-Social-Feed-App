import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Attach the JWT to every outgoing request automatically
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize error messages so every screen can just do err.message
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const responseData = error.response?.data;
    const message =
      responseData?.details?.[0]?.message ||
      responseData?.error ||
      'Network error. Please try again.';
    const wrapped = new Error(message) as Error & {
      details?: ApiErrorDetail[];
    };
    wrapped.details = responseData?.details;
    return Promise.reject(wrapped);
  },
);

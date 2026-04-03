import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 15000,
});

// Request interceptor for logging
API.interceptors.request.use((config) => {
  return config;
});

// Response interceptor for error normalization
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export const registerUser = (formData) =>
  API.post('/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const generateCredential = (userId) =>
  API.post('/generate-credential', { user_id: userId });

export const generateProof = (userId, condition) =>
  API.post('/generate-proof', { user_id: userId, condition });

export const verifyProof = (proofId) =>
  API.post('/verify-proof', { proof_id: proofId });

export const getCredential = (userId) =>
  API.get(`/credential/${userId}`);

export const getUserProfile = (userId) =>
  API.get(`/user/${userId}`);

import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 15000,
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

// v2 API Endpoints

// Auth
export const registerAuthUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);

// Registration & Intake
export const registerUser = (formData) =>
  API.post('/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// Credentials
export const generateCredential = (userId) =>
  API.post('/generate-credential', { user_id: userId });

export const getCredential = (userId) =>
  API.get(`/credential/${userId}`);

export const revokeCredential = (credentialId, reason) =>
  API.post(`/credentials/${credentialId}/revoke`, { reason });

export const getCredentialStatus = (credentialId) =>
  API.get(`/credentials/${credentialId}/status`);

// Proofs (Selective Disclosure)
export const generateSelectiveProof = (userId, disclosedFields, reusable = false, maxUses = null) =>
  API.post('/proofs/generate', { 
    user_id: userId, 
    disclosed_fields: disclosedFields,
    reusable,
    max_uses: maxUses
  });

// Verification
export const verifyProof = (proofId) =>
  API.post('/verify-proof', { proof_id: proofId });

export const externalVerify = (did, proofToken, apiKey = 'demo-key-12345') =>
  API.post('/verify/external', 
    { did, proof_token: proofToken },
    { headers: { 'X-API-Key': apiKey } }
  );

// Data Retrieval
export const getUserProfile = (userId) =>
  API.get(`/user/${userId}`);

export const getTrustReport = (userId) =>
  API.get(`/trust/${userId}/report`);

export const getAuditTrail = (userId, page = 1) =>
  API.get(`/audit/${userId}?page=${page}`);

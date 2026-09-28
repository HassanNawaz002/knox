import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — log all outgoing
api.interceptors.request.use((config) => {
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Response interceptor — extract data & handle errors
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Unknown API error';
    console.error(`[API Error] ${msg}`, err.response?.data);
    return Promise.reject(new Error(msg));
  }
);

/**
 * Fetch full device fleet list with optional filters
 */
export const fetchDeviceList = (filters = {}) => {
  const params = {};
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params[k] = v;
  });
  return api.get('/devices', { params });
};

/**
 * Fetch deep telemetry for a specific device by ID
 */
export const fetchDeviceDetail = (deviceId) =>
  api.get(`/devices/${deviceId}`);

/**
 * Test auth token
 */
export const testAuth = () => api.get('/auth/test');

/**
 * Fleet analytics summary
 */
export const fetchAnalyticsSummary = () => api.get('/analytics/summary');

export default api;

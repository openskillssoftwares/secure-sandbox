import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  register: (data: { email: string; username: string; password: string; fullName?: string }) =>
    api.post('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
  
  verifyEmail: (token: string) =>
    api.get(`/auth/verify-email/${token}`),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
  
  getCurrentUser: () =>
    api.get('/auth/me'),
};

export const userAPI = {
  getProfile: () =>
    api.get('/user/profile'),
  
  updateProfile: (data: { fullName?: string; username?: string }) =>
    api.put('/user/profile', data),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/user/change-password', { currentPassword, newPassword }),
  
  changeEmail: (newEmail: string) =>
    api.post('/user/change-email', { newEmail }),
  
  getProgress: () =>
    api.get('/user/progress'),
  
  getUsageLogs: (limit?: number) =>
    api.get('/user/usage-logs', { params: { limit } }),
  
  getUsageStatus: () =>
    api.get('/user/usage-status'),
  
  deleteAccount: (password: string) =>
    api.delete('/user/account', { data: { password } }),
};

export const paymentAPI = {
  getPlans: () =>
    api.get('/payment/plans'),
  
  createOrder: (planType: string) =>
    api.post('/payment/create-order', { planType }),
  
  verifyPayment: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    planType: string;
  }) =>
    api.post('/payment/verify-payment', data),
  
  getPaymentHistory: () =>
    api.get('/payment/history'),
  
  cancelSubscription: () =>
    api.post('/payment/cancel-subscription'),
};

export const sandboxAPI = {
  startSandbox: (labType: string, difficultyLevel: string) =>
    api.post('/sandbox/start', { labType, difficultyLevel }),
  
  stopSandbox: (sandboxId: string) =>
    api.post(`/sandbox/stop/${sandboxId}`),
  
  getActiveSandboxes: () =>
    api.get('/sandbox/active'),
  
  getSandboxDetails: (sandboxId: string) =>
    api.get(`/sandbox/${sandboxId}`),
  
  restartSandbox: (sandboxId: string) =>
    api.post(`/sandbox/restart/${sandboxId}`),
  
  submitFlag: (sandboxId: string, flag: string) =>
    api.post(`/sandbox/submit-flag/${sandboxId}`, { flag }),
};

export const labAPI = {
  getAllLabs: () =>
    api.get('/labs'),
  
  getLabDetails: (labType: string) =>
    api.get(`/labs/${labType}`),
  
  getCategories: () =>
    api.get('/labs/categories/list'),
  
  getLeaderboard: (limit?: number) =>
    api.get('/labs/leaderboard/global', { params: { limit } }),
  
  getUserRank: () =>
    api.get('/labs/leaderboard/rank'),
  
  getLabStats: () =>
    api.get('/labs/stats/overview'),
};

export const adminAPI = {
  getDashboard: () =>
    api.get('/admin/dashboard'),
  
  getUsers: (page?: number, limit?: number) =>
    api.get('/admin/users', { params: { page, limit } }),
  
  getSandboxes: () =>
    api.get('/admin/sandboxes'),
  
  stopSandbox: (sandboxId: string) =>
    api.post(`/admin/sandboxes/${sandboxId}/stop`),
  
  createLab: (data: any) =>
    api.post('/admin/labs', data),
  
  updateLab: (labId: string, data: any) =>
    api.put(`/admin/labs/${labId}`, data),
  
  cleanupSandboxes: () =>
    api.post('/admin/maintenance/cleanup'),
  
  getSystemHealth: () =>
    api.get('/admin/system/health'),
};

export default api;

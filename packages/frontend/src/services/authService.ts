import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class AuthService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Send cookies with requests
    });

    // Request interceptor to add token from localStorage (fallback for backward compatibility)
    this.api.interceptors.request.use(
      config => {
        // Only add Authorization header if we have a token in localStorage
        // Cookies are sent automatically via withCredentials
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;

        if (error.response?.status === 403 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Try to refresh - cookies will be sent automatically
            const response = await this.api.post('/api/auth/refresh-token');

            // If server returns token in response body (backward compatibility)
            const { accessToken } = response.data;
            if (accessToken) {
              localStorage.setItem('accessToken', accessToken);
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }

            return this.api(originalRequest);
          } catch {
            // Refresh failed, redirect to login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return Promise.reject(error);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  getAxiosInstance(): AxiosInstance {
    return this.api;
  }

  async register(email: string, password: string, displayName: string) {
    const response = await this.api.post('/api/auth/register', {
      email,
      password,
      displayName,
    });
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.api.post('/api/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async logout() {
    try {
      await this.api.post('/api/auth/logout');
    } catch {
      // Ignore errors on logout
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async getCurrentUser() {
    const response = await this.api.get('/api/auth/user');
    return response.data;
  }

  async refreshAccessToken(refreshToken: string) {
    const response = await this.api.post('/api/auth/refresh-token', {
      refreshToken,
    });
    return response.data;
  }
}

export const authService = new AuthService();
export const axiosInstance = authService.getAxiosInstance();

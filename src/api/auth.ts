import { apiClient } from './client';
import { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/user';

export const authApi = {
  async register(payload: RegisterPayload): Promise<{ message: string }> {
    const { data } = await apiClient.post('/api/auth/register', payload);
    return data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/api/auth/login', payload);
    return data;
  },

  async getMe(): Promise<User> {
    const { data } = await apiClient.get<User>('/api/auth/me');
    return data;
  },
};

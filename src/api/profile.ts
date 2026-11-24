import { apiClient } from './client';
import {
  UserProfile,
  ProfileUpdateData,
  PasswordChangeData,
  AccountDeleteData,
  ProfileStatistics,
  UserPreferences,
} from '../types/user';

export const profileApi = {
  // 1. Get user profile
  async getProfile(): Promise<UserProfile> {
    const { data } = await apiClient.get<UserProfile>('/api/profile');
    return data;
  },

  // 2. Update profile
  async updateProfile(payload: ProfileUpdateData): Promise<UserProfile> {
    const { data } = await apiClient.put<UserProfile>('/api/profile', payload);
    return data;
  },

  // 3. Upload avatar
  async uploadAvatar(file: File): Promise<{ message: string; avatar_url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<{ message: string; avatar_url: string }>(
      '/api/profile/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data;
  },

  // 4. Delete avatar
  async deleteAvatar(): Promise<{ message: string }> {
    const { data } = await apiClient.delete<{ message: string }>('/api/profile/avatar');
    return data;
  },

  // 5. Change password
  async changePassword(payload: PasswordChangeData): Promise<{ message: string }> {
    const { data } = await apiClient.put<{ message: string }>('/api/profile/password', payload);
    return data;
  },

  // 6. Get personal diary statistics
  async getStatistics(): Promise<ProfileStatistics> {
    const { data } = await apiClient.get<ProfileStatistics>('/api/profile/statistics');
    return data;
  },

  // 7. Update preferences
  async updatePreferences(payload: Partial<UserPreferences>): Promise<{ message: string; preferences: UserPreferences }> {
    const { data } = await apiClient.put('/api/profile/preferences', payload);
    return data;
  },

  // 8. Export all data
  async exportData(): Promise<any> {
    const { data } = await apiClient.get('/api/profile/export');
    return data;
  },

  // 9. Delete account
  async deleteAccount(payload: AccountDeleteData): Promise<{ message: string }> {
    const { data } = await apiClient.delete<{ message: string }>('/api/profile/account', {
      data: payload,
    });
    return data;
  },
};

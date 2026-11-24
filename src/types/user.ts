export interface UserPreferences {
  id?: string;
  theme: 'light' | 'dark' | 'system';
  notifications_enabled: boolean;
  reminder_time: string | null;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string | null;
  created_at?: string;
  preferences?: UserPreferences;
}

export interface ProfileStatistics {
  total_entries: number;
  total_words: number;
  current_streak: number;
  longest_streak: number;
}

export interface ProfileUpdateData {
  username?: string;
  email?: string;
  theme?: string;
  notifications_enabled?: boolean;
  reminder_time?: string;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
}

export interface AccountDeleteData {
  password: string;
  confirmation: string;
}

export interface User extends UserProfile {
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

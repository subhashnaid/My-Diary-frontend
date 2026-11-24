import { apiClient } from './client';
import {
  DiaryEntry,
  DiaryEntryCreate,
  DiaryEntryCreatedResponse,
  DiaryEntryUpdate,
} from '../types/diary';

export const diaryApi = {
  async getEntries(): Promise<DiaryEntry[]> {
    const { data } = await apiClient.get<DiaryEntry[]>('/api/diary');
    return data;
  },

  async getEntryById(id: string): Promise<DiaryEntry> {
    const { data } = await apiClient.get<DiaryEntry>(`/api/diary/${id}`);
    return data;
  },

  async createEntry(payload: DiaryEntryCreate): Promise<DiaryEntryCreatedResponse> {
    const { data } = await apiClient.post<DiaryEntryCreatedResponse>('/api/diary', payload);
    return data;
  },

  async updateEntry(id: string, payload: DiaryEntryUpdate): Promise<{ message: string; entry: DiaryEntry }> {
    const { data } = await apiClient.put(`/api/diary/${id}`, payload);
    return data;
  },

  async deleteEntry(id: string): Promise<{ message: string }> {
    const { data } = await apiClient.delete(`/api/diary/${id}`);
    return data;
  },
};

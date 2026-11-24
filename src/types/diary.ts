export interface DiaryEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  entry_date: string;
  created_at: string;
}

export interface DiaryEntryCreate {
  title: string;
  content: string;
  entry_date: string;
}

export interface DiaryEntryUpdate {
  title?: string;
  content?: string;
  entry_date?: string;
}

export interface DiaryEntryCreatedResponse extends DiaryEntry {
  message: string;
  entryId: string;
}

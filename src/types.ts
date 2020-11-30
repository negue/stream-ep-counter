
export interface TagData {
  id: string;
  name: string;
}

export interface Topic {
  id?: number;
  currentCounter: number;
  title: string;
  template: string;
  gameId?: string;
  gameName?: string;
  tags: string;

  importTags?: TagData[];
}

export interface HistoryEntry {
  id?: number;
  date?: Date | null;
  task: string;
}

export interface Dictionary<T> {
  [key: string]: T;
}

export interface State {
  topics: Topic[];
  history: HistoryEntry[];
  tags: Dictionary<TagData>;
}

export const INITIAL_TOPIC_OBJECT: Topic = {
  currentCounter: 1,
  title: '',
  template: '',
  tags: ''
}

export const INITIAL_HISTORY_OBJECT: HistoryEntry = {
  task: ''
}

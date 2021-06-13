import Dexie from 'dexie';
import { HistoryEntry, TagData, Topic } from '@/types';

export class DexieDatabase extends Dexie {
  topics!: Dexie.Table<Topic, number>;
  history!: Dexie.Table<HistoryEntry, number>;
  tags!: Dexie.Table<TagData, string>;

  constructor () {
    super('StreamEpCounter');

    const db = this;

    //
    // Define tables and indexes
    //
    db.version(7).stores({
      topics: '++id, currentCounter, title, notificationText, template, gameId, gameName, tags, commandsJson, archived',
      history: '++id, date, task',
      tags: 'id, name'
    });
  }
}

export const db = new DexieDatabase();

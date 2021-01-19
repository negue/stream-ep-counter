import { reactive } from 'vue';
import { HistoryEntry, INITIAL_HISTORY_OBJECT, INITIAL_TOPIC_OBJECT, State, TagData, Topic } from '@/types';
import { db } from '@/dexieDatabase';

export const store = {
  state: reactive<State>({
    topics: [],
    history: [],
    tags: {}
  }),

  loadDataFromDb () {
    db.topics.toArray().then(allTopics => {
      for (const topic of allTopics) {
        topic.commands = JSON.parse(topic.commandsJson ?? '[]');
      }

      store.state.topics = allTopics;
    });

    db.history.toArray().then(allEntries => {
      store.state.history = allEntries;
    });

    db.tags.toArray().then(allEntries => {
      for (const tagEntry of allEntries) {
        store.state.tags[tagEntry.id] = tagEntry;
      }
    });
  },

  addTopic (data: Partial<Topic>) {
    const realTopic: Topic = Object.assign({}, INITIAL_TOPIC_OBJECT, data);

    const commands = realTopic.commands;
    realTopic.commandsJson = JSON.stringify(realTopic.commands);
    delete realTopic.commands;

    this.importTagsAndUpdateTagIdList(realTopic);

    this.state.topics.push(realTopic);

    console.info('pre calling topic add');
    db.topics.add(realTopic);

    realTopic.commands = commands;
  },

  deleteTopic (data: Topic) {
    const indexOfTopic = this.state.topics.indexOf(data);

    if (indexOfTopic !== -1) {
      this.state.topics.splice(indexOfTopic, 1);
    }

    db.topics.delete(data.id!);
  },
  editTopic (topic: Topic) {
    const indexOfTopic = this.state.topics.findIndex(t => t.id === topic.id);

    const realTopic: Topic = Object.assign({}, topic);

    const commands = realTopic.commands;
    realTopic.commandsJson = JSON.stringify(realTopic.commands);
    delete realTopic.commands;

    this.importTagsAndUpdateTagIdList(realTopic);

    if (indexOfTopic !== -1) {
      this.state.topics[indexOfTopic] = realTopic;

      console.info('updated in state?!', this.state);
    }

    console.info('pre calling topic update');
    db.topics.update(topic.id!, realTopic);

    realTopic.commands = commands;
  },

  addHistoryEntry (entry: HistoryEntry) {
    const entryWithDefaults: HistoryEntry = Object.assign({
      date: new Date()
    }, INITIAL_HISTORY_OBJECT, entry);

    this.state.history.push(entryWithDefaults);
    db.history.add(entryWithDefaults);
  },

  importTagsAndUpdateTagIdList (topic: Topic) {
    // check the current tags (name) if they already exist
    // if not add those
    if (topic.importTags) {
      this.importUnknownTags(topic.importTags);

      // at the end just use the id as comma list
      topic.tags = topic.importTags?.map(t => t.id).join(',') ?? '';

      delete topic.importTags;
    }
  },

  importUnknownTags (tags: TagData[]) {
    // if tag not in the dictionary => add it
    // otherwise => ignore it

    for (const tag of tags) {
      if (!this.state.tags[tag.id]) {
        this.state.tags[tag.id] = tag;

        const realTag: TagData = Object.assign({}, tag);

        console.info('PRE adding a tag', tag);
        db.tags.add(realTag);
      }
    }
  }
};

store.loadDataFromDb();

// (window as any).store = store;

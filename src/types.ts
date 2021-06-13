
export const COMMAND_SYNTAX_NAME = '{name}';
export const COMMAND_SYNTAX_CONTENT = '{content}';
export const CONFIG_COMMAND_SYNTAX = 'commandSyntax';

export const CONFIG_STATE = {
  [CONFIG_COMMAND_SYNTAX]: localStorage.getItem(CONFIG_COMMAND_SYNTAX) ??
    `!editcommand ${COMMAND_SYNTAX_NAME} ${COMMAND_SYNTAX_CONTENT}`
};

export interface TagData {
  id: string;
  name: string;
}

export interface Command {
  name: string;
  content: string;
}

export interface Topic {
  id?: number;
  currentCounter: number;
  title: string;
  customChannel: string;
  template: string;
  notificationText: string;
  gameId?: string;
  gameName?: string;
  tags: string;

  importTags?: TagData[];
  commandsJson: string;
  commands: Command[]; // will be saved as json

  archived: boolean;
}

export interface HistoryEntry {
  id?: number;
  date?: Date | string | null;
  topicId: number;
  lastCounter: number;
  lastTitle: string;
  task: string;
}

export interface Dictionary<T> {
  [key: string]: T;
}

export interface State {
  topics: Topic[];
  history: HistoryEntry[];
  tags: Dictionary<TagData>;
  loggedIn: boolean;
}

export const INITIAL_TOPIC_OBJECT: Topic = {
  currentCounter: 1,
  title: '',
  template: '',
  notificationText: '',
  tags: '',
  commands: [],
  commandsJson: '[]',
  customChannel: '',

  archived: false
}

export const INITIAL_HISTORY_OBJECT: HistoryEntry = {
  task: '',
  lastCounter: 0,
  topicId: -1,
  lastTitle: ''
}

export interface TwitchChannelInformation {
  game_name: string;
  game_id: string;
  title: string;

}

export interface TwitchChannelTag {
  localization_names: {[key: string]: string};
  tag_id: string;
  is_auto: boolean;
}

export interface TwitchLoginExistsPayload {
  preferred_username: string;
  message: string;
  status: number;
}

export interface TwitchLoginPayload {
  userId: string;
  userName: string;
  tokenId: string;
  accessToken: string;
}

export interface TwitchPaginatedDataResult<T> {
  data: T[];
  pagination: {
    cursor: string;
  };
}

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
export interface ITwitchApiHandler {
  login (): Promise<TwitchLoginPayload>;
  loginExists (): Promise<TwitchLoginExistsPayload | null>;
  checkTokens (): void;
  currentChannelInformation (): Promise<TwitchChannelInformation>;
  currentTags (): Promise<TwitchChannelTag[]>;
  applyTopicToTwitch (topic: Topic): void;
  writeToChat(command: Command): Promise<void>;
  resetAuth (): void;
  listFirstTags (
    after?: string|undefined,
    first?: number|undefined
  ): Promise<TwitchPaginatedDataResult<TwitchChannelTag>>;
}

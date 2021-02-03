import {
  Command,
  ITwitchApiHandler,
  Topic,
  TwitchChannelInformation,
  TwitchChannelTag, TwitchLoginExistsPayload,
  TwitchLoginPayload
} from '@/types';
import { generateCommandText } from '@/utils';

export class TwitchApiOfflineHandler implements ITwitchApiHandler {
  async login (): Promise<TwitchLoginPayload> {
    return {
      accessToken: '',
      tokenId: '',
      userName: '',
      userId: ''
    };
  }

  async loginExists (): Promise<TwitchLoginExistsPayload | null> {
    return {
      preferred_username: 'offfline',
      message: '',
      status: 200
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  checkTokens (): void { }

  // GET https://api.twitch.tv/helix/channels
  async currentChannelInformation (): Promise<TwitchChannelInformation> {
    return {
      title: 'Stuff',
      game_id: '1334',
      game_name: 'Coding Stuff'
    }
  }

  // GET https://api.twitch.tv/helix/streams/tags
  async currentTags (): Promise<TwitchChannelTag[]> {
    return [];
  }

  async applyTopicToTwitch (topic: Topic) {
    alert('Stuff will be applied to Twitch');
  }

  async writeToChat (command: Command): Promise<void> {
    alert('Writing to chat that!' + generateCommandText(command));
  }

  resetAuth (): void {
    alert();
  }
}

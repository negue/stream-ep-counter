import {
  ITwitchApiHandler,
  Topic,
  TwitchChannelInformation, TwitchChannelTag, TwitchLoginExistsPayload,
  TwitchLoginPayload,
  Command, TwitchPaginatedDataResult
} from '@/types';
import { generateCommandText, generateTitle } from '@/utils';
import jwtDecode from 'jwt-decode';
import * as tmi from 'tmi.js';

const LS_USER_ID = 'userId';
const LS_USER_NAME = 'userName';
const LS_TOKEN_ID = 'tokenId';
const LS_ACCESS_TOKEN = 'accessToken';

// TODO Extract multiple fetch with headers

export class TwitchApiHandler implements ITwitchApiHandler {
  private twitchAuthUrl: string;
  private tmi: tmi.Client | null = null;

  constructor (private clientId: string,
              private scopes: string,
              private redirectUrl: string) {
    this.twitchAuthUrl = `https://id.twitch.tv/oauth2/authorize?response_type=token%20id_token&client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUrl)}&scope=${this.scopes}+openid`;
  }

  // todo type
  async login (): Promise<TwitchLoginPayload> {
    return new Promise((resolve, reject) => {
      const userId = localStorage.getItem(LS_USER_ID) ?? '';

      if (userId) {
        const userName = localStorage.getItem(LS_USER_NAME) ?? '';
        const tokenId = localStorage.getItem(LS_TOKEN_ID) ?? '';
        const accessToken = localStorage.getItem(LS_ACCESS_TOKEN) ?? '';

        resolve({
          userId, userName, tokenId, accessToken
        })
      } else {
        window.open(this.twitchAuthUrl, 'Twitch Auth', 'toolbar=0,scrollbars=1,status=1,resizable=1,location=1,menuBar=0');

        console.info(this.twitchAuthUrl);

        (window as any).gotToken = function (userName: string, userId: string, tokenId: string, accessToken: string) {
          console.info({ userName, userId, tokenId, accessToken });
          resolve({
            userName, userId, tokenId, accessToken
          });
          localStorage.setItem(LS_USER_NAME, userName);
          localStorage.setItem(LS_USER_ID, userId);
          localStorage.setItem(LS_TOKEN_ID, tokenId);
          localStorage.setItem(LS_ACCESS_TOKEN, accessToken);
        };
      }
    });
  }

  async loginExists (): Promise<TwitchLoginExistsPayload | null> {
    const accessToken = localStorage.getItem(LS_ACCESS_TOKEN);

    if (!accessToken) {
      return null;
    }

    return fetch('https://id.twitch.tv/oauth2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }).then(res => res.json())
      .then(js => {
        console.info({ js });

        return js;
      });
  }

  checkTokens () {
    console.info({ location });

    const hashValues = location.hash.replace('#', '');

    const params = new URLSearchParams(hashValues);

    const tokenId = params.get('id_token');
    const accessToken = params.get('access_token');

    const jwt = jwtDecode(tokenId!);

    console.info({ jwt });

    const { preferred_username: userName, sub: userId } = jwt as any;

    console.info({ userName, userId, tokenId, accessToken });

    setTimeout(() => {
      window.opener.gotToken(userName, userId, tokenId, accessToken);
      window.close();
    }, 4000);
  }

  // GET https://api.twitch.tv/helix/channels
  currentChannelInformation (): Promise<TwitchChannelInformation> {
    return fetch('https://api.twitch.tv/helix/channels?broadcaster_id=' + localStorage.getItem(LS_USER_ID), {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        'client-id': this.clientId
      }
    }).then(res => res.json())
      .then(js => {
        console.info({ js });

        return js.data[0];
      });
  }

  getChannelInfoByUserName (username: string): Promise<{
    broadcaster_type: string;
    created_at: string;
    description: string;
    display_name: string;
    id: string;
    login: string;
    offline_image_url: string;
    profile_image_url: string;
    type: string;
    view_count: number;
  }> {
    return fetch('https://api.twitch.tv/helix/users?login=' + username, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        'client-id': this.clientId
      }
    }).then(res => res.json())
      .then(js => {
        console.info({ js });

        return js.data[0];
      });
  }

  // GET https://api.twitch.tv/helix/streams/tags
  currentTags (): Promise<TwitchChannelTag[]> {
    return fetch('https://api.twitch.tv/helix/streams/tags?broadcaster_id=' + localStorage.getItem(LS_USER_ID), {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        'client-id': this.clientId
      }
    }).then(res => res.json())
      .then(js => {
        console.info({ js });

        return js.data;
      });
  }

  async applyTopicToTwitch (topic: Topic) {
    let broadcaster_id = localStorage.getItem(LS_USER_ID);

    const newTagsPayload = { tag_ids: topic.tags?.split(',').filter(t => t !== '') }

    if (topic.customChannel) {
      const result = await this.getChannelInfoByUserName(topic.customChannel);

      console.info({ result });

      broadcaster_id = result.id;
    }

    if (newTagsPayload.tag_ids.length !== 0) {
      await fetch('https://api.twitch.tv/helix/streams/tags?broadcaster_id=' + broadcaster_id, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          'client-id': this.clientId,
          'content-type': 'application/json'
        },
        method: 'PUT',
        body: JSON.stringify(newTagsPayload)
      });

      console.info('Sent Tags');
    }

    const channelInformationPayload = {
      game_id: topic.gameId,
      title: generateTitle(topic),
      broadcaster_language: 'en'
    };

    await fetch('https://api.twitch.tv/helix/channels?broadcaster_id=' + broadcaster_id, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        'client-id': this.clientId,
        'content-type': 'application/json'
      },
      method: 'PATCH',
      body: JSON.stringify(channelInformationPayload)
    });

    console.info('Apply values to Twitch', {
      broadcaster_id,
      newTagsPayload,
      channelInformationPayload
    });
  }

  async writeToChat (command: Command): Promise<void> {
    const userName = localStorage.getItem('userName') ?? '';

    if (this.tmi === null) {
      this.tmi = tmi.Client({
        identity: {
          username: userName,
          password: `oauth:${localStorage.getItem('accessToken')}`
        },
        connection: {
          secure: true,
          reconnect: true
        }
      });
      const result = await this.tmi.connect();
      console.info({ result, userName });
    }

    await this.tmi.say(userName, generateCommandText(command));
  }

  async listFirstTags (
    after?: string|undefined,
    first = 100
  ): Promise<TwitchPaginatedDataResult<TwitchChannelTag>> {
    const result = await fetch(`https://api.twitch.tv/helix/tags/streams?first=${first}&after=${after || ''}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        'client-id': this.clientId,
        'content-type': 'application/json'
      },
      method: 'GET'
    }).then(res => res.json());

    return result;
  }

  public resetAuth () {
    localStorage.setItem(LS_USER_ID, '');
    localStorage.setItem(LS_USER_NAME, '');
    localStorage.setItem(LS_TOKEN_ID, '');
    localStorage.setItem(LS_ACCESS_TOKEN, '');
  }
}

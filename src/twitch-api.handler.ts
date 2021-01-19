import {
  ITwitchApiHandler,
  Topic,
  TwitchChannelInformation, TwitchChannelTag, TwitchLoginExistsPayload,
  TwitchLoginPayload,
  Command
} from '@/types';
import { generateTitle } from '@/utils';
import jwtDecode from 'jwt-decode';

export class TwitchApiHandler implements ITwitchApiHandler {
  twitchAuthUrl = `https://id.twitch.tv/oauth2/authorize?response_type=token%20id_token&client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUrl)}&scope=${this.scopes}+openid`;

  constructor (private clientId: string,
              private scopes: string,
              private redirectUrl: string) {
    // todo
  }

  // todo type
  async login (): Promise<TwitchLoginPayload> {
    return new Promise((resolve, reject) => {
      const userId = localStorage.getItem('userId') ?? '';

      if (userId) {
        const userName = localStorage.getItem('userName') ?? '';
        const tokenId = localStorage.getItem('tokenId') ?? '';
        const accessToken = localStorage.getItem('accessToken') ?? '';

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
          localStorage.setItem('userName', userName);
          localStorage.setItem('userId', userId);
          localStorage.setItem('tokenId', tokenId);
          localStorage.setItem('accessToken', accessToken);
        };
      }
    });
  }

  async loginExists (): Promise<TwitchLoginExistsPayload | null> {
    const accessToken = localStorage.getItem('accessToken');

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
    return fetch('https://api.twitch.tv/helix/channels?broadcaster_id=' + localStorage.getItem('userId'), {
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
    return fetch('https://api.twitch.tv/helix/streams/tags?broadcaster_id=' + localStorage.getItem('userId'), {
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
    const broadcaster_id = localStorage.getItem('userId');

    const newTagsPayload = { tag_ids: topic.tags?.split(',') }

    await fetch('https://api.twitch.tv/helix/streams/tags?broadcaster_id=' + broadcaster_id, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        'client-id': this.clientId,
        'content-type': 'application/json'
      },
      method: 'PUT',
      body: JSON.stringify(newTagsPayload)
    });

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

  writeToChat (command: Command): void {
    throw new Error('Method not implemented.');
  }
}

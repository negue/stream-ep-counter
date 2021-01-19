import { TwitchApiHandler } from '@/twitch-api.handler';
import { TwitchApiOfflineHandler } from '@/twitch-api.offline';

const currentUrl = `${location.href}`;
const scopes = 'user_read+user:edit:broadcast';
export const clientId = 'mz7t3tiaptc51q5rvp5e86j51e61p5';

export const queryParams = new URLSearchParams(location.search);

console.info({ queryParams });

export const twitch = queryParams.has('develop')
  ? new TwitchApiOfflineHandler()
  : new TwitchApiHandler(clientId, scopes, currentUrl);

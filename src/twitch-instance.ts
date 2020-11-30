import { TwitchApiHandler } from '@/twitch-api.handler';

const currentUrl = `${location.href}`;
const scopes = 'user_read+user:edit:broadcast';
export const clientId = 'mz7t3tiaptc51q5rvp5e86j51e61p5';

export const twitch = new TwitchApiHandler(clientId, scopes, currentUrl);

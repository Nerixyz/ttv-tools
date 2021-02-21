import { MessageMap } from '../../types';
import { BackgroundEventHandler } from 'beaverjs';

export const eventHandler = new BackgroundEventHandler<MessageMap>({ url: ['*://*.twitch.tv/*'] });

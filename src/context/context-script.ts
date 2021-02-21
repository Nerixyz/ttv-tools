import { MessageMap } from '../types';
import { getPlayer, initWorkerHandler, resetPlayer } from './twitch-player';
import { lazy, throttle } from '../utilities';
import { ReactConnector } from './react-connector';
import { OverridePlayer } from '../options';
import { ContextEventHandler } from 'beaverjs';

const lazyConnector = lazy(() => new ReactConnector());
const eventHandler = new ContextEventHandler<MessageMap>();

window.addEventListener('playing', () => initWorkerHandler(lazyConnector), true);
const throttledReset = throttle(() => resetPlayer(lazyConnector), 5 * 1000);

eventHandler.on('updateUrl', ({url}) => {
  const core = getPlayer(lazyConnector)?.props?.mediaPlayerInstance?.core;
  if(!core) return;

  core.load(url, '');
});

(() => {
  const baseFetch = window.fetch;
  window.fetch = (url, init, ...args) => {
    try {
      if (typeof url === 'string' && OverridePlayer()) {
        if (url.includes('/access_token')) {
          url = url.replace('player_type=site', 'player_type=embed');
        } else if (
          url.includes('/gql') &&
          typeof init?.body === 'string' &&
          init.body.includes('PlaybackAccessToken')
        ) {
          const newBody = JSON.parse(init.body);
          newBody.variables.playerType = 'embed';
          init.body = JSON.stringify(newBody);
        }
      }
    } catch {}
    return baseFetch(url, init, ...args);
  };
})();

window.addEventListener('DOMContentLoaded', () => {
  eventHandler.emitContent('clientId', (window as any).commonOptions.headers['Client-ID']);
});

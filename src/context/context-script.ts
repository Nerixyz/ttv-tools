import { MessageMap } from '../types';
import { getPlayer, initWorkerHandler, resetPlayer } from './twitch-player';
import { lazy, throttle } from '../utilities';
import { ReactConnector } from './react-connector';
import { OverridePlayer } from '../options';

const lazyConnector = lazy(() => new ReactConnector());

window.addEventListener('message', async ({ data }) => {
  if (typeof data !== 'string' || !data.startsWith('ttv:')) return;

  const actualPacket = JSON.parse(data.substring('ttv:'.length));
  await handleExtMessage(actualPacket.type, actualPacket.data);
});

window.addEventListener('playing', () => initWorkerHandler(lazyConnector), true);
const throttledReset = throttle(() => resetPlayer(lazyConnector), 5 * 1000);

async function handleExtMessage<K extends keyof MessageMap>(type: K, data: MessageMap[K]) {
  switch (type) {
    case 'updateUrl': await onUpdatePlayerUrl(data as MessageMap['updateUrl'])
  }
}

async function onUpdatePlayerUrl(data: MessageMap['updateUrl']) {
  const core = getPlayer(lazyConnector)?.props?.mediaPlayerInstance?.core;
  if(!core) return;

  core.load(data.url, '');
}

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
  window.postMessage(`ttv:${JSON.stringify({type: 'clientId', data: (window as any).commonOptions.headers['Client-ID']})}`, location.origin);
})

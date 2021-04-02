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

eventHandler.on('updateUrl', ({url, stream}) => {
  const core = getPlayer(lazyConnector)?.props?.mediaPlayerInstance?.core;
  if(!core) return;

  const path = core.getPath();
  if(url === path) return; // same url

  const user = path.match(/\/channel\/hls\/([^.]).m3u8/)?.[1];
  if(!user) {
    console.warn('Attempted to reload but got a bad path:', path);
    return;
  }
  if(user !== stream) return; // other stream -- invalid

  core.load(url, '');
  signalPlayer('blue');
});

eventHandler.on('adSkipped', () => signalPlayer('red'));

function signalPlayer(color: string) {
  const player = document.querySelector('.video-player__overlay');
  if(!player) return;

  player.animate({
    composite: 'replace',
    easing: 'ease-in',
    boxShadow: [`inset 0 0 30px ${color}`, 'inset 0 0 30px transparent'],
  }, 1000);
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
  eventHandler.emitContent('clientId', (window as any).commonOptions.headers['Client-ID']);
});

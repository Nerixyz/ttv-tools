import { MessageMap } from '../types';
import { initWorkerHandler, resetPlayer } from './twitch-player';
import { lazy, throttle } from '../utilities';
import { ReactConnector } from './react-connector';
import { OverridePlayer } from '../options';

const lazyConnector = lazy(() => new ReactConnector());

window.addEventListener('message', async ({ data }) => {
  if (typeof data !== 'string' || !data.startsWith('ttv:')) return;

  const actualPacket = JSON.parse(data.substring('ttv:'.length));
  await handleAdPacket(actualPacket.type, actualPacket.data);
});

window.addEventListener('playing', () => initWorkerHandler(lazyConnector), true);
const throttledReset = throttle(() => resetPlayer(lazyConnector), 5 * 1000);

async function handleAdPacket<K extends keyof MessageMap>(type: K, data: MessageMap[K]) {
  if (type !== 'adPod') return;

  const { adId, creativeId, lineItemId, orderId, radToken, rollType, podLength } = data as MessageMap['adPod'];

  const baseData = {
    stitched: true,
    roll_type: rollType,
    player_mute: false,
    player_volume: 0.8001870069,
    visible: true,
  };

  for (let podPosition = 0; podPosition < podLength; podPosition++) {
    const extendedData = {
      ...baseData,
      ad_id: adId,
      ad_position: podPosition,
      duration: 30,
      creative_id: creativeId,
      total_ads: podLength,
      order_id: orderId,
      line_item_id: lineItemId,
    };

    await gqlRequest(makeGraphQlPacket('video_ad_impression', radToken, extendedData));
    for (let quartile = 0; quartile < 4; quartile++) {
      await gqlRequest(
        makeGraphQlPacket('video_ad_quartile_complete', radToken, {
          ...extendedData,
          quartile: quartile + 1,
        })
      );
    }

    await gqlRequest(makeGraphQlPacket('video_ad_pod_complete', radToken, baseData));
    throttledReset();
  }
}

function makeGraphQlPacket(event: string, radToken: string, payload: any) {
  return [
    {
      operationName: 'ClientSideAdEventHandling_RecordAdEvent',
      variables: {
        input: {
          eventName: event,
          eventPayload: JSON.stringify(payload),
          radToken,
        },
      },
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash: '7e6c69e6eb59f8ccb97ab73686f3d8b7d85a72a0298745ccd8bfc68e4054ca5b',
        },
      },
    },
  ];
}

function gqlRequest(body: any) {
  return fetch('https://gql.twitch.tv/gql', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: getHeaders(),
  });
}

const knownCookies = new Map<string, string>();

function getCookie(name: string): string {
  const known = knownCookies.get(name);
  if (known) return known;

  const val = document.cookie.match(`${name}=([^;]+)`)?.[1];
  if (val) knownCookies.set(name, val);

  return val ?? '';
}

function getHeaders() {
  return {
    'Client-Id': (window as any).commonOptions?.headers?.['Client-Id'],
    Authorization: `OAuth ${getCookie('auth-token')}`,
    'X-Device-Id': getCookie('unique_id'),
  };
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

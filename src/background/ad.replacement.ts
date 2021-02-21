import { TwitchStitchedAdData } from '../types';
import { getPlayerAccessTokenRequest, makeAdRequest } from './gql.requests';
import { eventHandler } from './utilities/messaging';

export async function onAdPod(stitchedAd: TwitchStitchedAdData, stream: string) {
  const adPod = {
    podLength: Number(stitchedAd['X-TV-TWITCH-AD-POD-LENGTH'] ?? '1'),
    podPosition: Number(stitchedAd['X-TV-TWITCH-AD-POD-POSITION'] ?? '0'),
    radToken: stitchedAd['X-TV-TWITCH-AD-RADS-TOKEN'],
    lineItemId: stitchedAd['X-TV-TWITCH-AD-LINE-ITEM-ID'],
    orderId: stitchedAd['X-TV-TWITCH-AD-ORDER-ID'],
    creativeId: stitchedAd['X-TV-TWITCH-AD-CREATIVE-ID'],
    adId: stitchedAd['X-TV-TWITCH-AD-ADVERTISER-ID'],
    rollType: stitchedAd['X-TV-TWITCH-AD-ROLL-TYPE'],
  };
  await makeAdRequest(adPod);

  let {usherData} = await browser.storage.local.get('usherData');
  if(!usherData) {
    console.warn('No usherData pogo, replacing');
    usherData = {
      allow_source: "true",
      fast_bread: "true",
      player_backend: "mediaplayer",
      playlist_include_framerate: "true",
      reassignments_supported: "true",
      supported_codecs: "avc1",
      cdm: "wv",
      player_version: "1.2.0"
    }
  }

  eventHandler.emitContext('updateUrl',{url: await createM3U8Url({stream, usher: usherData})});
}

async function createM3U8Url({usher, stream}: {usher: any, stream: string}) {
  const {value: token, signature: sig} = await getPlayerAccessTokenRequest(stream);

  const search = new URLSearchParams({
    ...usher,
    token,
    sig,
    play_session_id: createRandomSessionId(),
    p: Math.floor(9999999 * Math.random()),
  }).toString();
  return `https://usher.ttvnw.net/api/channel/hls/${stream}.m3u8?${search}`;
}

function createRandomSessionId() {
  return [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

export const StreamTabs = new Map<number, string>();

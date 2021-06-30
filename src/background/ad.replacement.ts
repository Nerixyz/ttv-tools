import { TwitchStitchedAdData } from './twitch-m3u8.types';
import { getPlayerAccessTokenRequest, makeAdRequest, PlayerType } from './gql.requests';
import { eventHandler } from './utilities/messaging';
import { getUsherData } from './storage';

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
    duration: Math.round(stitchedAd.DURATION ?? 30),
  };
  await makeAdRequest(adPod);

  eventHandler.emitContext('updateUrl',{url: await createM3U8Url({stream, usher: await getUsherData()}), stream});
}

export async function createM3U8Url({usher, stream}: {usher: any, stream: string}, playerType = PlayerType.Site) {
  const {value: token, signature: sig} = await getPlayerAccessTokenRequest(stream, playerType);

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

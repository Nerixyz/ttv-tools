import _OnBeforeRequestDetails = browser.webRequest._OnBeforeRequestDetails;
import { StreamFilter } from '../types';
import { parseAttributes } from './utilities/m3u8.utilities';
import { OverridePlayer, UserAgent } from '../options';
import { onAdPod, StreamTabs } from './ad.replacement';
import { TWITCH_USER_PAGE } from './utilities/request.utilities';
import { eventHandler } from './utilities/messaging';
import { TwitchStitchedAdData } from './twitch-m3u8.types';
function onRequest(request: _OnBeforeRequestDetails) {
  if (!request.url.includes('video-weaver')) return;

  const start = performance.now();
  const filter = browser.webRequest.filterResponseData(request.requestId) as StreamFilter;
  const decoder = new TextDecoder('utf-8');
  const encoder = new TextEncoder();

  filter.ondata = async (event: { data: ArrayBuffer }) => {
    const text = decoder.decode(event.data);
    const hasAds = text.match(/^#EXTINF:\d+\.?\d*,[^live]+$/m);

    if (!hasAds) {
      filter.write(event.data);
      return;
    }

    const finalWrite = (data: string) => {
      filter.write(encoder.encode(data));
      filter.close();
    };

    extractAdData(text, request.documentUrl ?? '', request.tabId);
    finalWrite(cleanupAllAdStuff(text));
  };

  filter.onstop = () => {
    const elapsed = performance.now() - start; // keep for debugging
    filter.disconnect();
  };
}

browser.webRequest.onBeforeRequest.addListener(
  onRequest,
  {
    urls: ['*://*.ttvnw.net/v1/playlist/*'],
  },
  ['blocking']
);

browser.webRequest.onBeforeSendHeaders.addListener(
  ({ requestHeaders, url: requestUrl,tabId }) => {

    if(requestUrl.includes('/api/channel/hls/')) {
      const url = new URL(requestUrl);
      const search = Object.fromEntries(url.searchParams.entries());
      delete search.token;
      delete search.sig;
      delete search.p;
      delete search.play_session_id;

      browser.storage.local.set({usherData: search}).catch(console.error);
      // this is not xqcL
      StreamTabs.set(tabId, requestUrl.match(/\/([^./]+).m3u8/)?.[1] ?? '');
    }

    const replaceHeader = (name: string, value: string | (() => string)) => {
      if(!value) return;
      const header = requestHeaders?.find(x => x.name.toLowerCase() === name);
      if (header) header.value = (typeof value === 'function' ? value() : value) || header.value;
    };

    if(OverridePlayer() && requestUrl.includes('hls.ttvnw')) {
      replaceHeader('origin', 'https://player.twitch.tv');
      replaceHeader('referer', 'https://player.twitch.tv');
    }
    replaceHeader('User-Agent', UserAgent());

    return { requestHeaders };
  },
  {
    urls: ['*://*.ttvnw.net/*'],
  },
  ['requestHeaders', 'blocking']
);

function cleanupAllAdStuff(data: string) {
  return data
    .replace(/X-TV-TWITCH-AD-URL="[^"]+"/g, 'X-TV-TWITCH-AD-URL="javascript:alert(\'pogo\')"')
    .replace(
      /X-TV-TWITCH-AD-CLICK-TRACKING-URL="[^"]+"/g,
      'X-TV-TWITCH-AD-CLICK-TRACKING-URL="javascript:alert(\'pogo\')"'
    )
    .replace(/X-TV-TWITCH-AD-ADVERIFICATIONS="[^"]+"/g, `X-TV-TWITCH-AD-ADVERIFICATIONS="${btoa('{}')}"`)
    .replace(/#EXT-X-DATERANGE.+CLASS=".*ad.*".+\n/g, '');
}

function extractAdData(data: string, doc: string, tabId: number) {
  const attrString = data.match(/#EXT-X-DATERANGE:(ID="stitched-ad-[^\n]+)\n/)?.[1];
  if (!attrString) {
    console.warn('no stitched ad');
    return;
  }
  if(!TWITCH_USER_PAGE.test(doc)) return;

  const attr = parseAttributes<TwitchStitchedAdData>(attrString);
  onAdPod(attr, StreamTabs.get(tabId) ?? TWITCH_USER_PAGE.exec(doc)?.[1] ?? '').then(() => {
    eventHandler.emitContext('adSkipped', {});
    console.debug('"Skipped" ad.');
  }).catch(console.error);
}

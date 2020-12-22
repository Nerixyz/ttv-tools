import _OnBeforeRequestDetails = browser.webRequest._OnBeforeRequestDetails;
import { MessageMap, StreamFilter, TwitchStitchedAdData } from '../types';
import { getSegmentsFromFile, ReplaceM3U8Task } from './replace-m3u8';
import { lazyAsync } from '../utilities';
import { parseAttributes } from './m3u8-utils';
import { OverridePlayer, UserAgent } from '../options';

const segments = lazyAsync(() => getSegmentsFromFile(browser.runtime.getURL('videos/video.m3u8')));
const replaceTasks = new Map<string, [number, ReplaceM3U8Task]>();

function onRequest(request: _OnBeforeRequestDetails) {
  if (!request.url.includes('video-weaver')) return;

  const filter = browser.webRequest.filterResponseData(request.requestId) as StreamFilter;
  const decoder = new TextDecoder('utf-8');
  const encoder = new TextEncoder();

  filter.ondata = async (event: { data: ArrayBuffer }) => {
    const text = decoder.decode(event.data);
    const adIdx = text.indexOf('#EXT-X-DATERANGE:ID="stitched-ad');

    if (adIdx === -1) {
      replaceTasks.delete(request.url);
      return filter.write(event.data);
    }

    const finalWrite = (data: string) => {
      filter.write(encoder.encode(data));
      return filter.close();
    };
    extractAdData(text);

    if (!replaceTasks.has(request.url)) {
      replaceTasks.set(request.url, [-1, new ReplaceM3U8Task(await segments())]);
    }
    const [timeout, task] = replaceTasks.get(request.url) ?? [];
    clearTimeout(timeout);
    setTimeout(() => replaceTasks.delete(request.url), 2000);
    return finalWrite(cleanupAllAdStuff(task?.replaceWithVideo(text) ?? text));
  };

  filter.onstop = () => {
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
  ({ requestHeaders, url }) => {
    const replaceHeader = (name: string, value: string | (() => string)) => {
      const header = requestHeaders?.find(x => x.name.toLowerCase() === name);
      if (header) header.value = (typeof value === 'function' ? value() : value) || header.value;
    };

    if(OverridePlayer() && url.includes('hls.ttvnw')) {
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

function extractAdData(data: string) {
  const attrString = data.match(/#EXT-X-DATERANGE:(ID="stitched-ad-[^\n]+)\n/)?.[1];
  if (!attrString) {
    console.warn('no stitched ad');
    return;
  }

  const attr = parseAttributes(attrString) as TwitchStitchedAdData;
  sendMessage('adPod', {
    podLength: Number(attr['X-TV-TWITCH-AD-POD-LENGTH'] ?? '1'),
    podPosition: Number(attr['X-TV-TWITCH-AD-POD-POSITION'] ?? '0'),
    radToken: attr['X-TV-TWITCH-AD-RADS-TOKEN'],
    lineItemId: attr['X-TV-TWITCH-AD-LINE-ITEM-ID'],
    orderId: attr['X-TV-TWITCH-AD-ORDER-ID'],
    creativeId: attr['X-TV-TWITCH-AD-CREATIVE-ID'],
    adId: attr['X-TV-TWITCH-AD-ADVERTISER-ID'],
    rollType: attr['X-TV-TWITCH-AD-ROLL-TYPE'],
  }).catch(console.error);
}

async function sendMessage<K extends keyof MessageMap>(type: K, data: MessageMap[K]) {
  const tabs = await browser.tabs.query({ url: ['*://*.twitch.tv/*'] });
  return Promise.all(
    tabs.map(tab =>
      browser.tabs.sendMessage(tab.id ?? -1, {
        type,
        data,
      })
    )
  );
}

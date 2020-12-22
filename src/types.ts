export interface StreamFilter {
  ondata?: (event: { data: ArrayBuffer }) => void;
  onstop?: () => void;

  disconnect(): void;

  write(data: ArrayBuffer): void;

  close(): void;
}

export enum DateRangeClass {
  StitchedAd = 'twitch-stitched-ad',
  Source = 'twitch-stream-source',
  AdQuartile = 'twitch-ad-quartile',
}

export interface MessageMap {
  adPod: {
    lineItemId: string;
    orderId: string;
    creativeId: string;
    adId: string;
    radToken: string;
    rollType: string;
    podPosition: number;
    podLength: number;
  };
  localStorage: Record<string, string | number | boolean>;
}

export interface TwitchStitchedAdData {
  ID: string;
  CLASS: string;
  'START-DATE': string;
  DURATION: number;
  'X-TV-TWITCH-AD-ADVERTISER-ID': string;
  'X-TV-TWITCH-AD-CLICK-TRACKING-URL': string;
  'X-TV-TWITCH-AD-LINE-ITEM-ID': string;
  'X-TV-TWITCH-AD-LOUDNESS': string;
  'X-TV-TWITCH-AD-COMMERCIAL-ID': string;
  'X-TV-TWITCH-AD-ROLL-TYPE': string;
  'X-TV-TWITCH-AD-AD-FORMAT': string;
  'X-TV-TWITCH-AD-AD-SESSION-ID': string;
  'X-TV-TWITCH-AD-URL': string;
  'X-TV-TWITCH-AD-POD-POSITION': string;
  'X-TV-TWITCH-AD-CREATIVE-ID': string;
  'X-TV-TWITCH-AD-ORDER-ID': string;
  'X-TV-TWITCH-AD-ADVERIFICATIONS': string;
  'X-TV-TWITCH-AD-POD-LENGTH': string;
  'X-TV-TWITCH-AD-RADS-TOKEN': string;
}

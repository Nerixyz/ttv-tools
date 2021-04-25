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

export type MessageMap = {
  // adPod: AdPod;
  localStorage: Record<string, string | number | boolean>;
  reloadPlayer: {};
  updateUrl: {url: string, stream: string};
  clientId: string;
  adSkipped: {};
}

export interface AdPod {
  lineItemId: string;
  orderId: string;
  creativeId: string;
  adId: string;
  radToken: string;
  rollType: string;
  podPosition: number;
  podLength: number;
  duration: number;
}

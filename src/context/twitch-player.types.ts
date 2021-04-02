import { ReactNode } from './react-connector';

export interface TwitchPlayerState extends ReactNode {
  setSrc(options: { isNewMediaPlayerInstance: boolean }): void;
  setInitialPlaybackSettings(opts: unknown): void;
}

export interface TwitchPlayer extends ReactNode {
  setPlayerActive: () => void;
  props?: {
    mediaPlayerInstance?: MediaPlayer;
  };
}

export interface MediaPlayer extends ReactNode {
  core?: MediaPlayerCore;
  attachHTMLVideoElement: (el: HTMLVideoElement) => void;
  mediaSinkManager?: MediaSinkManager;
  getVolume(): number;
  setVolume(vol: number): void;
  setMuted(mut: boolean): void;
  isMuted(): boolean;
}

export interface MediaPlayerCore {
  worker: Worker;
  mediaSinkManager?: MediaSinkManager;
  getVolume(): number;
  isMuted(): boolean;
  load(url: string, any: any): void;
  getPath(): string;
}

export interface MediaSinkManager {
  video?: ExtendedVideo;
  getCurrentSink?: () => MediaSink;
}

export interface MediaSink {
  playbackMonitor?: PlaybackMonitor
}

export interface PlaybackMonitor {
  setPlaybackRate?: ((rate: number) => void) & {known?: boolean};
}

export type ExtendedVideo = HTMLVideoElement & { _ffz_compressor?: boolean; playsInline: boolean };

export interface WorkerMessage {
  type: string | number;
  id: number;
  arg: any;
}

export type AnalyticsEventArgs = {
  properties: {
    hls_latency_broadcaster?: number;
    sink_buffer_size?: number;
  };
};

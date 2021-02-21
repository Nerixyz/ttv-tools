import { ReactConnector } from './react-connector';
import { Lazy } from '../utilities';
import { KeepBuffer, MinLatencyReload, MinLatencySpeedup } from '../options';
import {
  AnalyticsEventArgs,
  ExtendedVideo,
  PlaybackMonitor,
  TwitchPlayer,
  TwitchPlayerState,
  WorkerMessage
} from './twitch-player.types';

export function getPlayer(connector: Lazy<ReactConnector>): TwitchPlayer | null {
  return connector().find('twitch-player', node => node.setPlayerActive && node.props?.mediaPlayerInstance);
}

export function getPlayerState(connector: Lazy<ReactConnector>): TwitchPlayerState | null {
  return connector().find('twitch-player-state', node => node.setSrc && node.setInitialPlaybackSettings);
}

export function resetPlayer(connector: Lazy<ReactConnector>) {
  const player = getPlayer(connector)?.props?.mediaPlayerInstance;
  const playerState = getPlayerState(connector);
  if (!player) throw new Error('Could not find player');
  if (!playerState) throw new Error('Could not find player state');

  const sink = player.mediaSinkManager || player.core?.mediaSinkManager;
  if (sink?.video?._ffz_compressor) {
    const video = sink.video;
    const volume = video.volume ?? player.getVolume();
    const muted = player.isMuted();
    const newVideo = document.createElement('video') as ExtendedVideo;
    newVideo.volume = muted ? 0 : volume;
    newVideo.playsInline = true;
    video.replaceWith(newVideo);
    player.attachHTMLVideoElement(video);
    setImmediate(() => {
      player.setVolume(volume);
      player.setMuted(muted);
    });
  }

  playerState.setSrc({ isNewMediaPlayerInstance: true });
}

export function initWorkerHandler(connector: Lazy<ReactConnector>) {
  const player = getPlayer(connector);
  const worker = player?.props?.mediaPlayerInstance?.core?.worker;
  if (!worker || !player) throw new Error('No worker/player');

  if (Reflect.get(worker, 'ad:known')) return;
  Reflect.set(worker, 'ad:known', true);

  console.log('Listening on worker messages.');

  worker.addEventListener('message', ({ data }: { data: WorkerMessage }) => {
    if (typeof data !== 'object' || location.pathname.includes('videos/')) return;

    if (data.type === 'PlayerAnalyticsEvent') {
      const args: AnalyticsEventArgs = {properties: {...data.arg.properties}};
      if(args.properties.sink_buffer_size)
        args.properties.sink_buffer_size *= 1000;
      if (args.properties.sink_buffer_size && args.properties.sink_buffer_size > MinLatencySpeedup() * 1000) {
        if (args.properties.sink_buffer_size > MinLatencyReload() * 1000) resetPlayer(connector);
        else {
          const latencyToSkip = args.properties.sink_buffer_size - (KeepBuffer() * 1000);
          const video = document.querySelector('video')!;

          speedupPlayer(player!, 2);

          video.playbackRate = 2;
          // this is dank but whatever... the worker will always try to get us to playbackRate=1
          const skippa = () => {
            if(video.playbackRate !== 2) video.playbackRate = 2;
          }
          video.addEventListener('ratechange', skippa);
          setTimeout(() => {
            resetPlayerSpeed(player!, 1);
            video.removeEventListener('ratechange', skippa);
            video.playbackRate = 1;
          }, latencyToSkip);
        }
      }
    } else if (data.type === 'PlayerError') {
      resetPlayer(connector);
    }
  });
}

let skipPlaybackRateChange = false;
function speedupPlayer(player: TwitchPlayer, rate: number) {
  expectMonitor(player)?.setPlaybackRate?.(rate);
  skipPlaybackRateChange = true;
}
function resetPlayerSpeed(player: TwitchPlayer, rate: number) {
  skipPlaybackRateChange = false;
  expectMonitor(player)?.setPlaybackRate?.(rate);
}

function expectMonitor(player: TwitchPlayer) {
  const monitor = player.props?.mediaPlayerInstance?.core?.mediaSinkManager?.getCurrentSink?.().playbackMonitor;
  if(!monitor) return;

  overwriteMonitor(monitor);
  return monitor;
}

function overwriteMonitor(monitor: PlaybackMonitor) {
  if(!monitor.setPlaybackRate || monitor.setPlaybackRate.known) return;

  const base = monitor.setPlaybackRate;
  monitor.setPlaybackRate = function(...args) {
    if(skipPlaybackRateChange) return;
    base.apply(this, args);
  };
  monitor.setPlaybackRate.known = true;
}

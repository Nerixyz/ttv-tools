export enum Option {
  UserAgent = 'user-agent',
  MinLatencyReload = 'min-latency-reload',
  MinLatencySpeedup = 'min-latency-speedup',
  KeepBuffer = 'keep-buffer',
  OverridePlayer = 'override-player',
}
type OptionMap = {[x in Option]: string | number | boolean};
export const DefaultOptions: OptionMap = {
  [Option.UserAgent]: '',
  [Option.KeepBuffer]: 1.5,
  [Option.MinLatencyReload]: 4.5,
  [Option.MinLatencySpeedup]: 2.25,
  [Option.OverridePlayer]: false,
};

const optionMap = new Map<Option, string | number | boolean>();

(async () => {
  if(window.browser) {
    for(const [key, value] of Object.entries(await browser.storage.local.get())) {
      optionMap.set(key as Option, value);
    }
    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local') return;

      for (const [key, { newValue }] of Object.entries(changes)) {
        if (newValue === undefined) continue;
        optionMap.set(key as Option, newValue);
      }
    });
  } else {
    window.addEventListener('message', async ({ data }) => {
      if (typeof data !== 'string' || !data.startsWith('ttv:')) return;

      const actualPacket = JSON.parse(data.substring('ttv:'.length));
      if(actualPacket.type !== 'localStorage') return;
      for (const [key, value] of Object.entries(actualPacket.data)) {
        if (value === undefined) continue;
        optionMap.set(key as Option, value as string | number | boolean);
      }
    });
  }
})();

export function makeGetOption<T>(key: Option): () => T {
  return () => (optionMap.get(key) ?? DefaultOptions[key]) as any;
}

export const MinLatencySpeedup = makeGetOption<number>(Option.MinLatencySpeedup);
export const MinLatencyReload = makeGetOption<number>(Option.MinLatencyReload);
export const KeepBuffer = makeGetOption<number>(Option.KeepBuffer);
export const UserAgent = makeGetOption<string>(Option.UserAgent);
export const OverridePlayer = makeGetOption<boolean>(Option.OverridePlayer);

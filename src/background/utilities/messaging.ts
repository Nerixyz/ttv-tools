import { MessageMap } from '../../types';

export async function sendMessage<K extends keyof MessageMap>(type: K, data: MessageMap[K]) {
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

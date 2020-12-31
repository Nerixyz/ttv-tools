// this is just a middle man to load the context-script
const url = browser.runtime.getURL('context-script.js');
const el = document.createElement('script');
el.src = url;
el.id = 'ttv-adblock-ctx';
document.documentElement.prepend(el);

browser.runtime.onMessage.addListener(message =>
  postMessage(`ttv:${typeof message === 'string' ? message : JSON.stringify(message)}`, window.location.origin)
);

browser.storage.onChanged.addListener((changes, areaName) => {
  if(areaName !== 'local') return;

  postMessage(`ttv:${JSON.stringify({
    type: 'localStorage',
    data: Object.fromEntries(Object.entries(changes).map(([key, value]) => [key, value.newValue])),
  })}`, window.location.origin);
});

window.addEventListener('DOMContentLoaded', async () => {
  postMessage(`ttv:${JSON.stringify({
    type: 'localStorage',
    data: await browser.storage.local.get(),
  })}`, window.location.origin);
});

window.addEventListener('message', async ({data}) => {
  if(typeof data !== 'string' || !data.startsWith('ttv:')) return;

  const msg = JSON.parse(data.substring('ttv:'.length));
  if(msg.type !== 'clientId') return;

  await browser.storage.local.set({clientId: msg.data});
});

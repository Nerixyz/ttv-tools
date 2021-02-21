// this is just a middle man to load the context-script
import { ContentEventHandler } from 'beaverjs';
import { MessageMap } from './types';

const url = browser.runtime.getURL('context-script.js');
const el = document.createElement('script');
el.src = url;
el.id = 'ttv-adblock-ctx';
document.documentElement.prepend(el);

const eventListener = new ContentEventHandler<MessageMap>();

browser.storage.onChanged.addListener((changes, areaName) => {
  if(areaName !== 'local') return;

  eventListener.emitContext(
    'localStorage',
    Object.fromEntries(Object.entries(changes).map(([key, value]) => [key, value.newValue]))
  );
});

window.addEventListener('DOMContentLoaded', async () => {
  eventListener.emitContext('localStorage', await browser.storage.local.get());
});

eventListener.on('clientId', async id => {
  await browser.storage.local.set({clientId: id});
});

// this is just a middle man to load the context-script
const url = browser.runtime.getURL('context-script.js');
const el = document.createElement('script');
el.src = url;
el.id = 'ttv-adblock-ctx';
document.documentElement.prepend(el);

browser.runtime.onMessage.addListener(message =>
  postMessage(`ttv:${typeof message === 'string' ? message : JSON.stringify(message)}`, window.location.origin)
);

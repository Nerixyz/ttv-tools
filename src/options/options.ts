import { DefaultOptions, Option } from '../options';

document.addEventListener('DOMContentLoaded', async () => {
  const initialStorage = await browser.storage.local.get();
  setupOption({
    storageKey: Option.UserAgent,
    type: 'text',
    initialStorage,
  });
  setupOption({
    storageKey: Option.MinLatencyReload,
    type: 'range',
    initialStorage,
    range: ['s', 2, 10],
  });
  setupOption({
    storageKey: Option.MinLatencySpeedup,
    type: 'range',
    range: ['s', 1, 8],
    initialStorage,
  });
  setupOption({
    storageKey: Option.KeepBuffer,
    type: 'range',
    range: ['s', 0.1, 4],
    initialStorage
  });
  setupOption({
    storageKey: Option.OverridePlayer,
    type: 'boolean',
    initialStorage
  })
});

function setupOption({storageKey, type, initialStorage, range}: {
  storageKey: Option,
  type: 'boolean' | 'text' | 'range',
  initialStorage: Record<string, string | boolean | number | undefined>,
  // unit, min, max, step
  range?: [string, number, number, number?],
}) {
  const el = document.querySelector<HTMLInputElement>(`#${storageKey}`);
  if(!el) throw new Error(`Failed to find #${storageKey}`);
  if(type === 'range' && !range) throw new Error('Expected a range');

  const rangeValueEl = document.querySelector(`#${storageKey}-value`);

  const assertCorrectType = (value: string | boolean | number) => {
    if(typeof value === 'string' && type !== 'text') throw new Error('Expected value to be a text');
    if(typeof value === 'boolean' && type !== 'boolean') throw new Error('Expected value to be a boolean');
    if(typeof value === 'number' && type !== 'range') throw new Error('Expected value to be a range');
  }

  const changeElementValue = (newValue: string | boolean | number) => {
    assertCorrectType(newValue);
    if(type === 'boolean') {
      el.checked = newValue as boolean;
    } else {
      el.value = newValue.toString();

      if(rangeValueEl) rangeValueEl.textContent = `${newValue}${range?.[0]}`;
    }
  };

  const getElementValue = () => {
    if(type === 'text') return el.value;
    else if(type === 'range') return Number(el.value) || 0;
    else return el.checked;
  }

  browser.storage.onChanged.addListener((changes, areaName) => {
    if(areaName !== 'local' || changes[storageKey] === undefined) return;
    changeElementValue(changes[storageKey].newValue);
  });

  el.addEventListener('input', async () => {
    const value = getElementValue();
    await browser.storage.local.set({
      [storageKey]: value
    });
  });

  if(range) {
    const [,min, max, step] = range;
    el.min = min.toString();
    el.max = max.toString();
    el.step = (step ?? (max - min) / 100).toString();
  }

  if(initialStorage[storageKey] !== undefined) {
    changeElementValue(initialStorage[storageKey] as string | boolean | number);
  } else {
    changeElementValue(DefaultOptions[storageKey]);
  }
}

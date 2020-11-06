export function lazyAsync<T>(fn: () => Promise<T>): LazyAsync<T> {
  let value: T | undefined = undefined;
  return async () => {
    if (value === undefined) return (value = await fn());
    return value;
  };
}

export function lazy<T>(fn: () => T): Lazy<T> {
  let value: T | undefined = undefined;
  return () => {
    if (value === undefined) return (value = fn());
    return value;
  };
}

export type Lazy<T> = () => T;
export type LazyAsync<T> = () => Promise<T>;

export function throttle(fn: () => void, delay: number): () => void {
  let lastInvocation = 0;
  return () => {
    const now = Date.now();
    if (now - lastInvocation < delay) return;
    lastInvocation = now;
    fn();
  };
}

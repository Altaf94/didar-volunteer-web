// Simple loading manager to track active fetch calls and notify subscribers
let count = 0;
const subscribers = new Set();

function notify() {
  subscribers.forEach((fn) => {
    try {
      fn(count);
    } catch (e) {
      // ignore subscriber errors
    }
  });
}

export function increment() {
  count += 1;
  notify();
}

export function decrement() {
  count = Math.max(0, count - 1);
  notify();
}

export function subscribe(fn) {
  subscribers.add(fn);
  // call immediately with current count
  fn(count);
  return () => subscribers.delete(fn);
}

export function getCount() {
  return count;
}

// Monkey-patch global fetch to auto-increment/decrement loading count
export function initFetchInterceptor() {
  if (typeof window === 'undefined' || !window.fetch || window.fetch.__loadingPatched) return;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async function (...args) {
    increment();
    try {
      const res = await originalFetch(...args);
      return res;
    } catch (err) {
      throw err;
    } finally {
      // ensure decrement even on error
      decrement();
    }
  };

  // mark as patched
  window.fetch.__loadingPatched = true;
}

export default {
  increment,
  decrement,
  subscribe,
  getCount,
  initFetchInterceptor,
};

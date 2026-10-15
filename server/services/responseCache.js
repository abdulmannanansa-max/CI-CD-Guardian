// Small process-local TTL cache with in-flight request deduplication.
const entries = new Map();
const MAX_ENTRIES = 500;

function cached(key, ttlMs, load, shouldCache = () => true) {
  const now = Date.now();
  const existing = entries.get(key);
  if (existing && existing.expiresAt > now) return existing.promise;

  const promise = Promise.resolve().then(load).then((value) => {
    if (!shouldCache(value) && entries.get(key)?.promise === promise) entries.delete(key);
    return value;
  }).catch((error) => {
    if (entries.get(key)?.promise === promise) entries.delete(key);
    throw error;
  });
  entries.set(key, { promise, expiresAt: now + ttlMs });

  if (entries.size > MAX_ENTRIES) {
    for (const [entryKey, entry] of entries) {
      if (entry.expiresAt <= now || entries.size > MAX_ENTRIES) entries.delete(entryKey);
      if (entries.size <= MAX_ENTRIES) break;
    }
  }
  return promise;
}

module.exports = { cached };

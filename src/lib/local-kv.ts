import { promises as fs } from 'fs';
import path from 'path';

type Store = {
  kv: Record<string, unknown>;
  sets: Record<string, string[]>;
  lists: Record<string, string[]>;
};

const DATA_DIR = process.env.LOCAL_KV_DIR || path.join(process.cwd(), '.local-data');
const DATA_FILE = path.join(DATA_DIR, 'local-kv.json');

async function loadStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Store;
    return {
      kv: parsed.kv || {},
      sets: parsed.sets || {},
      lists: parsed.lists || {},
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { kv: {}, sets: {}, lists: {} };
    }
    throw error;
  }
}

async function saveStore(store: Store): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
}

function resolveRange(list: string[], start: number, end: number): string[] {
  const size = list.length;
  const from = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
  const to = end < 0 ? size + end : end;
  const inclusiveEnd = Math.min(to, size - 1);
  if (inclusiveEnd < from) return [];
  return list.slice(from, inclusiveEnd + 1);
}

export const localKv = {
  async get<T>(key: string): Promise<T | null> {
    const store = await loadStore();
    return (store.kv[key] as T) ?? null;
  },
  async set(key: string, value: unknown): Promise<void> {
    const store = await loadStore();
    store.kv[key] = value;
    await saveStore(store);
  },
  async sadd(key: string, member: string): Promise<number> {
    const store = await loadStore();
    const set = store.sets[key] || [];
    if (!set.includes(member)) {
      set.push(member);
      store.sets[key] = set;
      await saveStore(store);
      return 1;
    }
    return 0;
  },
  async smembers(key: string): Promise<string[]> {
    const store = await loadStore();
    return store.sets[key] || [];
  },
  async rpush(key: string, member: string): Promise<number> {
    const store = await loadStore();
    const list = store.lists[key] || [];
    list.push(member);
    store.lists[key] = list;
    await saveStore(store);
    return list.length;
  },
  async lrange(key: string, start: number, end: number): Promise<string[]> {
    const store = await loadStore();
    const list = store.lists[key] || [];
    return resolveRange(list, start, end);
  },
};

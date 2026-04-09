import { openDB, DBSchema, IDBPDatabase } from 'idb';

export const DAILY_ITEM_LIMIT = 10;

export type ItemStatus = 'pending' | 'buy' | 'repair' | 'not_needed';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'data';
  content: string;
}

export interface MottainaiItem {
  id?: number;
  name: string;
  status: ItemStatus;
  decisionReason?: string;
  createdAt: number; // timestamp
  chatHistory: ChatMessage[];
}

interface MottainaiDB extends DBSchema {
  items: {
    value: MottainaiItem;
    key: number;
    indexes: { 'by-date': number };
  };
}

let dbPromise: Promise<IDBPDatabase<MottainaiDB>> | null = null;

if (typeof window !== 'undefined') {
  dbPromise = openDB<MottainaiDB>('mottainai-store', 1, {
    upgrade(db) {
      const store = db.createObjectStore('items', {
        keyPath: 'id',
        autoIncrement: true,
      });
      store.createIndex('by-date', 'createdAt');
    },
  });
}

export async function addItem(name: string): Promise<number | undefined> {
  if (!dbPromise) return;
  const db = await dbPromise;

  if (!(await canAddItemToday())) {
    throw new Error(`You have reached your limit of ${DAILY_ITEM_LIMIT} items per day.`);
  }

  return db.add('items', {
    name,
    status: 'pending',
    createdAt: Date.now(),
    chatHistory: [],
  });
}

export async function getItems(): Promise<MottainaiItem[]> {
  if (!dbPromise) return [];
  const db = await dbPromise;
  return db.getAllFromIndex('items', 'by-date');
}

export async function getItem(id: number): Promise<MottainaiItem | undefined> {
  if (!dbPromise) return;
  const db = await dbPromise;
  return db.get('items', id);
}

export async function updateItem(id: number, updates: Partial<MottainaiItem>): Promise<number | undefined> {
  if (!dbPromise) return;
  const db = await dbPromise;
  const existing = await db.get('items', id);
  if (!existing) return;

  const updatedItem = { ...existing, ...updates };
  return db.put('items', updatedItem);
}

export async function canAddItemToday(): Promise<boolean> {
  if (!dbPromise) return false;
  const db = await dbPromise;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();

  const allItems = await db.getAllFromIndex('items', 'by-date');
  const itemsToday = allItems.filter(item => item.createdAt >= todayStartMs);

  return itemsToday.length < DAILY_ITEM_LIMIT;
}

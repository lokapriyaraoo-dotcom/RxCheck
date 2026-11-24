import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

export type SavedReview = {
  id: string;
  title: string;
  createdAt: string;
  patient: Record<string, unknown>;
  medicines: unknown[];
  currentMedsText?: string;
  status?: string;
};

const KEY_NAME = 'rxcheck.history.sqlcipher.key.v1';
let db: SQLite.SQLiteDatabase | null = null;
let ready: Promise<SQLite.SQLiteDatabase> | null = null;

function hex(bytes: Uint8Array) { return Array.from(bytes, value => value.toString(16).padStart(2, '0')).join(''); }

export async function getEncryptedHistoryDb() {
  if (db) return db;
  if (ready) return ready;
  ready = (async () => {
    let key = await SecureStore.getItemAsync(KEY_NAME);
    if (!key) {
      key = hex(Crypto.getRandomBytes(32));
      await SecureStore.setItemAsync(KEY_NAME, key, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    }
    const opened = await SQLite.openDatabaseAsync('rxcheck-private-history.db');
    await opened.execAsync(`PRAGMA key = "x'${key}'"; PRAGMA cipher_memory_security = ON;`);
    await opened.execAsync(`
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        payload TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS reviews_created_at ON reviews(created_at DESC);
    `);
    db = opened;
    return opened;
  })().catch(error => { ready = null; throw error; });
  return ready;
}

export async function saveReview(review: SavedReview) {
  const database = await getEncryptedHistoryDb();
  await database.runAsync(
    'INSERT OR REPLACE INTO reviews (id, title, created_at, payload) VALUES (?, ?, ?, ?)',
    review.id, review.title, review.createdAt, JSON.stringify(review)
  );
}

export async function listReviews(): Promise<SavedReview[]> {
  const database = await getEncryptedHistoryDb();
  const rows = await database.getAllAsync<{payload:string}>('SELECT payload FROM reviews ORDER BY created_at DESC');
  return rows.flatMap(row => { try { return [JSON.parse(row.payload) as SavedReview]; } catch { return []; } });
}

export async function getReview(id: string): Promise<SavedReview | null> {
  const database = await getEncryptedHistoryDb();
  const row = await database.getFirstAsync<{payload:string}>('SELECT payload FROM reviews WHERE id=?', id);
  if (!row) return null;
  try { return JSON.parse(row.payload) as SavedReview; } catch { return null; }
}

export async function deleteReview(id: string) {
  const database = await getEncryptedHistoryDb();
  await database.runAsync('DELETE FROM reviews WHERE id=?', id);
}

export async function clearReviews() {
  const database = await getEncryptedHistoryDb();
  await database.runAsync('DELETE FROM reviews');
}

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Facility } from '../types';

interface JalSaafDB extends DBSchema {
  facilities: {
    key: string;
    value: Facility & { cached_at: number };
    indexes: { 'by-type': string };
  };
  tickets: {
    key: string;
    value: {
      id: string;
      facility_id: string;
      device_id: string;
      reported_status: string;
      comment: string;
      created_at: string;
      ticket_number: string;
      synced: boolean;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<JalSaafDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<JalSaafDB>('jalsaaf-offline', 1, {
      upgrade(db) {
        const facilityStore = db.createObjectStore('facilities', { keyPath: 'id' });
        facilityStore.createIndex('by-type', 'type');
        db.createObjectStore('tickets', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

export async function cacheFacilities(facilities: Facility[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('facilities', 'readwrite');
  const now = Date.now();
  for (const f of facilities) {
    await tx.store.put({ ...f, cached_at: now });
  }
  await tx.done;
}

export async function getCachedFacilities(): Promise<Facility[]> {
  const db = await getDB();
  const all = await db.getAll('facilities');
  // Only return facilities cached within the last 24 hours
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return all
    .filter((f) => f.cached_at >= cutoff)
    .map(({ cached_at: _, ...rest }) => rest);
}

export async function cacheTicket(ticket: {
  id: string;
  facility_id: string;
  device_id: string;
  reported_status: string;
  comment: string;
  created_at: string;
  ticket_number: string;
}): Promise<void> {
  const db = await getDB();
  await db.put('tickets', { ...ticket, synced: false });
}

export async function getUnsyncedTickets() {
  const db = await getDB();
  const all = await db.getAll('tickets');
  return all.filter((t) => !t.synced);
}

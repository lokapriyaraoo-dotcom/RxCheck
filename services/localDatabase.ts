import * as SQLite from 'expo-sqlite';
import { findClosestMedicineName, cleanOcrMedicineName } from './medicineNameMatcher';

export type MedicineReference = { name: string; ingredient: string; aliases: string[]; source: string };
export type IngredientCheck = { medicine: string; ingredient: string | null; status: 'matched' | 'unknown' };

const STARTER_CATALOG: MedicineReference[] = [
  {name:'paracetamol',ingredient:'paracetamol',aliases:['acetaminophen'],source:'RxCheck starter generic synonym set; verify before clinical use'},
  {name:'acetaminophen',ingredient:'paracetamol',aliases:['paracetamol'],source:'RxCheck starter generic synonym set; verify before clinical use'},
  {name:'ibuprofen',ingredient:'ibuprofen',aliases:[],source:'RxCheck starter generic-name record; verify before clinical use'},
  {name:'diclofenac',ingredient:'diclofenac',aliases:[],source:'RxCheck starter generic-name record; verify before clinical use'},
  {name:'aspirin',ingredient:'acetylsalicylic acid',aliases:['acetylsalicylic acid'],source:'RxCheck starter generic synonym set; verify before clinical use'},
  {name:'acetylsalicylic acid',ingredient:'acetylsalicylic acid',aliases:['aspirin'],source:'RxCheck starter generic synonym set; verify before clinical use'},
  {name:'metformin',ingredient:'metformin',aliases:[],source:'RxCheck starter generic-name record; verify before clinical use'},
  {name:'amoxicillin',ingredient:'amoxicillin',aliases:[],source:'RxCheck starter generic-name record; verify before clinical use'},
  {name:'cetirizine',ingredient:'cetirizine',aliases:[],source:'RxCheck starter generic-name record; verify before clinical use'},
  {name:'omeprazole',ingredient:'omeprazole',aliases:[],source:'RxCheck starter generic-name record; verify before clinical use'},
  {name:'pantoprazole',ingredient:'pantoprazole',aliases:[],source:'RxCheck starter generic-name record; verify before clinical use'},
  {name:'atorvastatin',ingredient:'atorvastatin',aliases:[],source:'RxCheck starter generic-name record; verify before clinical use'},
];

let database: SQLite.SQLiteDatabase | null = null;
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

export async function getLocalDatabase() {
  if (database) return database;
  database = await SQLite.openDatabaseAsync('rxcheck-reference.db');
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS medicine_catalog (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL UNIQUE,
      ingredient TEXT NOT NULL,
      aliases_json TEXT NOT NULL,
      source TEXT NOT NULL,
      reviewed INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS interaction_review (
      id INTEGER PRIMARY KEY NOT NULL,
      ingredient_a TEXT NOT NULL,
      ingredient_b TEXT NOT NULL,
      severity TEXT NOT NULL,
      evidence TEXT NOT NULL,
      reviewer TEXT NOT NULL,
      reviewed_at TEXT NOT NULL,
      source TEXT NOT NULL,
      UNIQUE(ingredient_a, ingredient_b)
    );
    CREATE TABLE IF NOT EXISTS reference_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
  for (const item of STARTER_CATALOG) {
    await database.runAsync(
      'INSERT OR IGNORE INTO medicine_catalog (name, ingredient, aliases_json, source, reviewed) VALUES (?, ?, ?, ?, 0)',
      item.name, item.ingredient, JSON.stringify(item.aliases), item.source
    );
  }
  return database;
}

export async function resolveMedicineIngredients(names: string[]): Promise<IngredientCheck[]> {
  const db = await getLocalDatabase();
  const rows = await db.getAllAsync<{name:string;ingredient:string;aliases_json:string}>('SELECT name, ingredient, aliases_json FROM medicine_catalog');
  const index = new Map<string,string>();
  for (const row of rows) {
    index.set(normalize(row.name), row.ingredient);
    let aliases: string[] = [];
    try { aliases = JSON.parse(row.aliases_json); } catch { aliases = []; }
    aliases.forEach(alias => index.set(normalize(alias), row.ingredient));
  }
  return names.map(medicine => {
    const key = normalize(medicine.replace(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml)\b/ig, ''));
    const ingredient = index.get(key) || null;
    return {medicine, ingredient, status: ingredient ? 'matched' : 'unknown'};
  });
}

export async function findReviewedInteraction(a: string, b: string) {
  const db = await getLocalDatabase();
  const rows = await db.getAllAsync<{severity:string;evidence:string;reviewer:string;reviewed_at:string;source:string}>(
    'SELECT severity, evidence, reviewer, reviewed_at, source FROM interaction_review WHERE (ingredient_a=? AND ingredient_b=?) OR (ingredient_a=? AND ingredient_b=?) LIMIT 1',
    a, b, b, a
  );
  return rows[0] || null;
}

export const localCatalogCoverage = STARTER_CATALOG.length;

/** Suggests a local generic-name correction; callers must ask the user to confirm it. */
export async function suggestMedicineNameCorrection(rawName: string): Promise<string | null> {
  const db = await getLocalDatabase();
  const rows = await db.getAllAsync<{name:string;aliases_json:string}>('SELECT name, aliases_json FROM medicine_catalog');
  const candidates = rows.flatMap(row => { let aliases:string[]=[]; try { aliases=JSON.parse(row.aliases_json); } catch {} return [row.name,...aliases]; });
  const match = findClosestMedicineName(cleanOcrMedicineName(rawName), candidates);
  if (!match) return null;
  return rows.find(row => row.name.toLowerCase() === match.toLowerCase())?.name || match;
}

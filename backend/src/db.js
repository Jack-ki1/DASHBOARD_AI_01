import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";

const dbPath = process.env.DATABASE_PATH
  ? resolve(process.env.DATABASE_PATH)
  : resolve(new URL("../data/app.db", import.meta.url).pathname);
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL;");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS dashboards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    doc TEXT NOT NULL,
    published INTEGER NOT NULL DEFAULT 0,
    favorite INTEGER NOT NULL DEFAULT 0,
    archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_dashboards_user ON dashboards(user_id, updated_at DESC);
`);

const now = () => new Date().toISOString();

export function createUser(email, passwordHash) {
  const id = randomUUID();
  db.prepare("INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)").run(
    id,
    email,
    passwordHash,
    now(),
  );
  return { id, email };
}

export function findUserByEmail(email) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email) ?? null;
}

export function toDashboard(row) {
  const doc = JSON.parse(row.doc);
  return {
    ...doc,
    id: row.id,
    name: row.name,
    published: row.published === 1,
    favorite: row.favorite === 1,
    archived: row.archived === 1,
    updatedAt: Date.parse(row.updated_at),
  };
}

export function listDashboards(userId) {
  return db
    .prepare("SELECT * FROM dashboards WHERE user_id = ? ORDER BY updated_at DESC")
    .all(userId)
    .map(toDashboard);
}

export function getDashboard(id, userId) {
  const row = db.prepare("SELECT * FROM dashboards WHERE id = ?").get(id);
  if (!row) return null;
  if (userId && row.user_id !== userId) return null;
  return { row, dashboard: toDashboard(row) };
}

/** Create or replace a dashboard owned by userId. */
export function saveDashboard(userId, dashboard) {
  const id =
    typeof dashboard.id === "string" && dashboard.id.length > 0 ? dashboard.id : randomUUID();
  const existing = db.prepare("SELECT * FROM dashboards WHERE id = ?").get(id);
  if (existing && existing.user_id !== userId) return { conflict: true };
  const stamp = now();
  const createdAt = existing ? existing.created_at : stamp;
  const doc = {
    ...dashboard,
    id,
    name: dashboard.name,
    published: !!dashboard.published,
    favorite: !!dashboard.favorite,
    archived: !!dashboard.archived,
    updatedAt: Date.parse(stamp),
  };
  db.prepare(
    `INSERT INTO dashboards (id, user_id, name, doc, published, favorite, archived, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name, doc = excluded.doc, published = excluded.published,
       favorite = excluded.favorite, archived = excluded.archived, updated_at = excluded.updated_at`,
  ).run(
    id,
    userId,
    doc.name,
    JSON.stringify(doc),
    doc.published ? 1 : 0,
    doc.favorite ? 1 : 0,
    doc.archived ? 1 : 0,
    createdAt,
    stamp,
  );
  return { dashboard: doc, created: !existing };
}

export function deleteDashboard(id, userId) {
  const found = getDashboard(id, userId);
  if (!found) return false;
  db.prepare("DELETE FROM dashboards WHERE id = ?").run(id);
  return true;
}

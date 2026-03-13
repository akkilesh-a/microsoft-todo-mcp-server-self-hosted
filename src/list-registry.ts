import Database from "better-sqlite3"
import { join } from "path"

interface ListRecord {
  id: string
  displayName: string
  wellknownListName: string
  isOwner: number
  isShared: number
  createdAt: string
}

export interface ListEntry {
  id: string
  displayName: string
  wellknownListName: string
  isOwner: boolean
  isShared: boolean
  createdAt: string
}

const DB_PATH = process.env.LIST_DB_PATH || join(process.cwd(), "lists.db")

let db: Database.Database | null = null

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.exec(`
      CREATE TABLE IF NOT EXISTS lists (
        id                TEXT PRIMARY KEY,
        displayName       TEXT NOT NULL,
        wellknownListName TEXT DEFAULT 'none',
        isOwner           INTEGER DEFAULT 1,
        isShared          INTEGER DEFAULT 0,
        createdAt         TEXT NOT NULL
      )
    `)
  }
  return db
}

function toEntry(row: ListRecord): ListEntry {
  return {
    id: row.id,
    displayName: row.displayName,
    wellknownListName: row.wellknownListName,
    isOwner: row.isOwner === 1,
    isShared: row.isShared === 1,
    createdAt: row.createdAt,
  }
}

export function saveList(list: {
  id: string
  displayName: string
  wellknownListName?: string
  isOwner?: boolean
  isShared?: boolean
}): void {
  getDb()
    .prepare(
      `INSERT OR REPLACE INTO lists (id, displayName, wellknownListName, isOwner, isShared, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      list.id,
      list.displayName,
      list.wellknownListName ?? "none",
      list.isOwner !== false ? 1 : 0,
      list.isShared ? 1 : 0,
      new Date().toISOString(),
    )
}

export function getAllLists(): ListEntry[] {
  return (getDb().prepare("SELECT * FROM lists ORDER BY createdAt ASC").all() as ListRecord[]).map(toEntry)
}

export function updateList(id: string, displayName: string): void {
  getDb().prepare("UPDATE lists SET displayName = ? WHERE id = ?").run(displayName, id)
}

export function removeList(id: string): void {
  getDb().prepare("DELETE FROM lists WHERE id = ?").run(id)
}

export function getListById(id: string): ListEntry | undefined {
  const row = getDb().prepare("SELECT * FROM lists WHERE id = ?").get(id) as ListRecord | undefined
  return row ? toEntry(row) : undefined
}

// Merge API-returned lists (well-known) with locally tracked lists, deduplicating by ID
export function mergeLists(apiLists: { id: string; displayName: string; wellknownListName?: string; isOwner?: boolean; isShared?: boolean }[]): ListEntry[] {
  // Ensure all API-returned lists are persisted locally
  for (const list of apiLists) {
    saveList(list)
  }
  return getAllLists()
}

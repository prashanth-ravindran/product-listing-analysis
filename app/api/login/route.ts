import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sqlite3 from "sqlite3";
import { NextResponse } from "next/server";

const ADMIN_USER = process.env.AUTH_ADMIN_USER || "admin";
const ADMIN_PASS = process.env.AUTH_ADMIN_PASS || "xtract1234";
const DEFAULT_DB_PATH = process.env.AUTH_DB_PATH || "/tmp/auth.db";

function ensureDir(dbPath: string) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function withDb<T>(dbPath: string, fn: (db: sqlite3.Database) => Promise<T>) {
  ensureDir(dbPath);
  const db = new sqlite3.Database(dbPath);
  try {
    return await fn(db);
  } finally {
    db.close();
  }
}

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function seedAdmin(db: sqlite3.Database) {
  await run(
    db,
    `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    );
  `
  );
  await run(
    db,
    `INSERT OR REPLACE INTO users (username, password_hash) VALUES (?, ?);`,
    [ADMIN_USER, hashPassword(ADMIN_PASS)]
  );
}

function run(db: sqlite3.Database, sql: string, params: sqlite3.RunResult["bind"] = []) {
  return new Promise<void>((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function get(
  db: sqlite3.Database,
  sql: string,
  params: sqlite3.RunResult["bind"] = []
): Promise<Record<string, unknown> | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as Record<string, unknown> | undefined);
    });
  });
}

export async function POST(request: Request) {
  const dbPath = DEFAULT_DB_PATH;

  try {
    const body = await request.json();
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "").trim();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 }
      );
    }

    return await withDb(dbPath, async (db) => {
      await seedAdmin(db);
      const row = await get(
        db,
        `SELECT password_hash as hash FROM users WHERE username = ? LIMIT 1;`,
        [username]
      );

      if (!row) {
        return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
      }

      const storedHash = String(row.hash || "");
      if (storedHash !== hashPassword(password)) {
        return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
      }

      return NextResponse.json({ ok: true, user: username });
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }
    return NextResponse.json(
      { error: `Login failed: ${error instanceof Error ? error.message : "unknown error"}` },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 });
}

import sqlite3 from "sqlite3";
import { promisify } from "util";
import path from "path";

class SQLiteDatabase {
  private db: sqlite3.Database;

  constructor(dbPath: string = "./ai_chat.db") {
    this.db = new sqlite3.Database(dbPath);
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (sql.trim().toLowerCase().startsWith("select")) {
        this.db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve({ rows });
        });
      } else {
        this.db.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ rows: [{ id: this.lastID }] });
        });
      }
    });
  }

  async end(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

const sqliteDb = new SQLiteDatabase();

// Initialize tables
const initTables = async () => {
  try {
    await sqliteDb.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await sqliteDb.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        conversation_id TEXT NOT NULL,
        sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
        text TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id)
      )
    `);

    await sqliteDb.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)
    `);

    console.log("✅ SQLite database initialized");
  } catch (error) {
    console.error("❌ SQLite initialization failed:", error);
  }
};

// Initialize on import
initTables();

export default sqliteDb;

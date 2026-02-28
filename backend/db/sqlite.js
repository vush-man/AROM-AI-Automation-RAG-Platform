const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const dbPath = path.join(__dirname, "slingshot.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err);
  } else {
    console.log("Connected to SQLite database");
  }
});

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON");

// Auto-create tables from schema on startup
const schemaPath = path.join(__dirname, "schema.sql");
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, "utf-8");

  // Remove SQL comments, then split by semicolons
  const cleaned = schema
    .replace(/--.*$/gm, "") // remove single-line comments
    .replace(/\r\n/g, "\n"); // normalize line endings

  const statements = cleaned
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  db.serialize(() => {
    for (const stmt of statements) {
      db.run(stmt + ";", (err) => {
        if (err) {
          console.error("Schema error:", err.message);
        }
      });
    }
  });
}

module.exports = db;

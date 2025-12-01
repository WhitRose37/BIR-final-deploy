/**
 * Drop & recreate MySQL database and run Prisma setup + optional seed.
 * WARNING: destructive — this will DROP the configured database.
 *
 * Usage:
 * 1) Create .env with DATABASE_URL="mysql://USER:PASS@HOST:PORT/DBNAME"
 * 2) npm install mysql2 dotenv
 * 3) node scripts/reset-db-mysql.js
 *
 * The script:
 * - parses DATABASE_URL
 * - connects to MySQL server (no DB specified)
 * - DROP DATABASE IF EXISTS `<DBNAME>`
 * - CREATE DATABASE `<DBNAME>` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
 * - runs: npx prisma generate
 * - runs: npx prisma db push
 * - optional: runs scripts/seed-parts.js if exists
 */
const { execSync } = require("child_process");
const fs = require("fs");
const { URL } = require("url");

require("dotenv").config();

const raw = process.env.DATABASE_URL;
if (!raw) {
  console.error("DATABASE_URL not set in environment (.env). Aborting.");
  process.exit(1);
}

if (!raw.startsWith("mysql://")) {
  console.error("DATABASE_URL must start with mysql:// — aborting to avoid accidental drops.");
  console.error("Current DATABASE_URL:", raw);
  process.exit(1);
}

let url;
try {
  url = new URL(raw);
} catch (e) {
  console.error("Failed to parse DATABASE_URL:", e.message || e);
  process.exit(1);
}

const user = decodeURIComponent(url.username || "root");
const password = decodeURIComponent(url.password || "");
const host = url.hostname || "localhost";
const port = url.port || "3306";
const dbName = (url.pathname || "").replace(/^\//, "");

if (!dbName) {
  console.error("Database name not found in DATABASE_URL. Aborting.");
  process.exit(1);
}

// Confirm with user
function askConfirm(prompt, cb) {
  process.stdout.write(prompt + " (type YES to confirm) ");
  process.stdin.setEncoding("utf8");
  process.stdin.once("data", function(data) {
    const v = String(data || "").trim();
    cb(v === "YES");
  });
}

askConfirm(`This will DESTROY database "${dbName}" on ${host}:${port}. Proceed?`, async (ok) => {
  if (!ok) {
    console.log("Aborted by user.");
    process.exit(0);
  }

  const mysql = require("mysql2/promise");
  let conn;
  try {
    conn = await mysql.createConnection({
      host,
      port: Number(port),
      user,
      password,
      multipleStatements: true,
    });

    console.log(`Dropping database if exists: ${dbName}`);
    await conn.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
    console.log(`Creating database: ${dbName}`);
    await conn.query(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log("✅ Database dropped and recreated successfully.");
  } catch (err) {
    console.error("❌ MySQL operation failed:", err?.message || err);
    process.exit(1);
  } finally {
    if (conn) try { await conn.end(); } catch {}
  }

  try {
    console.log("Running: npx prisma generate");
    execSync("npx prisma generate", { stdio: "inherit" });

    console.log("Running: npx prisma db push");
    execSync("npx prisma db push", { stdio: "inherit" });

    const seedPath = "scripts/seed-parts.js";
    if (fs.existsSync(seedPath)) {
      console.log(`Running seed: node ${seedPath}`);
      execSync(`node ${seedPath}`, { stdio: "inherit" });
    } else {
      console.log("No seed script found at scripts/seed-parts.js — skipping seed.");
    }

    console.log("🎉 Reset complete. Database is ready.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Post-create step failed:", err?.message || err);
    process.exit(1);
  }
});

/**
 * Interactive DB drop script (MySQL)
 * - Reads DATABASE_URL from .env
 * - Lists available databases (excluding system DBs)
 * - Prompts user to choose which DB to drop
 * - Requires exact typed confirmation ("YES") before dropping
 *
 * Usage:
 * 1) npm install mysql2 dotenv
 * 2) Ensure .env has DATABASE_URL="mysql://USER:PASS@HOST:PORT/"
 *    (you can include a database name but the script will ignore it and list server DBs)
 * 3) node scripts/drop-db-interactive.js
 *
 * WARNING: destructive. Backup the DB first.
 */
const readline = require("readline");
const { URL } = require("url");
require("dotenv").config();
const mysql = require("mysql2/promise");

const SYS_DBS = new Set(["information_schema", "mysql", "performance_schema", "sys"]);

function mask(s) {
  if (!s) return s;
  try {
    const u = new URL(s);
    if (u.password) u.password = "********";
    if (u.username) u.username = "****";
    return u.toString();
  } catch {
    return s;
  }
}

const raw = process.env.DATABASE_URL;
if (!raw) {
  console.error("DATABASE_URL not set in .env. Create .env with: DATABASE_URL=\"mysql://USER:PASS@HOST:PORT/\"");
  process.exit(1);
}
if (!raw.startsWith("mysql://")) {
  console.error("DATABASE_URL must start with mysql:// (current: " + mask(raw) + ")");
  process.exit(1);
}

let url;
try {
  url = new URL(raw);
} catch (e) {
  console.error("Invalid DATABASE_URL:", e.message || e);
  process.exit(1);
}

const host = url.hostname || "localhost";
const port = url.port || "3306";
const user = decodeURIComponent(url.username || "root");
const password = decodeURIComponent(url.password || "");

async function ask(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(prompt, (ans) => { rl.close(); res(ans.trim()); }));
}

(async () => {
  let conn;
  try {
    conn = await mysql.createConnection({ host, port: Number(port), user, password });
  } catch (err) {
    console.error("Failed to connect to MySQL server:", err?.message || err);
    process.exit(1);
  }

  try {
    const [rows] = await conn.query("SHOW DATABASES");
    const dbs = rows.map(r => Object.values(r)[0]).filter(n => !SYS_DBS.has(n));
    if (!dbs.length) {
      console.log("No non-system databases found on server.");
      await conn.end();
      process.exit(0);
    }

    console.log("Databases found:");
    dbs.forEach((d, i) => console.log(`  [${i+1}] ${d}`));

    const pick = await ask(`Enter database number or name to DROP (or blank to cancel): `);
    if (!pick) {
      console.log("Cancelled.");
      await conn.end();
      process.exit(0);
    }

    let target;
    const idx = Number(pick);
    if (!Number.isNaN(idx) && idx >= 1 && idx <= dbs.length) target = dbs[idx-1];
    else if (dbs.includes(pick)) target = pick;
    else {
      console.error("Invalid selection. Aborting.");
      await conn.end();
      process.exit(1);
    }

    console.log(`Selected database: ${target}`);
    console.log("!!! THIS IS DESTRUCTIVE !!!");
    console.log(`Recommended: backup before proceeding (mysqldump or other).`);

    const confirm = await ask(`Type YES to confirm DROP DATABASE \`${target}\`: `);
    if (confirm !== "YES") {
      console.log("Confirmation not provided. Aborted.");
      await conn.end();
      process.exit(0);
    }

    // Perform drop
    await conn.query(`DROP DATABASE IF EXISTS \`${target}\``);
    console.log(`✅ Database ${target} dropped.`);

  } catch (err) {
    console.error("Error:", err?.message || err);
    process.exit(1);
  } finally {
    if (conn) try { await conn.end(); } catch {}
  }
})();

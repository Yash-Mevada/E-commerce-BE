import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const migrate = async () => {
  let client;
  try {
    // debugger
    client = await pool.connect();
    // Path to the SQL file in the root migrations folder
    const migrationFilePath = path.join(__dirname, "../../migrations/001_create_users_table.sql");

    if (!fs.existsSync(migrationFilePath)) {
      console.error(`❌ Migration file not found at: ${migrationFilePath}`);
      return;
    }

    const migrationSql = fs.readFileSync(migrationFilePath, "utf8");

    console.log("🚀 Starting User Table migration...");
    await client.query(migrationSql);
    console.log("✅ Migration completed successfully!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    if (client) client.release();
    await pool.end();
    process.exit(0);
  }
};

migrate();

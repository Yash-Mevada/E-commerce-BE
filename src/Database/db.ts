import { Pool } from "pg"


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  }
})


export const connectDB = async () => {
  try {
    const client = await pool.connect()
    console.log("Database connected successfully")
    client.release()
  } catch (error) {
    console.error("Error connecting to database", error)
    process.exit(1)
  }
}
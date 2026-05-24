import { Pool } from "pg";
import config from "../config";

const pool = new Pool({
  connectionString: config.connection_string,
});

export const initDB = async () => {
  try {
    await pool.query(`
       CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY, 
            name VARCHAR(20), 
            email VARCHAR(30) UNIQUE NOT NULL,
            password TEXT NOT NULL,role VARCHAR(10) DEFAULT 'contributor',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log("DB connected successfully!!!")
  } catch (error: any) {
    console.log(error)
  }
};

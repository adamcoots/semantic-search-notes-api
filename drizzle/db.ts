import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

import { config } from 'dotenv';

config(); // <-- this will load .env into process.env

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

export const db = drizzle(pool);

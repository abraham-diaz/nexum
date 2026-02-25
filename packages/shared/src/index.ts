import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import dotenv from 'dotenv';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

export { Prisma } from '@prisma/client';
export type { Database, Property, Row, Cell, PropertyType } from '@prisma/client';

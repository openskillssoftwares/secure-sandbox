import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Secure database connection (for user data)
export const securePool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'secure_pentest_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

// Vulnerable database connection (for practice)
export const vulnerablePool = new Pool({
  host: process.env.VULN_DB_HOST || 'localhost',
  port: parseInt(process.env.VULN_DB_PORT || '5433'),
  database: process.env.VULN_DB_NAME || 'vulnerable_practice_db',
  user: process.env.VULN_DB_USER || 'vuln_user',
  password: process.env.VULN_DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test secure database connection
export async function testSecureConnection(): Promise<boolean> {
  try {
    const client = await securePool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Secure database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Secure database connection failed:', error);
    return false;
  }
}

// Test vulnerable database connection
export async function testVulnerableConnection(): Promise<boolean> {
  try {
    const client = await vulnerablePool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Vulnerable database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Vulnerable database connection failed:', error);
    return false;
  }
}

// Execute query on secure database with parameterized queries
export async function querySecure(text: string, params?: any[]): Promise<any> {
  const start = Date.now();
  try {
    const result = await securePool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed secure query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Secure query error:', error);
    throw error;
  }
}

// Execute query on vulnerable database (intentionally allows unsafe queries for practice)
export async function queryVulnerable(
  text: string,
  params?: any[],
  level: 'easy' | 'medium' | 'hard' | 'impossible' = 'easy'
): Promise<any> {
  try {
    const result = await vulnerablePool.query(text, params);
    return result;
  } catch (error) {
    console.error('Vulnerable query error:', error);
    throw error;
  }
}

// Get a client from secure pool for transactions
export async function getSecureClient(): Promise<PoolClient> {
  return await securePool.connect();
}

// Get a client from vulnerable pool for transactions
export async function getVulnerableClient(): Promise<PoolClient> {
  return await vulnerablePool.connect();
}

// Graceful shutdown
export async function closeConnections(): Promise<void> {
  await securePool.end();
  await vulnerablePool.end();
  console.log('Database connections closed');
}

// Handle process termination
process.on('SIGINT', async () => {
  await closeConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeConnections();
  process.exit(0);
});

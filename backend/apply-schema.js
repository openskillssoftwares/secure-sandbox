const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║                                                               ║');
console.log('║   Phase 1 Database Setup                                      ║');
console.log('║                                                               ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

const config = {
  host: process.env.DB_SECURE_HOST || 'localhost',
  port: parseInt(process.env.DB_SECURE_PORT) || 5432,
  database: process.env.DB_SECURE_NAME || 'secure_pentest_db',
  user: process.env.DB_SECURE_USER || 'postgres',
  password: process.env.DB_SECURE_PASSWORD || 'postgres',
};

console.log('Database Configuration:');
console.log(`  Host: ${config.host}`);
console.log(`  Port: ${config.port}`);
console.log(`  Database: ${config.database}`);
console.log(`  User: ${config.user}`);
console.log('');

async function applySchema() {
  const client = new Client(config);
  
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected\n');

    const schemaPath = path.join(__dirname, 'database', 'schema-phase1-enhancements.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    console.log('Reading schema file...');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('✓ Schema file loaded\n');

    console.log('Applying schema enhancements...');
    await client.query(schema);
    console.log('✓ Schema applied successfully!\n');

    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                                                               ║');
    console.log('║   ✓ Database schema applied successfully!                    ║');
    console.log('║                                                               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    console.log('Tables created:');
    console.log('  • oauth_providers');
    console.log('  • user_profiles');
    console.log('  • bug_reports');
    console.log('  • blogs');
    console.log('  • user_roles');
    console.log('  • admin_activity_logs');
    console.log('  • leaderboard_cache\n');

    console.log('Next steps:');
    console.log('  1. Configure OAuth credentials in .env');
    console.log('  2. Start the server: npm run dev');
    console.log('  3. Test endpoints (see PHASE1_SETUP.md)\n');

  } catch (error) {
    console.error('\n✗ Error applying schema:');
    console.error(error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\nPostgreSQL is not running or not accessible.');
      console.error('Make sure PostgreSQL is installed and running.');
    } else if (error.code === '3D000') {
      console.error(`\nDatabase '${config.database}' does not exist.`);
      console.error('Create it first with:');
      console.error(`  CREATE DATABASE ${config.database};`);
    } else if (error.code === '28P01') {
      console.error('\nAuthentication failed. Check your database credentials in .env');
    } else if (error.message.includes('already exists')) {
      console.log('\n⚠ Note: Some tables already exist. This is normal if schema was previously applied.');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

applySchema();

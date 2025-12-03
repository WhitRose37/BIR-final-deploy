const { Client } = require('pg');
require('dotenv').config();

// Try port 6543
const connectionString = process.env.DATABASE_URL.replace('5432', '6543');

const client = new Client({
    connectionString: connectionString,
    connectionTimeoutMillis: 5000,
});

async function testConnection() {
    console.log('Testing connection to:', connectionString.replace(/:[^:]*@/, ':****@'));
    try {
        await client.connect();
        console.log('✅ Connection successful to port 6543!');
        const res = await client.query('SELECT NOW()');
        console.log('Time from DB:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('❌ Connection failed to port 6543:', err);
    }
}

testConnection();

const { Client } = require('pg');
require('dotenv').config();

// Use IPv6 address directly
const connectionString = 'postgresql://postgres:BIRTest12345@[2406:da1c:f42:ae0a:fc1b:8b08:2e74:4a9]:5432/postgres';

const client = new Client({
    connectionString: connectionString,
    connectionTimeoutMillis: 5000,
});

async function testConnection() {
    console.log('Testing connection to IPv6:', connectionString.replace(/:[^:]*@/, ':****@'));
    try {
        await client.connect();
        console.log('✅ Connection successful to IPv6!');
        const res = await client.query('SELECT NOW()');
        console.log('Time from DB:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('❌ Connection failed to IPv6:', err);
    }
}

testConnection();

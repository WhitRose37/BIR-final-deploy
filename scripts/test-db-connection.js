const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
});

async function testConnection() {
    console.log('Testing connection to:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@'));
    try {
        await client.connect();
        console.log('✅ Connection successful!');
        const res = await client.query('SELECT NOW()');
        console.log('Time from DB:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('❌ Connection failed:', err);
    }
}

testConnection();

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

// Read .env manually
let env = {};
try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) env[key.trim()] = val.trim();
    });
} catch (e) {
    console.error('Could not read .env file');
}

const SUPABASE_URL = 'http://192.168.1.220:54321';
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!ANON_KEY) {
    console.error('VITE_SUPABASE_ANON_KEY not found in .env');
    process.exit(1);
}

console.log('--- Debugging Connectivity ---');
console.log(`Target: ${SUPABASE_URL}`);
console.log(`Key found: ${ANON_KEY.substring(0, 10)}...`);

async function testFetch(path) {
    const url = `${SUPABASE_URL}${path}`;
    console.log(`\nFetching ${url}...`);
    const start = Date.now();
    try {
        const res = await fetch(url, {
            headers: {
                'apikey': ANON_KEY,
                'Authorization': `Bearer ${ANON_KEY}`
            }
        });
        const duration = Date.now() - start;
        console.log(`Status: ${res.status} (${duration}ms)`);
        if (res.ok) {
            const text = await res.text();
            console.log('Body Preview:', text.substring(0, 200));
        } else {
            console.log('Error Text:', await res.text());
        }
    } catch (err) {
        const duration = Date.now() - start;
        console.error(`FAILED (${duration}ms):`, err.message);
        if (err.cause) console.error('Cause:', err.cause);
    }
}

async function run() {
    await testFetch('/');
    await testFetch('/rest/v1/hub_apps?select=*');
}

run();

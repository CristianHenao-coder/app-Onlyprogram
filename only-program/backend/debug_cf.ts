import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_KEY = process.env.CLOUDFLARE_API_KEY;
const API_EMAIL = process.env.CLOUDFLARE_EMAIL;

console.log("--- CLOUDFLARE DIAGNOSTIC ---");
console.log(`Account ID: ${ACCOUNT_ID}`);
console.log(`Email: ${API_EMAIL}`);
console.log(`API Key set: ${!!API_KEY}`);

if (!ACCOUNT_ID || !API_KEY || !API_EMAIL) {
    console.error("Missing credentials in .env");
    process.exit(1);
}

const client = axios.create({
    baseURL: 'https://api.cloudflare.com/client/v4',
    headers: {
        'X-Auth-Email': API_EMAIL,
        'X-Auth-Key': API_KEY,
        'Content-Type': 'application/json'
    }
});

async function test() {
    // 1. Check Identity
    try {
        console.log("\n1. Testing Identity (/user)...");
        const res = await client.get('/user');
        console.log("✅ Identity OK:", res.data.result.email);
        console.log("   Verified:", res.data.result.two_factor_authentication_enabled ? "2FA Enabled" : "2FA Disabled");
        // suspended?
        console.log("   Suspended:", res.data.result.suspended);
    } catch (e: any) {
        console.error("❌ Identity Failed:", e.response?.data || e.message);
        return;
    }

    // 1.5 Check Zones (General Access)
    try {
        console.log("\n1.5 Testing Zones Access (/zones)...");
        const res = await client.get('/zones');
        console.log(`✅ Zones Check OK. Found ${res.data.result.length} zones.`);
        if (res.data.result.length > 0) {
            console.log(`   Sample: ${res.data.result[0].name}`);
        }
    } catch (e: any) {
        console.error("❌ Zones List Failed:", e.response?.data || e.message);
    }

    // 2. Check Permissions / Account
    try {
        console.log("\n2. Testing Account Access (/accounts)...");
        const res = await client.get('/accounts');
        const acc = res.data.result.find((a: any) => a.id === ACCOUNT_ID);
        if (acc) {
            console.log(`✅ Account Found: ${acc.name} (${acc.id})`);
            console.log(`   Permissions:`, acc.roles || 'Not listed');
        } else {
            console.error("❌ Account ID not found in list!");
        }
    } catch (e: any) {
        console.error("❌ Accounts List Failed:", e.response?.data || e.message);
    }

    // 3. Test Registrar Search (POST)
    try {
        console.log("\n3. Testing Registrar Search (POST)...");
        const res = await client.post(`/accounts/${ACCOUNT_ID}/registrar/domains/search`, {
            query: 'google.com' // Should be taken
        });
        console.log("✅ POST Search OK!");
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e: any) {
        console.error("❌ POST Search Failed (Code 10000 Details):");
        if (e.response?.data) {
            console.error(JSON.stringify(e.response.data, null, 2));
        } else {
            console.error(e.message);
        }
    }

    // 4. Test TLDs List (GET) - Checks if Registrar is active at all
    try {
        console.log("\n4. Testing Registrar TLDs (GET)...");
        const res = await client.get(`/accounts/${ACCOUNT_ID}/registrar/tlds`);
        console.log("✅ GET TLDs OK! (Registrar is active)");
        console.log(`   Supported TLDs: ${res.data.result?.length || 0}`);
    } catch (e: any) {
        console.error("❌ GET TLDs Failed (Registrar likely disabled):", JSON.stringify(e.response?.data || e.message, null, 2));
    }

    // 4. Test Registrar Search (GET variant)
    try {
        console.log("\n4. Testing Registrar Search (GET)...");
        const res = await client.get(`/accounts/${ACCOUNT_ID}/registrar/domains/search?q=google.com`);
        console.log("✅ GET Search OK!");
        console.log(res.data);
    } catch (e: any) {
        console.error("❌ GET Search Failed:", JSON.stringify(e.response?.data || e.message, null, 2));
    }
}

test();

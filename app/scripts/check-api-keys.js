/**
 * Check API keys from .env with a single request each.
 * Run from app root: node scripts/check-api-keys.js
 * Output: key name and status only (no key values).
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('.env not found at', envPath);
  process.exit(1);
}

const raw = fs.readFileSync(envPath, 'utf8');
const env = {};
raw.split('\n').forEach((line) => {
  line = line.trim();
  if (!line || line.startsWith('#')) return;
  const i = line.indexOf('=');
  if (i === -1) return;
  const key = line.slice(0, i).trim();
  let val = line.slice(i + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
    val = val.slice(1, -1);
  env[key] = val;
});

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: 'GET',
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ status: res.statusCode, body }));
      }
    );
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('timeout'));
    });
    req.end();
  });
}

function post(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = typeof body === 'string' ? body : new URLSearchParams(body).toString();
    const h = { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data), ...headers };
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname,
        method: 'POST',
        headers: h,
      },
      (res) => {
        let b = '';
        res.on('data', (c) => (b += c));
        res.on('end', () => resolve({ status: res.statusCode, body: b }));
      }
    );
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('timeout'));
    });
    req.write(data);
    req.end();
  });
}

async function main() {
  const keys = ['OPENAI_API_KEY', 'RAWG_API_KEY', 'TWITCH_CLIENT_ID', 'TWITCH_CLIENT_SECRET'];
  const results = {};

  // OpenAI: GET /v1/models
  const openaiKey = env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const r = await get('https://api.openai.com/v1/models', { Authorization: `Bearer ${openaiKey}` });
      results.OPENAI_API_KEY = r.status === 200 ? 'ok' : `invalid (${r.status})`;
    } catch (e) {
      results.OPENAI_API_KEY = 'error: ' + (e.message || 'request failed');
    }
  } else {
    results.OPENAI_API_KEY = 'missing';
  }

  // RAWG: GET with key in query
  const rawgKey = env.RAWG_API_KEY;
  if (rawgKey) {
    try {
      const r = await get(`https://api.rawg.io/api/games?key=${rawgKey}&page_size=1`);
      results.RAWG_API_KEY = r.status === 200 ? 'ok' : `invalid (${r.status})`;
    } catch (e) {
      results.RAWG_API_KEY = 'error: ' + (e.message || 'request failed');
    }
  } else {
    results.RAWG_API_KEY = 'missing';
  }

  // Twitch: get app access token (client_id + client_secret)
  const twitchId = env.TWITCH_CLIENT_ID;
  const twitchSecret = env.TWITCH_CLIENT_SECRET;
  if (twitchId && twitchSecret) {
    try {
      const r = await post('https://id.twitch.tv/oauth2/token', {
        client_id: twitchId,
        client_secret: twitchSecret,
        grant_type: 'client_credentials',
      });
      const data = JSON.parse(r.body || '{}');
      results.TWITCH_CLIENT_ID = data.access_token ? 'ok' : `invalid (${r.status})`;
      results.TWITCH_CLIENT_SECRET = results.TWITCH_CLIENT_ID;
    } catch (e) {
      results.TWITCH_CLIENT_ID = 'error: ' + (e.message || 'request failed');
      results.TWITCH_CLIENT_SECRET = results.TWITCH_CLIENT_ID;
    }
  } else {
    results.TWITCH_CLIENT_ID = twitchId ? 'missing secret' : 'missing';
    results.TWITCH_CLIENT_SECRET = twitchSecret ? 'missing id' : 'missing';
  }

  console.log('API key check results (no values printed):\n');
  keys.forEach((k) => console.log(`${k}: ${results[k] || 'not checked'}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

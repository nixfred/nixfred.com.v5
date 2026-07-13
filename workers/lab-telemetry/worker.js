/* lab-telemetry: sweeps the nixfred fleet of SITES (public URLs only)
   every 10 minutes via cron, stores the result in KV, and serves it as
   JSON at telemetry.nixfred.com for the v5 laboratory status lamps. */

const TARGETS = [
  { id: 'apex',    url: 'https://nixfred.com/' },
  { id: 'resume',  url: 'https://nixfred.com/resume/' },
  { id: 'v5',      url: 'https://v5.nixfred.com/' },
  { id: 'galaxy',  url: 'https://galaxy.nixfred.com/' },
  { id: 'reading', url: 'https://youtube.nixfred.com/' },
  { id: 'go',      url: 'https://go.nixfred.com/' },
  { id: 'townhop', url: 'https://townhop.nixfred.com/' },
  { id: 'poly',    url: 'https://poly.nixfred.com/' },
  { id: 'calc',    url: 'https://calc.nixfred.com/' },
];

const STALE_MS = 15 * 60 * 1000;

async function probe(t) {
  const started = Date.now();
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 8000);
    const res = await fetch(t.url, {
      redirect: 'follow',
      signal: ctl.signal,
      headers: { 'user-agent': 'lab-telemetry/1.0 (+https://v5.nixfred.com)' },
      cf: { cacheTtl: 0 },
    });
    clearTimeout(timer);
    return { id: t.id, up: res.ok, code: res.status, ms: Date.now() - started };
  } catch {
    return { id: t.id, up: false, code: 0, ms: Date.now() - started };
  }
}

async function sweep(env) {
  const results = await Promise.all(TARGETS.map(probe));
  const body = { checked: new Date().toISOString(), results };
  await env.TELEMETRY.put('latest', JSON.stringify(body));
  return body;
}

export default {
  async scheduled(_event, env) {
    await sweep(env);
  },

  async fetch(_request, env) {
    let data = await env.TELEMETRY.get('latest', { type: 'json' });
    if (!data || Date.now() - Date.parse(data.checked) > STALE_MS) {
      data = await sweep(env);
    }
    return new Response(JSON.stringify(data), {
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
        'cache-control': 'public, max-age=60',
      },
    });
  },
};

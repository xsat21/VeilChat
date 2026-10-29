import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const origin = 'http://127.0.0.1:4173';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function retry(fn, label, timeout = 15000) {
  const end = Date.now() + timeout;
  let last;
  while (Date.now() < end) {
    try { const value = await fn(); if (value) return value; }
    catch (error) { last = error; }
    await sleep(150);
  }
  throw new Error(`Timeout waiting for ${label}: ${last?.message ?? ''}`);
}

function chromeExecutable() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    const result = spawnSync('which', [name], { encoding: 'utf8' });
    if (result.status === 0) return result.stdout.trim();
  }
  throw new Error('No Chrome/Chromium executable found on the runner');
}

async function connectChrome(port) {
  const page = await retry(async () => {
    const response = await fetch(`http://127.0.0.1:${port}/json/list`);
    return (await response.json()).find((item) => item.type === 'page' && item.webSocketDebuggerUrl);
  }, 'browser page target');
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let id = 0;
  const pending = new Map();
  socket.addEventListener('message', ({ data }) => {
    const packet = JSON.parse(data);
    if (!packet.id || !pending.has(packet.id)) return;
    const { resolve, reject } = pending.get(packet.id);
    pending.delete(packet.id);
    packet.error ? reject(new Error(JSON.stringify(packet.error))) : resolve(packet.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const next = ++id;
    pending.set(next, { resolve, reject });
    socket.send(JSON.stringify({ id: next, method, params }));
  });
  const evaluate = async (expression) => {
    const value = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (value.exceptionDetails) throw new Error(value.exceptionDetails.text);
    return value.result.value;
  };
  return { socket, send, evaluate };
}

let server, browser, cdp, profile;
let logs = '';
try {
  server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
    detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (chunk) => { logs += chunk.toString(); });
  server.stderr.on('data', (chunk) => { logs += chunk.toString(); });

  const response = await retry(async () => {
    const r = await fetch(origin);
    return r.ok ? r : null;
  }, 'Vite preview');
  const csp = response.headers.get('content-security-policy') ?? '';
  for (const directive of [
    "default-src 'none'", "script-src 'self'", "style-src 'self'",
    "object-src 'none'", "base-uri 'none'", "frame-ancestors 'none'",
    "form-action 'none'",
  ]) assert.ok(csp.includes(directive), `Missing CSP: ${directive}`);
  assert.ok(!csp.includes("'unsafe-inline'"));
  assert.ok(!csp.includes("'unsafe-eval'"));
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  console.log('PASS HTTP: restrictive CSP and response headers');

  profile = await mkdtemp(join(tmpdir(), 'veilchat-security-'));
  const flags = [
    '--headless=new', '--no-first-run', '--disable-background-networking',
    '--disable-extensions', '--remote-debugging-port=0',
    `--user-data-dir=${profile}`, 'about:blank',
  ];
  // Only root-based local containers need --no-sandbox. GitHub runners use the normal Chrome sandbox.
  if (typeof process.getuid === 'function' && process.getuid() === 0) flags.unshift('--no-sandbox');
  browser = spawn(chromeExecutable(), flags, { stdio: 'ignore' });
  const port = await retry(async () => {
    const value = await readFile(join(profile, 'DevToolsActivePort'), 'utf8');
    return Number(value.trim().split('\n')[0]);
  }, 'DevToolsActivePort');
  cdp = await connectChrome(port);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  const navigation = await cdp.send('Page.navigate', { url: origin });
  assert.ok(!navigation.errorText, `Browser could not navigate: ${navigation.errorText}`);
  await retry(
    async () => cdp.evaluate("document.body?.textContent?.includes('Not a secure messenger yet.')"),
    'React prototype page',
  );
  console.log('PASS Browser: React renders under CSP');

  await cdp.evaluate(`(() => {
    window.__veilchatProbe = { inline: false, handler: false, link: false };
    const script = document.createElement('script');
    script.textContent = 'window.__veilchatProbe.inline = true';
    document.body.append(script);
    const image = document.createElement('img');
    image.setAttribute('onerror', 'window.__veilchatProbe.handler = true');
    image.src = '/__missing_security_probe__.png';
    document.body.append(image);
    const link = document.createElement('a');
    link.href = 'javascript:window.__veilchatProbe.link = true';
    link.textContent = 'test';
    document.body.append(link);
    link.click();
  })()`);
  await sleep(600);
  assert.deepEqual(await cdp.evaluate('window.__veilchatProbe'), {
    inline: false, handler: false, link: false,
  });
  console.log('PASS Browser: CSP blocks inline scripts, event attributes and javascript: URLs');

  const state = await cdp.evaluate(`(async () => ({
    workers: (await navigator.serviceWorker.getRegistrations()).length,
    caches: await caches.keys(),
    local: localStorage.length,
    session: sessionStorage.length,
  }))()`);
  assert.equal(state.workers, 0);
  assert.deepEqual(state.caches, []);
  assert.equal(state.local, 0);
  assert.equal(state.session, 0);
  console.log('PASS Browser: fresh prototype profile has no service worker or storage entries');
  console.log('PASS: Chromium development-preview security smoke tests completed');
} catch (error) {
  console.error(error);
  if (logs) console.error(logs.slice(-2500));
  process.exitCode = 1;
} finally {
  cdp?.socket.close();
  browser?.kill('SIGTERM');
  if (server) {
    if (process.platform !== 'win32') {
      try { process.kill(-server.pid, 'SIGTERM'); } catch { server.kill('SIGTERM'); }
    } else server.kill('SIGTERM');
  }
  if (profile) await rm(profile, { recursive: true, force: true, maxRetries: 4, retryDelay: 200 });
}

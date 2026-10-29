import assert from 'node:assert/strict';

const base = process.env.DEPLOY_URL ?? 'http://127.0.0.1:18080';

async function request(path) {
  return fetch(new URL(path, base), { redirect: 'manual' });
}

const securityHeaders = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'x-frame-options': 'DENY',
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'same-origin',
};
function expectSecurityHeaders(response, name) {
  const csp = response.headers.get('content-security-policy') ?? '';
  for (const directive of [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "worker-src 'none'",
  ]) {
    assert.ok(csp.includes(directive), name + ': missing CSP ' + directive);
  }
  assert.ok(!csp.includes("'unsafe-eval'") && !csp.includes("'unsafe-inline'"));
  for (const [header, expected] of Object.entries(securityHeaders)) {
    assert.equal(response.headers.get(header), expected, name + ': missing security header ' + header);
  }
}
function expectNoStore(response, name) {
  assert.match(response.headers.get('cache-control') ?? '', /no-store/, name);
}
function expect404(response, name) {
  assert.equal(response.status, 404, name);
  expectSecurityHeaders(response, name);
  expectNoStore(response, name);
}

const page = await request('/');
assert.equal(page.status, 200);
expectSecurityHeaders(page, '/');
expectNoStore(page, '/');
const html = await page.text();
assert.ok(html.includes('VeilChat'), 'missing page title');
console.log('PASS: static HTML and response security headers');

const manifest = await request('/manifest.webmanifest');
assert.equal(manifest.status, 200);
expectSecurityHeaders(manifest, 'manifest');
expectNoStore(manifest, 'manifest');
console.log('PASS: manifest no-store');

const assetPath = html.match(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/)?.[1];
assert.ok(assetPath, 'Vite fingerprinted asset missing from index.html');
const asset = await request(assetPath);
assert.equal(asset.status, 200, 'asset not served');
expectSecurityHeaders(asset, 'fingerprinted asset');
assert.match(asset.headers.get('cache-control') ?? '', /immutable/, 'fingerprinted asset should be immutable');
console.log('PASS: fingerprinted static asset has immutable cache policy');

const route = await request('/settings');
assert.equal(route.status, 200, 'SPA route missing');
expectSecurityHeaders(route, 'SPA fallback');
expectNoStore(route, 'SPA fallback');
console.log('PASS: SPA fallback retains security headers and no-store');

for (const path of ['/api/private', '/_matrix/client/v3/sync', '/assets/notfound-12345678.js', '/.env']) {
  expect404(await request(path), path);
}
console.log('PASS: API, missing assets and hidden paths are not routed to the PWA shell');

const health = await request('/healthz');
assert.equal(health.status, 200);
assert.equal((await health.text()).trim(), 'ok');
console.log('PASS: container health endpoint');
console.log('PASS: Docker NGINX deployment HTTP smoke tests completed');

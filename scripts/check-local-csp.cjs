const assert = require('node:assert/strict');
const { writeFile } = require('node:fs/promises');
async function main() {
  const first = await fetch('http://127.0.0.1:3210/');
  const html = await first.text();
  const csp = first.headers.get('content-security-policy');
  const second = await fetch('http://127.0.0.1:3210/');
  const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];
  assert.equal(first.status, 200);
  assert.ok(nonce);
  assert.ok(!/script-src[^;]*unsafe-(inline|eval)/.test(csp));
  assert.notEqual(csp, second.headers.get('content-security-policy'));
  const scripts = html.match(/<script\b[^>]*>/g) ?? [];
  assert.ok(scripts.length > 0);
  assert.ok(scripts.every((script) => script.includes(`nonce="${nonce}"`)));
  const result = { checkedAt: new Date().toISOString(), status: 200, uniqueNoncePerRequest: true, scriptTagsWithMatchingNonce: scripts.length, unsafeInlineOrEvalScripts: false, limitation: 'HTTP production rendering check; not a browser hydration test' };
  await writeFile('docs/evidence/csp-check.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
}
main().catch(() => { console.error('Production CSP check failed'); process.exitCode = 1; });

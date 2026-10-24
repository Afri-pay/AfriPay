// Heuristic scan: output file/commit/rule only, never matched secret values.
const { execFileSync } = require('child_process');
const { readFileSync } = require('fs');
const rules = [
  ['Stellar seed', /\bS[A-Z2-7]{55}\b/],
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{50,})\b/],
  ['AWS access ID', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
];
const run = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const findings = [];
function check(content, location) {
  for (const [rule, pattern] of rules) if (pattern.test(content)) findings.push({ location, rule });
}
for (const path of run('ls-files', '-z').split('\0').filter(Boolean)) {
  try { check(readFileSync(path, 'utf8'), path); } catch { /* removed tracked file */ }
}
if (process.argv.includes('--history')) {
  for (const commit of run('rev-list', '--all').trim().split('\n').filter(Boolean)) {
    // --format without patches avoids email/identity disclosure in logs.
    check(run('show', '--format=', '--no-ext-diff', '--no-renames', commit), `commit:${commit}`);
  }
}
console.log(JSON.stringify({ findings, history: process.argv.includes('--history'), limitation: 'Pattern scan only; not an independent secret audit. Does not cover external logs, inaccessible refs, provider-specific tokens or deleted remote history.' }, null, 2));
if (findings.length) process.exitCode = 1;

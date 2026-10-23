// Read-only public probes. Does not fund, sign, submit, migrate, or deploy.
const { mkdir, writeFile, readFile } = require('fs/promises');
const { join } = require('path');
const { rpc, xdr } = require('../backend/node_modules/@stellar/stellar-sdk');

async function probe(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const contentType = response.headers.get('content-type') ?? '';
    const body = contentType.includes('json') ? await response.json() : null;
    return { url, status: response.status, csp: response.headers.get('content-security-policy'), service: body?.service, network: body?.stellar?.network ?? body?.network_passphrase, ledger: body?.ledger, successful: body?.successful };
  } catch { return { url, status: 'unreachable' }; }
}
async function main() {
  const urls = ['https://afri-pay-beta.vercel.app/', 'https://afripay-api-seven.vercel.app/health', 'https://horizon-testnet.stellar.org/'];
  const deploymentDoc = await readFile(join(__dirname, '../docs/STELLAR_TESTNET_DEPLOYMENT.md'), 'utf8');
  const contracts = [...new Set(deploymentDoc.match(/\bC[A-Z2-7]{55}\b/g) ?? [])];
  const hashes = [...new Set(deploymentDoc.match(/\/tx\/([a-f0-9]{64})/g) ?? [])].map((path) => path.split('/').pop());
  const horizon = await Promise.all(hashes.map((hash) => probe(`https://horizon-testnet.stellar.org/transactions/${hash}`)));
  const server = new rpc.Server('https://soroban-testnet.stellar.org', { timeout: 15000 });
  const contractState = await Promise.all(contracts.map(async (id) => {
    try { await server.getContractData(id, xdr.ScVal.scvLedgerKeyContractInstance()); return { id, query: 'found' }; }
    catch { return { id, query: 'not verified (missing, expired or RPC unavailable)' }; }
  }));
  let rpcHealth;
  try { rpcHealth = await server.getHealth(); } catch { rpcHealth = { status: 'unreachable' }; }
  const evidence = { checkedAt: new Date().toISOString(), probes: await Promise.all(urls.map(probe)), rpcHealth, historicalDeploymentTransactions: horizon, contractState };
  await mkdir(join(__dirname, '../docs/evidence'), { recursive: true });
  await writeFile(join(__dirname, '../docs/evidence/deployment-probes.json'), JSON.stringify(evidence, null, 2) + '\n');
  console.log(JSON.stringify(evidence, null, 2));
  if (evidence.probes.some((item) => item.status !== 200) || rpcHealth.status !== 'healthy') process.exitCode = 1;
}
main().catch(() => { console.error('Read-only deployment check failed'); process.exitCode = 1; });

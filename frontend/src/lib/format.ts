/** Display helpers. Amounts stay strings end to end so no value passes through floating point. */

export function shortAddress(address: string) {
  return address.length > 12 ? `${address.slice(0, 5)}…${address.slice(-5)}` : address;
}

/** Splits an address into groups of four so people can compare it against another device. */
export function addressGroups(address: string) {
  return address.match(/.{1,4}/g) ?? [];
}

/** "1234.5000000" -> "1,234.50". Keeps every significant decimal and at least two. */
export function formatAmount(value: string | null | undefined) {
  if (!value || !/^-?\d+(\.\d+)?$/.test(value)) return '0.00';
  const negative = value.startsWith('-');
  const [whole, fraction = ''] = value.replace('-', '').split('.');
  const trimmed = fraction.replace(/0+$/, '').padEnd(2, '0');
  const grouped = whole.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}${grouped}.${trimmed}`;
}

function unitsToDecimal(units: bigint) {
  const padded = units.toString().padStart(8, '0');
  return `${padded.slice(0, -7)}.${padded.slice(-7)}`;
}

export function stroopsToXlm(stroops: string) {
  return /^\d+$/.test(stroops) ? formatAmount(unitsToDecimal(BigInt(stroops))) : stroops;
}

/** Amount plus network fee, computed in stroops. Returns null when either input is malformed. */
export function totalWithFee(amount: string, feeStroops: string) {
  if (!/^\d{1,12}(\.\d{1,7})?$/.test(amount) || !/^\d+$/.test(feeStroops)) return null;
  const [whole, fraction = ''] = amount.split('.');
  return formatAmount(unitsToDecimal(BigInt(whole) * BigInt(10000000) + BigInt(fraction.padEnd(7, '0')) + BigInt(feeStroops)));
}

export function formatDay(date: Date, now = new Date()) {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(date)) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric' });
}

export function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export const explorerTxUrl = (hash: string) => `https://stellar.expert/explorer/testnet/tx/${hash}`;

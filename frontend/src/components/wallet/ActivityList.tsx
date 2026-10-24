'use client';

import { Icon, type IconName } from '@/components/ui/Icon';
import { Skeleton } from '@/components/ui/Panel';
import { explorerTxUrl, formatAmount, formatDay, formatTime, shortAddress } from '@/lib/format';
import type { HistoryItem } from './WalletProvider';

type Direction = 'sent' | 'received' | 'other';

function describe(item: HistoryItem, address: string | null): { direction: Direction; title: string; counterparty?: string; icon: IconName } {
  if (item.type === 'create_account') return { direction: 'other', title: 'Account created', icon: 'plus' };
  if (item.type === 'account_merge') return { direction: 'other', title: 'Account merged', icon: 'activity' };
  if (item.from && item.from === address) return { direction: 'sent', title: 'Sent', counterparty: item.to, icon: 'arrow-up-right' };
  if (item.to && item.to === address) return { direction: 'received', title: 'Received', counterparty: item.from, icon: 'arrow-down-left' };
  return { direction: 'other', title: 'Payment', icon: 'activity' };
}

function ActivityRow({ item, address }: { item: HistoryItem; address: string | null }) {
  const info = describe(item, address);
  const date = new Date(item.createdAt);
  return (
    <li className="flex items-center gap-3 py-3">
      <span className={`grid size-9 shrink-0 place-items-center rounded-full bg-subtle ${info.direction === 'received' ? 'text-positive' : 'text-ink-2'}`}><Icon name={info.icon} size={17} /></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{info.title}</p>
        <p className="truncate text-[13px] text-ink-3">
          {info.counterparty && <>{info.direction === 'sent' ? 'to' : 'from'} <span className="font-mono text-ink-2">{shortAddress(info.counterparty)}</span> · </>}{formatTime(date)}
        </p>
      </div>
      {item.amount && (
        <p className={`text-right text-sm font-medium tabular-nums ${info.direction === 'received' ? 'text-positive' : ''}`}>
          {info.direction === 'sent' ? '−' : info.direction === 'received' ? '+' : ''}{formatAmount(item.amount)} <span className="font-normal text-ink-2">{item.asset}</span>
        </p>
      )}
      <a href={explorerTxUrl(item.transactionHash)} target="_blank" rel="noreferrer" aria-label="View transaction on Stellar Expert" title="View on Stellar Expert"
        className="-mr-1.5 grid size-8 shrink-0 place-items-center rounded-md text-ink-3 hover:bg-subtle hover:text-ink">
        <Icon name="external" size={15} />
      </a>
    </li>
  );
}

export function ActivityList({ items, address, limit }: { items: HistoryItem[] | null; address: string | null; limit?: number }) {
  if (items === null) return (
    <div className="grid gap-4 py-3" aria-label="Loading activity">
      {[0, 1, 2].map((i) => <div key={i} className="flex items-center gap-3"><Skeleton className="size-9 rounded-full" /><div className="grid flex-1 gap-1.5"><Skeleton className="h-3.5 w-40" /><Skeleton className="h-3 w-16" /></div><Skeleton className="h-3.5 w-20" /></div>)}
    </div>
  );
  if (items.length === 0) return (
    <div className="py-8 text-center">
      <p className="text-sm font-medium">No payments yet</p>
      <p className="mt-1 text-[13px] text-ink-2">Payments you send or receive on Stellar Testnet will appear here.</p>
    </div>
  );
  const visible = limit ? items.slice(0, limit) : items;
  const groups: Array<{ day: string; items: HistoryItem[] }> = [];
  for (const item of visible) {
    const day = formatDay(new Date(item.createdAt));
    const last = groups[groups.length - 1];
    if (last?.day === day) last.items.push(item); else groups.push({ day, items: [item] });
  }
  return (
    <div>
      {groups.map((group) => (
        <div key={group.day}>
          <h3 className="pt-3 text-xs font-medium uppercase tracking-[0.06em] text-ink-3">{group.day}</h3>
          <ul className="divide-y divide-line">{group.items.map((item) => <ActivityRow key={item.id} item={item} address={address} />)}</ul>
        </div>
      ))}
    </div>
  );
}

import type { ReactNode } from 'react';

export type IconName =
  | 'home' | 'send' | 'receive' | 'activity' | 'settings' | 'copy' | 'check' | 'lock' | 'sun' | 'moon' | 'system'
  | 'external' | 'arrow-up-right' | 'arrow-down-left' | 'plus' | 'chevron-left' | 'chevron-right' | 'alert' | 'info'
  | 'refresh' | 'eye' | 'eye-off' | 'trash' | 'link' | 'clock' | 'x';

const paths: Record<IconName, ReactNode> = {
  home: <><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-9.5Z" /></>,
  send: <><path d="M12 19V5" /><path d="m6 11 6-6 6 6" /></>,
  receive: <><path d="M12 5v14" /><path d="m6 13 6 6 6-6" /></>,
  activity: <><path d="M4 6h16M4 12h16M4 18h10" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3M12 18.5v3M4.2 6.5l2.6 1.5M17.2 16l2.6 1.5M4.2 17.5 6.8 16M17.2 8l2.6-1.5" /></>,
  copy: <><rect x="8.5" y="8.5" width="11" height="11" rx="1.5" /><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="1.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" /></>,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />,
  system: <><rect x="3.5" y="4.5" width="17" height="12" rx="1.5" /><path d="M8.5 20.5h7M12 16.5v4" /></>,
  external: <><path d="M14 4.5h5.5V10M19.5 4.5 11 13" /><path d="M17.5 14v4a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18V8A1.5 1.5 0 0 1 6 6.5h4" /></>,
  'arrow-up-right': <><path d="M7 17 17 7" /><path d="M8.5 7H17v8.5" /></>,
  'arrow-down-left': <><path d="M17 7 7 17" /><path d="M15.5 17H7V8.5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  'chevron-left': <path d="m14.5 6-6 6 6 6" />,
  'chevron-right': <path d="m9.5 6 6 6-6 6" />,
  alert: <><path d="M12 4 2.5 20h19L12 4Z" /><path d="M12 10v4.5M12 17.5v.01" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.5v.01" /></>,
  refresh: <><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" /><path d="M19.5 4.5v4h-4" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
  'eye-off': <><path d="M3.5 3.5l17 17" /><path d="M10 6a9.5 9.5 0 0 1 2-.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.6 3.3M6.4 7.7A15.8 15.8 0 0 0 2.5 12S6 18.5 12 18.5c1.6 0 3-.5 4.2-1.1" /><path d="M9.9 10a2.5 2.5 0 0 0 3.6 3.5" /></>,
  trash: <><path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  x: <path d="M6 6l12 12M18 6 6 18" />,
};

export function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {paths[name]}
    </svg>
  );
}

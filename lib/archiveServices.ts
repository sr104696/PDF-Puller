export type ArchiveServiceKey = 'archive-ph' | 'wayback' | 'twelve-ft';

export const ARCHIVE_SERVICES: Record<ArchiveServiceKey, {
  label: string;
  description: string;
  buildUrl: (target: string) => string;
}> = {
  'archive-ph': {
    label: 'archive.ph',
    description: 'Privacy-friendly archiving proxy often updated quickly.',
    buildUrl: (target) => `https://archive.ph/${encodeURIComponent(target)}`,
  },
  wayback: {
    label: 'Wayback Machine',
    description: 'The Internet Archive snapshot viewer.',
    buildUrl: (target) => `https://web.archive.org/web/*/${encodeURIComponent(target)}`,
  },
  'twelve-ft': {
    label: '12ft.io',
    description: 'Paywall bypass that proxies pages for reading.',
    buildUrl: (target) => `https://12ft.io/${encodeURIComponent(target)}`,
  },
};

export function isArchiveService(value: unknown): value is ArchiveServiceKey {
  return typeof value === 'string' && value in ARCHIVE_SERVICES;
}

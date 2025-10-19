export type ArchiveProviderId = 'archive-today' | 'internet-archive' | 'twelve-foot';

export const ARCHIVE_CATALOG: Record<
  ArchiveProviderId,
  {
    label: string;
    description: string;
    buildUrl: (target: string) => string;
  }
> = {
  'archive-today': {
    label: 'archive.ph',
    description: 'Privacy-friendly archiving proxy often updated quickly.',
    buildUrl: (target) => `https://archive.ph/${encodeURIComponent(target)}`,
  },
  'internet-archive': {
    label: 'Wayback Machine',
    description: 'The Internet Archive snapshot viewer.',
    buildUrl: (target) => `https://web.archive.org/web/*/${encodeURIComponent(target)}`,
  },
  'twelve-foot': {
    label: '12ft.io',
    description: 'Paywall bypass that proxies pages for reading.',
    buildUrl: (target) => `https://12ft.io/${encodeURIComponent(target)}`,
  },
};

export function isArchiveProvider(value: unknown): value is ArchiveProviderId {
  return typeof value === 'string' && value in ARCHIVE_CATALOG;
}

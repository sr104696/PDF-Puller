import puppeteer, { Browser, LaunchOptions } from 'puppeteer';
import { ARCHIVE_CATALOG, type ArchiveProviderId } from '../config/catalog';

const BASE_CHROME_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--disable-gpu',
  '--no-first-run',
  '--no-zygote',
  '--disable-extensions',
  '--disable-features=site-per-process',
  '--disable-site-isolation-trials',
  '--single-process',
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-breakpad',
  '--disable-component-update',
  '--disable-domain-reliability',
  '--disable-default-apps',
  '--mute-audio',
  '--no-default-browser-check',
  '--password-store=basic',
  '--use-mock-keychain',
];

const STRATEGIES: Array<{
  label: string;
  options: LaunchOptions & { headless?: boolean | 'shell' | 'new' };
}> = [
  {
    label: 'default-new-headless',
    options: {
      headless: 'new',
      args: BASE_CHROME_ARGS,
    },
  },
  {
    label: 'shell-headless',
    options: {
      headless: 'shell',
      args: BASE_CHROME_ARGS,
    },
  },
  {
    label: 'legacy-headless',
    options: {
      headless: true,
      args: BASE_CHROME_ARGS,
    },
  },
];

export async function renderArchivePdf(targetUrl: string, provider: ArchiveProviderId) {
  const archiveUrl = ARCHIVE_CATALOG[provider].buildUrl(targetUrl);
  const { browser, strategy } = await launchBrowser();

  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(45000);
    page.setDefaultTimeout(45000);

    await page.goto(archiveUrl, {
      waitUntil: 'networkidle2',
      timeout: 45000,
    });

    await page.waitForTimeout(1000);

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    return { pdf, strategy, archiveUrl };
  } finally {
    await browser.close().catch(() => undefined);
  }
}

async function launchBrowser(): Promise<{ browser: Browser; strategy: string }> {
  const errors: string[] = [];

  for (const { label, options } of STRATEGIES) {
    try {
      const browser = await puppeteer.launch({
        timeout: 45000,
        ...options,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      });
      return { browser, strategy: label };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${label}: ${message}`);
    }
  }

  throw new Error(`Failed to launch Chromium with Puppeteer. Tried strategies: ${errors.join('; ')}`);
}

import { NextRequest, NextResponse } from 'next/server';
import puppeteer, { Browser, LaunchOptions } from 'puppeteer';
import { ARCHIVE_SERVICES, isArchiveService } from '@/lib/archiveServices';

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

class BrowserLaunchError extends Error {
  constructor(
    message: string,
    readonly code?: 'missing-dependencies',
    readonly metadata: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'BrowserLaunchError';
  }
}

async function launchBrowser(): Promise<{ browser: Browser; strategy: string }> {
  const errors: string[] = [];
  const missingLibraries = new Set<string>();

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

  throw new Error(
    `Failed to launch Chromium with Puppeteer. Tried strategies: ${errors.join('; ')}`,
  );
}

async function generatePdf(targetUrl: string, archiveService: keyof typeof ARCHIVE_SERVICES) {
  const archiveUrl = ARCHIVE_SERVICES[archiveService].buildUrl(targetUrl);
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

export async function POST(request: NextRequest) {
  try {
    const { url, service } = (await request.json()) as {
      url?: string;
      service?: unknown;
    };

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { ok: false, message: 'A valid URL is required.' },
        { status: 400 },
      );
    }

    if (!isArchiveService(service)) {
      return NextResponse.json(
        { ok: false, message: 'An archive service is required.' },
        { status: 400 },
      );
    }

    let normalizedUrl: string;
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error('Only HTTP(S) URLs are supported.');
      }
      normalizedUrl = parsedUrl.toString();
    } catch (parseError) {
      const message =
        parseError instanceof Error ? parseError.message : 'The provided URL is invalid.';
      return NextResponse.json(
        { ok: false, message },
        { status: 400 },
      );
    }

    const { pdf, strategy, archiveUrl } = await generatePdf(normalizedUrl, service);

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="pdf-beans-${Date.now()}.pdf"`,
        'X-PDF-Beans-Archive-Url': archiveUrl,
        'X-PDF-Beans-Launch-Strategy': strategy,
      },
    });
  } catch (error) {
    console.error('Failed to generate PDF', error);
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred while generating the PDF.';

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 500 },
    );
  }
}

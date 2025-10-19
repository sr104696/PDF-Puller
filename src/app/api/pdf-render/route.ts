import { NextRequest, NextResponse } from 'next/server';
import { ARCHIVE_CATALOG, isArchiveProvider } from '@/src/features/archive/config/catalog';
import { renderArchivePdf } from '@/src/features/archive/server/pdfRenderer';

export async function POST(request: NextRequest) {
  try {
    const { url, provider } = (await request.json()) as {
      url?: string;
      provider?: unknown;
    };

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { ok: false, message: 'A valid URL is required.' },
        { status: 400 },
      );
    }

    if (!isArchiveProvider(provider)) {
      return NextResponse.json(
        { ok: false, message: 'An archive provider is required.' },
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

    const { pdf, strategy, archiveUrl } = await renderArchivePdf(normalizedUrl, provider);

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="archive-pdf-${Date.now()}.pdf"`,
        'X-Archive-Source-Url': archiveUrl,
        'X-Archive-Launch-Strategy': strategy,
      },
    });
  } catch (error) {
    console.error('Failed to generate PDF', error);
    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred while generating the PDF.';

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 500 },
    );
  }
}

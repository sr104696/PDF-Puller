'use client';

import { useCallback, useMemo, useState } from 'react';
import { ARCHIVE_SERVICES, type ArchiveServiceKey } from '@/lib/archiveServices';

type GenerateResponse =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

export function PdfGeneratorForm() {
  const [url, setUrl] = useState('');
  const [service, setService] = useState<ArchiveServiceKey>('archive-ph');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const disabled = useMemo(() => status === 'loading', [status]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setStatus('loading');
      setErrorMessage('');

      try {
        const response = await fetch('/api/generate-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url, service }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as GenerateResponse | null;
          const message = payload && !payload.ok ? payload.message : 'Unexpected error';
          setStatus('error');
          setErrorMessage(message);
          return;
        }

        const blob = await response.blob();
        const archiveLabel = ARCHIVE_SERVICES[service]?.label ?? 'archive';
        const fileName = `pdf-beans-${archiveLabel}-${Date.now()}.pdf`;
        const urlObject = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = urlObject;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(urlObject);

        setStatus('success');
      } catch (error) {
        console.error('Failed to generate PDF', error);
        setStatus('error');
        setErrorMessage('Failed to generate PDF. Please try again.');
      }
    },
    [service, url],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="url" className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Page URL
        </label>
        <input
          id="url"
          type="url"
          required
          placeholder="https://example.com/article"
          className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-cyan-400 focus:shadow-[0_0_0_2px_rgba(6,182,212,0.15)]"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="archive-service"
          className="text-sm font-semibold uppercase tracking-wide text-slate-400"
        >
          Archive service
        </label>
        <select
          id="archive-service"
          className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-cyan-400 focus:shadow-[0_0_0_2px_rgba(6,182,212,0.15)]"
          value={service}
          onChange={(event) => setService(event.target.value as ArchiveServiceKey)}
          disabled={disabled}
        >
          {Object.entries(ARCHIVE_SERVICES).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500">
          {ARCHIVE_SERVICES[service]?.description}
        </p>
      </div>

      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-3 text-base font-semibold text-slate-900 transition hover:bg-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
      >
        {status === 'loading' ? 'Generating PDF…' : 'Generate PDF'}
      </button>

      {status === 'error' && (
        <p className="rounded-md border border-rose-400/40 bg-rose-950/60 px-4 py-3 text-sm text-rose-200">
          {errorMessage}
        </p>
      )}

      {status === 'success' && (
        <p className="rounded-md border border-emerald-400/40 bg-emerald-950/60 px-4 py-3 text-sm text-emerald-200">
          PDF generated successfully! Check your downloads.
        </p>
      )}
    </form>
  );
}

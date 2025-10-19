import { ArchiveRequestPanel } from '@/src/features/archive/components/ArchiveRequestPanel';

export default function Page() {
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 text-center">
        <h1 className="text-3xl font-bold text-cyan-300 sm:text-4xl">Archive PDF Studio</h1>
        <p className="text-base text-slate-300 sm:text-lg">
          Generate beautiful PDFs from archived versions of web pages. Choose a provider, paste the
          URL, and we&apos;ll deliver the PDF for you.
        </p>
      </header>

      <ArchiveRequestPanel />

      <p className="text-sm text-slate-400">
        Need help getting Chromium running? Check out the <strong>install-deps-simple.sh</strong> script
        and the troubleshooting guides included in this repository.
      </p>
    </section>
  );
}

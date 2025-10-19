import type { Metadata } from 'next';
import './styles/global-theme.css';

export const metadata: Metadata = {
  title: 'Archive PDF Studio',
  description: 'Generate PDFs from curated archive services using Puppeteer.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
          {children}
        </main>
      </body>
    </html>
  );
}

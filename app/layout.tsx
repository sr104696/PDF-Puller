import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PDF Beans - Archive PDF Generator',
  description: 'Generate PDFs from archived versions of web pages using Puppeteer.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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

import type { Metadata } from 'next';
import { Outfit, Syne } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const outfit = Outfit({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-outfit'
});

const syne = Syne({ 
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-syne'
});

export const metadata: Metadata = {
  title: 'FYRO - Find Your Right One',
  description: 'Indian logistics marketplace for trucks and hamali workers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${syne.variable}`}>
      <body className="antialiased">
        {children}
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-md)',
              fontFamily: 'Outfit, sans-serif'
            },
            success: {
              style: {
                borderLeft: '4px solid var(--green)',
              },
              iconTheme: {
                primary: 'var(--accent)',
                secondary: 'var(--surface)',
              },
            },
            error: {
              style: {
                borderLeft: '4px solid var(--red)',
              },
            },
          }}
        />
      </body>
    </html>
  );
}

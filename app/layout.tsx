import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

// baixadas no build e servidas pelo próprio portal (a CSP só permite fontes 'self')
const textos = Inter({ subsets: ['latin', 'latin-ext', 'vietnamese'], variable: '--font-body', display: 'swap' });
const titulos = Space_Grotesk({ subsets: ['latin', 'latin-ext', 'vietnamese'], variable: '--font-display', display: 'swap' });

export const metadata: Metadata = {
  title: 'Centro Cultural Família Àṣẹ Omos Odé',
  description: 'Fé, axé e tradição desde 1980 — Odé/Oxóssi, Oxum e Obaluaê (Azauani). São Paulo — SP.',
  applicationName: 'Àṣẹ Omos Odé',
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Àṣẹ Omos Odé', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: '#05070d',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${textos.variable} ${titulos.variable}`}>
      <body>{children}</body>
    </html>
  );
}

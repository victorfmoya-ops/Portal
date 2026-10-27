import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Centro Cultural Família Àṣẹ Omos Odé',
  description: 'Fé, axé e tradição desde 1980 — Odé/Oxóssi, Oxum e Obaluaê (Azauani). São Paulo — SP.',
  applicationName: 'Àṣẹ Omos Odé',
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Àṣẹ Omos Odé', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: '#1f66c2',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Centro Cultural Família Àṣẹ Omos Odé',
    short_name: 'Àṣẹ Omos Odé',
    description: 'Site e área restrita da casa (filhos e administração).',
    start_url: '/app',
    scope: '/',
    display: 'standalone',
    background_color: '#eef2fb',
    theme_color: '#1f66c2',
    lang: 'pt-BR',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

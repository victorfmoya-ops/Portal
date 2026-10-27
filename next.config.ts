import type { NextConfig } from 'next';

const supabase = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:55421').origin;
  } catch {
    return '';
  }
})();
const dev = process.env.NODE_ENV !== 'production';

// Política de segurança de conteúdo: só carrega o que é do próprio portal (e fotos do Supabase).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabase}`,
  "font-src 'self'",
  `connect-src 'self' ${supabase}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  // o login com Google redireciona o formulário para o Supabase e para o Google
  `form-action 'self' ${supabase} https://accounts.google.com`,
].join('; ');

const nextConfig: NextConfig = {
  // standalone = imagem Docker enxuta (o Dockerfile define NEXT_OUTPUT=standalone)
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    // comprovantes de até 10 MB passam pela Server Action
    serverActions: { bodySizeLimit: '11mb' },
    proxyClientMaxBodySize: '11mb',
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      {
        source: '/app/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ];
  },
};

export default nextConfig;

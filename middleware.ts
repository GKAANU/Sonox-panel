import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add CSP headers
  const cspHeader = `
    default-src 'self' https://*.googleapis.com https://*.gstatic.com https://*.firebaseio.com https://*.firebase.com https://*.firebaseapp.com https://*.kaanuzun.com wss://*.kaanuzun.com;
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseapp.com https://*.googleapis.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https://* blob:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://*.googleapis.com https://*.gstatic.com https://*.firebaseio.com https://*.firebase.com https://*.firebaseapp.com wss://*.kaanuzun.com https://*.kaanuzun.com ws://localhost:* http://localhost:*;
    frame-src 'self' https://*.firebaseapp.com;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

export const config = {
  matcher: '/:path*',
}; 
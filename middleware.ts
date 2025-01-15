import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add CSP headers
  const cspHeader = `
    default-src 'self' https://*.googleapis.com https://*.gstatic.com https://*.firebaseio.com https://*.firebase.com https://*.firebaseapp.com https://*.kaanuzun.com wss://*.kaanuzun.com;
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseapp.com https://*.googleapis.com https://apis.google.com https://*.gstatic.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.gstatic.com;
    img-src 'self' data: https://* blob: https://*.googleusercontent.com;
    font-src 'self' https://fonts.gstatic.com data:;
    connect-src 'self' https://*.googleapis.com https://*.gstatic.com https://*.firebaseio.com https://*.firebase.com https://*.firebaseapp.com wss://*.kaanuzun.com https://*.kaanuzun.com ws://localhost:* http://localhost:* https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.cloudfunctions.net https://firestore.googleapis.com;
    frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://*.google.com;
    media-src 'self' https://* blob:;
    worker-src 'self' blob:;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

export const config = {
  matcher: '/:path*',
}; 
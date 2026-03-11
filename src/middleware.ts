import { NextResponse, type NextRequest } from 'next/server';

const PASSWORD_HASH_HEADER = 'x-wol-auth';
const PASSWORD_HASH_ENV = 'WOL_WEB_PASSWORD_HASH';

export function middleware(request: NextRequest) {
  const expectedHash = (process.env[PASSWORD_HASH_ENV] ?? '').trim();

  if (!expectedHash) {
    return NextResponse.next();
  }

  const providedHash = request.headers.get(PASSWORD_HASH_HEADER);

  if (!providedHash || providedHash !== expectedHash) {
    return NextResponse.json(
      {
        error: 'password required',
      },
      { status: 401 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/wol/:path*'],
};

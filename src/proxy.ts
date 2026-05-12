import { auth } from '@/auth';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth'];

// /share/<token> 공개 페이지와 GET /api/share/<token> 공개 조회만 허용.
// POST /api/share 와 DELETE /api/share/<token> 은 인증 유지.
function isPublicShareRequest(method: string, pathname: string): boolean {
  if (pathname.startsWith('/share/')) return true;
  if (method === 'GET' && /^\/api\/share\/[^/]+$/.test(pathname)) return true;
  return false;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // 공개 경로는 그대로 통과
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  if (isPublicShareRequest(req.method, pathname)) {
    return NextResponse.next();
  }

  // Next.js 내부 자원 통과
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /\.[\w]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 인증 안 됐을 때
  if (!req.auth) {
    // API 라우트는 HTML redirect 대신 JSON 401 — 클라이언트 fetch 가 깔끔하게 처리 가능
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  // 정적 자원과 API 라우트의 일부는 위 함수 내부에서 통과시킴 — matcher는 폭넓게 잡고 코드에서 정밀 분기
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

// 認証設定ファイル

// パブリックルート（認証不要）
export const publicRoutes = [
  '/',
  '/sign-in',
  '/sign-up',
  '/auth/callback',
  '/auth/reset-password',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.xml'
] as const;

// 保護されたルート（認証必要）
export const protectedRoutes = [
  '/work-record',
  '/calendar',
  '/crop-schedule',
  '/smart-schedule',
  '/comments',
  '/api/protected'
] as const;

// 管理者専用ルート（将来の拡張用）
export const adminRoutes = [
  '/admin',
  '/api/admin'
] as const;

// 静的ファイルのパターン
export const staticFilePattern = /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp|avif)$/;

// APIルートのパターン
export const apiRoutePattern = /^\/api\//;

// ルートがパブリックかどうかをチェック
export function isPublicRoute(pathname: string): boolean {
  // 静的ファイルは常にパブリック
  if (staticFilePattern.test(pathname)) {
    return true;
  }

  // パブリックルートのチェック
  return publicRoutes.some(route => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(route);
  });
}

// ルートが保護されているかどうかをチェック
export function isProtectedRoute(pathname: string): boolean {
  // パブリックルートでない場合は保護されたルート
  return !isPublicRoute(pathname);
}

// ルートが管理者専用かどうかをチェック
export function isAdminRoute(pathname: string): boolean {
  return adminRoutes.some(route => pathname.startsWith(route));
}

// ルートの種類を取得
export function getRouteType(pathname: string): 'public' | 'protected' | 'admin' {
  if (isAdminRoute(pathname)) {
    return 'admin';
  }
  if (isProtectedRoute(pathname)) {
    return 'protected';
  }
  return 'public';
}

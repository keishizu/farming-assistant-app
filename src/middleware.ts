import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { isPublicRoute, isProtectedRoute, isAdminRoute, getRouteType } from '@/lib/auth-config'

// Supabase用の設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// リダイレクトレスポンスを作成するヘルパー関数
function createRedirectResponse(req: Request, path: string, message?: string) {
  const url = new URL(path, req.url)
  
  // メッセージがある場合はクエリパラメータとして追加
  if (message) {
    url.searchParams.set('message', message)
  }
  
  // 元のURLを保存（ログイン後に戻るため）
  const originalUrl = new URL(req.url).pathname
  if (originalUrl !== path) {
    url.searchParams.set('redirectTo', originalUrl)
  }
  
  // キャッシュを無効化するヘッダーを設定（304エラーを防ぐため）
  const headers = new Headers()
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  headers.set('Pragma', 'no-cache')
  headers.set('Expires', '0')
  
  // 302リダイレクト（一時的なリダイレクト）を使用
  return NextResponse.redirect(url, {
    status: 302,
    headers,
  })
}

// Supabase認証用のミドルウェア
async function supabaseMiddleware(req: Request) {
  const { pathname } = new URL(req.url)
  
  // パブリックルートのチェック
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }
  
  // ルートの種類を取得
  const routeType = getRouteType(pathname)
  
  // 管理者ルートの場合は追加の権限チェックが必要（将来の拡張用）
  if (routeType === 'admin') {
    // 現在は管理者権限の実装は省略
    console.log('Admin route accessed:', pathname)
  }
  
  try {
    // Cookieからセッション情報を取得
    const cookieHeader = req.headers.get('cookie')
    if (!cookieHeader) {
      console.log('[Middleware] No cookies found, redirecting to sign-in')
      return createRedirectResponse(req, '/sign-in', 'ログインが必要です')
    }
    
    // デバッグ: すべてのCookieをログ出力
    const cookies = cookieHeader.split(';').map(c => c.trim())
    console.log('[Middleware] All cookies:', cookies.map(c => c.split('=')[0]))
    
    // SupabaseのセッションCookieを探す（sb-<project-ref>-auth-token形式）
    const sessionCookie = cookies.find(cookie => cookie.startsWith('sb-') && cookie.includes('auth-token'))
    
    if (!sessionCookie) {
      // sb-で始まるCookieを探す（デバッグ用）
      const sbCookies = cookies.filter(cookie => cookie.startsWith('sb-'))
      console.log('[Middleware] No Supabase session cookie found. Found sb- cookies:', sbCookies.map(c => c.split('=')[0]))
      return createRedirectResponse(req, '/sign-in', 'ログインが必要です')
    }
    
    console.log('[Middleware] Found session cookie:', sessionCookie.split('=')[0])
    
    // セッションCookieの値を取得
    const cookieValue = sessionCookie.split('=').slice(1).join('=') // =が値に含まれる可能性があるため
    if (!cookieValue || cookieValue === 'null' || cookieValue === 'undefined' || cookieValue === '') {
      console.log('Invalid session cookie value, redirecting to sign-in')
      return createRedirectResponse(req, '/sign-in', 'ログインが必要です')
    }
    
    // セッションCookieからアクセストークンを取得して検証
    try {
      // Cookieの値をデコード
      let sessionData: any
      try {
        // URLデコードを試行
        const decoded = decodeURIComponent(cookieValue)
        sessionData = JSON.parse(decoded)
      } catch {
        // URLデコードが失敗した場合は、そのままJSONパースを試行
        sessionData = JSON.parse(cookieValue)
      }
      
      // アクセストークンを取得
      const accessToken = sessionData?.access_token || sessionData?.accessToken
      
      if (!accessToken) {
        console.log('No access token found in session cookie, redirecting to sign-in')
        return createRedirectResponse(req, '/sign-in', 'ログインが必要です')
      }
      
      // Supabaseでトークンを検証
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      
      if (error || !user) {
        console.log('Token validation failed:', error?.message || 'No user found')
        return createRedirectResponse(req, '/sign-in', '認証に失敗しました')
      }
      
      // 認証成功
      console.log('User authenticated:', user.id)
      return NextResponse.next()
      
    } catch (error) {
      console.log('Failed to parse or validate session cookie:', error)
      return createRedirectResponse(req, '/sign-in', 'ログインが必要です')
    }
    
  } catch (error) {
    console.error('Supabase auth error:', error)
    return createRedirectResponse(req, '/sign-in', '認証エラーが発生しました')
  }
}

// メインのミドルウェア関数
export default async function middleware(req: Request) {
  // 認証チェックを有効化
  return supabaseMiddleware(req)
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
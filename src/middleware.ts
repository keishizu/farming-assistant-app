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
      console.log('[Middleware] Invalid session cookie value, redirecting to sign-in')
      return createRedirectResponse(req, '/sign-in', 'ログインが必要です')
    }
    
    // デバッグ: Cookieの値の最初の50文字をログ出力
    console.log('[Middleware] Cookie value preview:', cookieValue.substring(0, 50) + (cookieValue.length > 50 ? '...' : ''))
    console.log('[Middleware] Cookie value starts with base64-:', cookieValue.startsWith('base64-'))
    
    // セッションCookieからアクセストークンを取得して検証
    try {
      // Cookieの値をデコード
      let sessionData: any
      
      // Base64エンコードされたCookieかどうかをチェック
      if (cookieValue.startsWith('base64-')) {
        // Base64エンコードされたCookieの場合
        try {
          const base64Data = cookieValue.substring(7) // "base64-"を除去
          const decodedData = Buffer.from(base64Data, 'base64').toString('utf-8')
          sessionData = JSON.parse(decodedData)
          console.log('[Middleware] Successfully decoded base64 cookie')
          console.log('[Middleware] Decoded session data keys:', Object.keys(sessionData))
        } catch (base64Error) {
          console.log('[Middleware] Failed to decode base64 cookie:', base64Error)
          throw base64Error
        }
      } else {
        // 通常のJSON形式のCookieの場合
        try {
          // URLデコードを試行
          const decoded = decodeURIComponent(cookieValue)
          sessionData = JSON.parse(decoded)
          console.log('[Middleware] Successfully parsed JSON cookie (with URL decode)')
          console.log('[Middleware] Parsed session data keys:', Object.keys(sessionData))
        } catch (urlDecodeError) {
          // URLデコードが失敗した場合は、そのままJSONパースを試行
          try {
            sessionData = JSON.parse(cookieValue)
            console.log('[Middleware] Successfully parsed cookie without URL decode')
            console.log('[Middleware] Parsed session data keys:', Object.keys(sessionData))
          } catch (parseError) {
            console.log('[Middleware] Failed to parse cookie as JSON:', parseError)
            throw parseError
          }
        }
      }
      
      // セッションの有効性をチェック（アクセストークンとユーザー情報の存在を確認）
      const accessToken = sessionData?.access_token || sessionData?.accessToken
      const user = sessionData?.user
      const expiresAt = sessionData?.expires_at
      
      console.log('[Middleware] Session validation:', {
        hasAccessToken: !!accessToken,
        hasUser: !!user,
        userId: user?.id,
        expiresAt: expiresAt ? new Date(expiresAt * 1000).toISOString() : null,
      })
      
      // セッションの基本情報が揃っているか確認
      if (!accessToken || !user) {
        console.log('[Middleware] Invalid session data: missing access_token or user')
        return createRedirectResponse(req, '/sign-in', 'ログインが必要です')
      }
      
      // セッションの有効期限をチェック（オプション）
      if (expiresAt) {
        const expiresAtDate = new Date(expiresAt * 1000)
        const now = new Date()
        if (expiresAtDate < now) {
          console.log('[Middleware] Session expired:', {
            expiresAt: expiresAtDate.toISOString(),
            now: now.toISOString(),
          })
          // 有効期限切れでも、クライアントサイドでのリフレッシュに任せる
          // return createRedirectResponse(req, '/sign-in', 'セッションの有効期限が切れました')
        }
      }
      
      // セッションCookieが有効な形式であれば、アクセスを許可
      // 実際のトークン検証はクライアントサイドで行われる
      console.log('[Middleware] Valid session cookie found, allowing access')
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
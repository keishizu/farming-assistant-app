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
  
  return NextResponse.redirect(url)
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
    // リクエストヘッダーからAuthorizationトークンを取得
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (token) {
      // トークンが提供されている場合は検証
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (error || !user) {
        console.log('Token validation failed:', error?.message)
        return createRedirectResponse(req, '/sign-in', '認証に失敗しました')
      }
      
      // 認証成功
      return NextResponse.next()
    }
    
    // Cookieからセッション情報を取得
    const cookieHeader = req.headers.get('cookie')
    if (!cookieHeader) {
      console.log('No cookies found, redirecting to sign-in')
      return createRedirectResponse(req, '/sign-in', 'ログインが必要です')
    }
    
    // SupabaseのセッションCookieをチェック
    const sessionCookie = cookieHeader
      .split(';')
      .find(cookie => cookie.trim().startsWith('sb-'))
    
    if (!sessionCookie) {
      console.log('No Supabase session cookie found, redirecting to sign-in')
      return createRedirectResponse(req, '/sign-in', 'ログインが必要です')
    }
    
    // セッションCookieの値を取得して検証
    const cookieValue = sessionCookie.split('=')[1]
    if (!cookieValue || cookieValue === 'null' || cookieValue === 'undefined') {
      console.log('Invalid session cookie value, redirecting to sign-in')
      return createRedirectResponse(req, '/sign-in', 'ログインが必要です')
    }
    
    // デバッグ用: セッションCookieの内容をログ出力
    console.log('Session cookie value:', cookieValue.substring(0, 50) + '...')
    
    // セッションCookieの内容をデコードして検証
    try {
      let sessionData
      
      // Base64エンコードされたCookieかどうかをチェック
      if (cookieValue.startsWith('base64-')) {
        // Base64エンコードされたCookieの場合
        const base64Data = cookieValue.substring(7) // "base64-"を除去
        const decodedData = Buffer.from(base64Data, 'base64').toString('utf-8')
        sessionData = JSON.parse(decodedData)
      } else {
        // 通常のURLエンコードされたCookieの場合
        const decodedCookie = decodeURIComponent(cookieValue)
        sessionData = JSON.parse(decodedCookie)
      }
      
      // セッションの詳細情報をログ出力
      console.log('Session data:', {
        hasAccessToken: !!sessionData.access_token,
        hasUser: !!sessionData.user,
        userId: sessionData.user?.id,
        expiresAt: sessionData.expires_at,
        tokenType: sessionData.token_type
      })
      
      // セッションの有効性をチェック
      if (!sessionData.access_token || !sessionData.user) {
        console.log('Invalid session data in cookie, redirecting to sign-in')
        return createRedirectResponse(req, '/sign-in', 'ログインが必要です')
      }
      
      // セッションの有効期限をチェック（一時的に無効化）
      // Supabaseは自動的にリフレッシュトークンで更新するため、ミドルウェアでは厳密な有効期限チェックは行わない
      if (sessionData.expires_at) {
        const expiresAt = new Date(sessionData.expires_at * 1000)
        const now = new Date()
        console.log('Session expires at:', expiresAt.toISOString())
        console.log('Current time:', now.toISOString())
        console.log('Session expired?', expiresAt < now)
        
        // 有効期限が切れていても、クライアントサイドでの認証状態管理に任せる
        // if (expiresAt < now) {
        //   console.log('Session expired, redirecting to sign-in')
        //   return createRedirectResponse(req, '/sign-in', 'ログインが必要です')
        // }
      }
      
      console.log('Valid session cookie found, allowing access')
      return NextResponse.next()
    } catch (error) {
      console.log('Failed to parse session cookie, redirecting to sign-in:', error)
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
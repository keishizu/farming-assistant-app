import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/work-record'

  console.log('Auth callback received:', { code: !!code, next })

  // キャッシュを無効化するヘッダーを設定（304エラーを防ぐため）
  const headers = new Headers()
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  headers.set('Pragma', 'no-cache')
  headers.set('Expires', '0')

  if (code) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.session) {
      // 認証成功 - 作業記録画面にリダイレクト
      console.log('Email confirmation successful, redirecting to:', next)
      console.log('User authenticated:', data.session.user?.id)
      
      // 302リダイレクト（一時的なリダイレクト）を使用（307ではなく302）
      const redirectUrl = new URL(next, request.url)
      return NextResponse.redirect(redirectUrl, {
        status: 302,
        headers,
      })
    } else if (error) {
      console.error('Email confirmation failed:', error.message)
      // エラーの場合はログインページにリダイレクトし、エラーメッセージを表示
      const signInUrl = new URL('/sign-in', request.url)
      signInUrl.searchParams.set('error', 'メール確認に失敗しました。もう一度お試しください。')
      return NextResponse.redirect(signInUrl, {
        status: 302,
        headers,
      })
    }
  }

  // 認証失敗またはコードがない場合はログインページにリダイレクト
  console.log('No code provided, redirecting to sign-in')
  return NextResponse.redirect(new URL('/sign-in', request.url), {
    status: 302,
    headers,
  })
}

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // 認証成功 - リダイレクト先のURLにリダイレクト
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // 認証失敗またはコードがない場合はサインインページにリダイレクト
  return NextResponse.redirect(new URL('/sign-in', request.url))
}

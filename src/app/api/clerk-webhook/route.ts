import { Webhook, type WebhookRequiredHeaders } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";   // ← 関数ではなく “オブジェクト”
import { randomUUID } from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // --- 署名検証 -------------------------------------------------
  const payload = await req.text();
  const svixHeaders: WebhookRequiredHeaders = {
    "svix-id": headers().get("svix-id") ?? "",
    "svix-timestamp": headers().get("svix-timestamp") ?? "",
    "svix-signature": headers().get("svix-signature") ?? "",
  };
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  let evt: any;
  try {
    evt = wh.verify(payload, svixHeaders);
  } catch (err) {
    return NextResponse.json({ ok: false, error: "verification_failed" }, { status: 400 });
  }

  // --- 対象イベントだけ処理 ------------------------------------
  if (evt.type === "user.created") {
    const userId   = evt.data.id as string;
    const existing = evt.data.public_metadata?.supabase_uuid;

    if (!existing) {
      const supabase_uuid = randomUUID();
    
      try {
        // ① まず実体を取得
        const client = await clerkClient();          // <- ここを追加
    
        // ② 取得したオブジェクトで users API を呼ぶ
        await client.users.updateUserMetadata(userId, {
          publicMetadata: { supabase_uuid },         // camelCase が正
        });
    
        console.log(`supabase_uuid set for ${userId}: ${supabase_uuid}`);
      } catch (e: any) {
        // ダミーID や削除済みユーザーで 404 が出るのは握りつぶす
        if (e.status !== 404) throw e;
        console.warn(`user ${userId} not found, skipped`);
      }
    }
  }

  // --- 必ず Response を返す ------------------------------------
  return NextResponse.json({ ok: true });
}



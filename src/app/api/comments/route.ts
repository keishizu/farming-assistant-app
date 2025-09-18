import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { CreateCommentRequest, CommentResponse, CommentsResponse } from "@/types/comment";

// コメントの投稿
export async function POST(request: NextRequest): Promise<NextResponse<CommentResponse>> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "認証が必要です" },
        { status: 401 }
      );
    }

    const body: CreateCommentRequest = await request.json();
    
    if (!body.nickname || !body.content) {
      return NextResponse.json(
        { success: false, error: "ニックネームとコメント内容は必須です" },
        { status: 400 }
      );
    }

    if (body.content.length > 1000) {
      return NextResponse.json(
        { success: false, error: "コメントは1000文字以内で入力してください" },
        { status: 400 }
      );
    }

    // 新しいコメントを作成
    const newComment = {
      id: Date.now().toString(),
      nickname: body.nickname,
      content: body.content,
      timestamp: new Date(),
      userId: userId,
    };

    // ここでデータベースに保存する処理を実装
    // 現在はメモリ上で管理（後でデータベースに変更予定）
    
    return NextResponse.json(
      { success: true, data: newComment },
      { status: 201 }
    );
  } catch (error) {
    console.error("コメント投稿エラー:", error);
    return NextResponse.json(
      { success: false, error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

// コメントの取得
export async function GET(): Promise<NextResponse<CommentsResponse>> {
  try {
    // サンプルデータ（後でデータベースから取得に変更予定）
    const sampleComments = [
      {
        id: "1",
        nickname: "地元農家",
        content: "今日は収穫日和でした！トマトの出来が最高です。",
        timestamp: new Date(2024, 1, 28, 14, 30),
      },
      {
        id: "2",
        nickname: "グリーンサム",
        content: "アブラムシの対策で困っている方いますか？ニームオイルが効果的でした。",
        timestamp: new Date(2024, 1, 28, 12, 15),
      },
      {
        id: "3",
        nickname: "ベテラン農家",
        content: "連作障害の対策について、輪作の重要性を再認識しました。",
        timestamp: new Date(2024, 1, 28, 10, 0),
      },
    ];

    return NextResponse.json(
      { success: true, data: sampleComments },
      { status: 200 }
    );
  } catch (error) {
    console.error("コメント取得エラー:", error);
    return NextResponse.json(
      { success: false, error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

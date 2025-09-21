"use client";

import { useState, useEffect, useCallback } from "react";
import { Comment, CreateCommentRequest, CommentResponse, CommentsResponse } from "@/types/comment";

export function useComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // コメント一覧を取得
  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/comments");
      const data: CommentsResponse = await response.json();
      
      if (data.success && data.data) {
        setComments(data.data);
      } else {
        setError(data.error || "コメントの取得に失敗しました");
      }
    } catch (err) {
      setError("ネットワークエラーが発生しました");
      console.error("コメント取得エラー:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // コメントを投稿
  const postComment = useCallback(async (commentData: CreateCommentRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(commentData),
      });
      
      const data: CommentResponse = await response.json();
      
      if (data.success && data.data) {
        // 新しいコメントをリストの先頭に追加
        setComments(prev => [data.data!, ...prev]);
        return true;
      } else {
        setError(data.error || "コメントの投稿に失敗しました");
        return false;
      }
    } catch (err) {
      setError("ネットワークエラーが発生しました");
      console.error("コメント投稿エラー:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 初回読み込み時にコメントを取得
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    comments,
    loading,
    error,
    postComment,
    fetchComments,
  };
}

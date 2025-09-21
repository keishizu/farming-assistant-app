"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useComments } from "@/hooks/useComments";
import { CreateCommentRequest } from "@/types/comment";

export default function CommentScreen() {
  const [nickname, setNickname] = useState("");
  const [comment, setComment] = useState("");
  const { comments, loading, error, postComment } = useComments();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim() || !comment.trim()) {
      return;
    }

    const commentData: CreateCommentRequest = {
      nickname: nickname.trim(),
      content: comment.trim(),
    };

    const success = await postComment(commentData);
    if (success) {
      setComment("");
      // ニックネームは保持（ユーザビリティ向上）
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSubmit(e as any);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <MessageCircle className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-green-800">農家掲示板</h1>
        </div>
        <p className="text-gray-600 text-lg">農作業の経験や知恵を共有しましょう</p>
      </motion.div>

      <Card className="p-6 space-y-4 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="ニックネーム（任意）"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="text-lg"
            maxLength={50}
          />
          <div className="relative">
            <Textarea
              placeholder="農作業の経験や知恵を共有してください..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={handleKeyPress}
              className="min-h-[120px] text-lg resize-none"
              maxLength={1000}
            />
            <div className="absolute bottom-2 right-2 text-sm text-gray-400">
              {comment.length}/1000
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700 text-lg py-3"
            disabled={loading || !nickname.trim() || !comment.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                投稿中...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                投稿する
              </>
            )}
          </Button>
        </form>
        <p className="text-sm text-gray-500 text-center">
          Ctrl + Enter で投稿できます
        </p>
      </Card>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 text-center">
          最新の投稿 ({comments.length})
        </h2>
        
        {loading && comments.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        ) : comments.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">まだ投稿がありません</p>
            <p className="text-gray-400">最初の投稿をしてみましょう！</p>
          </Card>
        ) : (
          comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-semibold text-green-800 text-lg">
                    {comment.nickname}
                  </span>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {format(new Date(comment.timestamp), "M月d日 H:mm", { locale: ja })}
                  </span>
                </div>
                <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
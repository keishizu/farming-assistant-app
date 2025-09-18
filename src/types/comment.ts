export interface Comment {
  id: string;
  nickname: string;
  content: string;
  timestamp: Date;
  userId?: string;
}

export interface CreateCommentRequest {
  nickname: string;
  content: string;
}

export interface CommentResponse {
  success: boolean;
  data?: Comment;
  error?: string;
}

export interface CommentsResponse {
  success: boolean;
  data?: Comment[];
  error?: string;
}

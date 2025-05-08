// "use client";

// import { useState } from "react";
// import { motion } from "framer-motion";
// import { Card } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { format } from "date-fns";
// import { ja } from "date-fns/locale";

// const comments = [
//   {
//     id: 1,
//     nickname: "地元農家",
//     content: "今日は収穫日和でした！トマトの出来が最高です。",
//     timestamp: new Date(2024, 1, 28, 14, 30),
//   },
//   {
//     id: 2,
//     nickname: "グリーンサム",
//     content: "アブラムシの対策で困っている方いますか？ニームオイルが効果的でした。",
//     timestamp: new Date(2024, 1, 28, 12, 15),
//   },
// ];

// export default function CommentScreen() {
//   const [nickname, setNickname] = useState("");
//   const [comment, setComment] = useState("");

//   return (
//     <div className="max-w-md mx-auto p-4 space-y-6">
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="text-center"
//       >
//         <h1 className="text-2xl font-semibold text-green-800">掲示板</h1>
//         <p className="text-gray-600">農作業の経験を共有しましょう</p>
//       </motion.div>

//       <Card className="p-4 space-y-4">
//         <Input
//           placeholder="ニックネーム（任意）"
//           value={nickname}
//           onChange={(e) => setNickname(e.target.value)}
//         />
//         <Textarea
//           placeholder="メッセージを入力..."
//           value={comment}
//           onChange={(e) => setComment(e.target.value)}
//           className="min-h-[100px]"
//         />
//         <Button className="w-full bg-green-600 hover:bg-green-700">
//           投稿する
//         </Button>
//       </Card>

//       <div className="space-y-4">
//         {comments.map((comment) => (
//           <motion.div
//             key={comment.id}
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//           >
//             <Card className="p-4">
//               <div className="flex justify-between items-start mb-2">
//                 <span className="font-medium text-green-800">
//                   {comment.nickname}
//                 </span>
//                 <span className="text-sm text-gray-500">
//                   {format(comment.timestamp, "M月d日 H:mm", { locale: ja })}
//                 </span>
//               </div>
//               <p className="text-gray-700">{comment.content}</p>
//             </Card>
//           </motion.div>
//         ))}
//       </div>
//     </div>
//   );
// }
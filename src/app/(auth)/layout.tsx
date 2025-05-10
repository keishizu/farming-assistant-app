export const dynamic = "force-dynamic"; // 🔥 これを先頭に追加

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth(); 
  if (!userId) redirect("/sign-in");

  return <>{children}</>;
}

"use client";

import { Home, Calendar, CheckSquare, MessageSquare, Sprout, Brain } from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: "/", icon: Home, label: "ホーム" },
    { href: "/calendar", icon: Calendar, label: "カレンダー" },
    { href: "/todo", icon: CheckSquare, label: "タスク" },
    { href: "/crop-schedule", icon: Sprout, label: "カスタム" },
    { href: "/smart-schedule", icon: Brain, label: "スマート" },
    { href: "/comments", icon: MessageSquare, label: "掲示板" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
        {links.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center w-16"
            >
              <div className="relative w-12 h-8 flex items-center justify-center">
                {isActive && (
                  <motion.div
                    layoutId="bubble"
                    className="absolute inset-0 bg-green-100 rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className={`w-6 h-6 relative ${isActive ? 'text-green-700' : 'text-gray-500'}`} />
              </div>
              <span className={`text-xs mt-1 ${isActive ? 'text-green-700' : 'text-gray-600'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
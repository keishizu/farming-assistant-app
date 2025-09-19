"use client";

import { Home, Calendar, CheckSquare, MessageSquare, Sprout, Brain } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: "/work-record", icon: Home, label: "作業記録" },
    { href: "/calendar", icon: Calendar, label: "カレンダー" },
    { href: "/todo", icon: CheckSquare, label: "タスク" },
    { href: "/crop-schedule", icon: Sprout, label: "カスタム" },
    { href: "/smart-schedule", icon: Brain, label: "スマート" },
    { href: "/comments", icon: MessageSquare, label: "掲示板" },
  ];

  return (
    <nav className="fixed top-0 left-0 bottom-0 w-20 bg-white border-r border-gray-200 z-50">
      <div className="flex flex-col items-center py-4 h-full">
        <div className="flex flex-col gap-4">
          {links.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="relative flex flex-col items-center w-16 group"
                title={label}
              >
                <div className="relative w-12 h-12 flex items-center justify-center">
                  {isActive && (
                    <motion.div
                      layoutId="bubble"
                      className="absolute inset-0 bg-green-100 rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className={`w-6 h-6 relative ${isActive ? 'text-green-700' : 'text-gray-500'} group-hover:text-green-600`} />
                </div>
                <span className={`text-xs mt-1 text-center leading-tight ${isActive ? 'text-green-700' : 'text-gray-600'}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
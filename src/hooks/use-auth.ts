'use client';

import { useAuth as useClerkAuth } from '@clerk/nextjs';

export function useAuth() {
  const { userId, isSignedIn, getToken } = useClerkAuth();
  return { user: { id: userId, getToken }, isSignedIn };
} 
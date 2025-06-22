import { createHash } from 'crypto';

export function toStableUUID(clerkId: string): string {
  const hash = createHash('sha256').update(clerkId).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    hash.substring(12, 16),
    hash.substring(16, 20),
    hash.substring(20, 32)
  ].join('-');
} 
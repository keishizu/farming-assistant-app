import { toStableUUID } from '../../src/utils/user-id';
/// <reference types="jest" />

describe('toStableUUID', () => {
  it('should generate the same UUID for the same Clerk ID', () => {
    const clerkId = 'test-clerk-id';
    const uuid1 = toStableUUID(clerkId);
    const uuid2 = toStableUUID(clerkId);
    expect(uuid1).toBe(uuid2);
  });

  it('should generate different UUIDs for different Clerk IDs', () => {
    const clerkId1 = 'test-clerk-id-1';
    const clerkId2 = 'test-clerk-id-2';
    const uuid1 = toStableUUID(clerkId1);
    const uuid2 = toStableUUID(clerkId2);
    expect(uuid1).not.toBe(uuid2);
  });

  it('should generate a UUID in the correct format', () => {
    const clerkId = 'test-clerk-id';
    const uuid = toStableUUID(clerkId);
    const uuidFormat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    expect(uuid).toMatch(uuidFormat);
  });
}); 
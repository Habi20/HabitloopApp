
import { expect, vi } from 'vitest';
import { beforeEach } from 'vitest';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:Getintosup_123@db.hkkvlenrqxoaavofwiuc.supabase.co:5432/postgres';

// Global test setup
beforeEach(() => {
  vi.clearAllMocks();
});

// Extend expect with custom matchers if needed
expect.extend({
  // Custom matchers can be added here
});

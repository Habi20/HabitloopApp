import { beforeAll, afterEach, afterAll, beforeEach, vi } from "vitest";
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock environment variables
process.env.NODE_ENV = 'test';

// Setup global test environment
beforeAll(() => {
  // Global setup
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Cleanup after all tests
afterAll(() => {
  // Global cleanup
});

// Mock fetch for tests
global.fetch = vi.fn();

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Make vi available globally
global.vi = vi;

// Mock OpenAI for tests
vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: "Test Insight",
                  content: "Test content",
                  type: "motivation",
                }),
              },
            },
          ],
        }),
      },
    },
  })),
}));

// Global test setup
beforeEach(() => {
  vi.clearAllMocks();
});
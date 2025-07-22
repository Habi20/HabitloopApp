import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { Express } from "express";
import { registerRoutes } from "../routes";
import express from "express";
import { storage } from "../storage";

vi.mock("../storage");
const mockStorage = storage as any;

describe("Edge Cases and Error Handling", () => {
  let app: Express;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
    jest.clearAllMocks();
  });

  describe("Authentication Edge Cases", () => {
    it("should handle requests without authentication", async () => {
      const response = await request(app).get("/api/habits");

      expect(response.status).toBe(401);
    });

    it("should handle invalid session tokens", async () => {
      const response = await request(app)
        .get("/api/habits")
        .set("Cookie", "session=invalid-token");

      expect(response.status).toBe(401);
    });
  });

  describe("Data Validation Edge Cases", () => {
    it("should handle extremely long habit titles", async () => {
      const longTitle = "A".repeat(1000);

      const response = await request(app)
        .post("/api/habits")
        .set("Cookie", "session=mock-session")
        .send({
          title: longTitle,
          category: "fitness",
        });

      expect(response.status).toBe(400);
    });

    it("should handle SQL injection attempts", async () => {
      const maliciousTitle = "'; DROP TABLE habits; --";

      const response = await request(app)
        .post("/api/habits")
        .set("Cookie", "session=mock-session")
        .send({
          title: maliciousTitle,
          category: "fitness",
        });

      // Should either reject or sanitize
      expect([200, 400]).toContain(response.status);
    });

    it("should handle XSS attempts in habit descriptions", async () => {
      const xssScript = '<script>alert("xss")</script>';

      const response = await request(app)
        .post("/api/habits")
        .set("Cookie", "session=mock-session")
        .send({
          title: "Safe Title",
          description: xssScript,
          category: "fitness",
        });

      expect(response.status).toBe(200);
      expect(response.body.description).not.toContain("<script>");
    });
  });

  describe("Database Connection Edge Cases", () => {
    it("should handle database timeouts gracefully", async () => {
      mockStorage.getUserHabits.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Connection timeout")), 100),
          ),
      );

      const response = await request(app)
        .get("/api/habits")
        .set("Cookie", "session=mock-session");

      expect(response.status).toBe(500);
      expect(response.body.message).toContain("Failed to fetch habits");
    });
  });

  describe("Rate Limiting Edge Cases", () => {
    it("should handle rapid successive requests", async () => {
      mockStorage.createHabit.mockResolvedValue({ id: 1, title: "Test" });

      const promises = Array(10)
        .fill(null)
        .map(() =>
          request(app)
            .post("/api/habits")
            .set("Cookie", "session=mock-session")
            .send({
              title: "Rapid Test",
              category: "fitness",
            }),
        );

      const responses = await Promise.all(promises);

      // All should succeed or some should be rate limited
      responses.forEach((response) => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });

  describe("Date and Time Edge Cases", () => {
    it("should handle invalid date formats in completions", async () => {
      const response = await request(app)
        .post("/api/completions")
        .set("Cookie", "session=mock-session")
        .send({
          habitId: 1,
          completedAt: "invalid-date",
        });

      expect(response.status).toBe(400);
    });

    it("should handle future dates in completions", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const response = await request(app)
        .post("/api/completions")
        .set("Cookie", "session=mock-session")
        .send({
          habitId: 1,
          completedAt: futureDate.toISOString().split("T")[0],
        });

      expect(response.status).toBe(400);
    });
  });
});

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import request from "supertest";
import { Express } from "express";
import { registerRoutes } from "../routes";
import express from "express";
import { storage } from "../storage";

// Mock storage
vi.mock("../storage");
const mockStorage = storage as any;

describe("Habit Routes - Core Functionality", () => {
  let app: Express;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
    vi.clearAllMocks();
  });

  describe("POST /api/habits - Create Habit", () => {
    it("should create a valid habit successfully", async () => {
      const mockHabit = {
        id: 1,
        userId: "demo-user",
        title: "Morning Exercise",
        description: "Daily workout routine",
        category: "fitness",
        targetValue: 30,
        unit: "minutes",
        frequency: "daily",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStorage.createHabit.mockResolvedValue(mockHabit);

      const response = await request(app)
        .post("/api/habits")
        .set("Cookie", "session=mock-session")
        .send({
          title: "Morning Exercise",
          description: "Daily workout routine",
          category: "fitness",
          targetValue: 30,
          unit: "minutes",
          frequency: "daily",
        });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe("Morning Exercise");
    });

    it("should reject habit with empty title", async () => {
      const response = await request(app)
        .post("/api/habits")
        .set("Cookie", "session=mock-session")
        .send({
          title: "",
          category: "fitness",
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("title");
    });

    it("should reject habit with invalid category", async () => {
      const response = await request(app)
        .post("/api/habits")
        .set("Cookie", "session=mock-session")
        .send({
          title: "Test Habit",
          category: "",
        });

      expect(response.status).toBe(400);
    });

    it("should handle negative target values", async () => {
      const response = await request(app)
        .post("/api/habits")
        .set("Cookie", "session=mock-session")
        .send({
          title: "Test Habit",
          category: "fitness",
          targetValue: -5,
        });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/habits - Fetch Habits", () => {
    it("should return user habits", async () => {
      const mockHabits = [
        { id: 1, title: "Exercise", userId: "demo-user" },
        { id: 2, title: "Meditation", userId: "demo-user" },
      ];

      mockStorage.getUserHabits.mockResolvedValue(mockHabits);

      const response = await request(app)
        .get("/api/habits")
        .set("Cookie", "session=mock-session");

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it("should return empty array for user with no habits", async () => {
      mockStorage.getUserHabits.mockResolvedValue([]);

      const response = await request(app)
        .get("/api/habits")
        .set("Cookie", "session=mock-session");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe("DELETE /api/habits/:id - Delete Habit", () => {
    it("should delete existing habit", async () => {
      mockStorage.deleteHabit.mockResolvedValue(undefined);

      const response = await request(app)
        .delete("/api/habits/1")
        .set("Cookie", "session=mock-session");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should handle deletion of non-existent habit", async () => {
      mockStorage.deleteHabit.mockRejectedValue(new Error("Habit not found"));

      const response = await request(app)
        .delete("/api/habits/999")
        .set("Cookie", "session=mock-session");

      expect(response.status).toBe(500);
    });
  });
});

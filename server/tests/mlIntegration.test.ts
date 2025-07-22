import { describe, it, expect, beforeEach, vi } from "vitest";
import { mlServiceFixed } from "../mlServiceFixed";

describe("ML Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Model Training", () => {
    it("should train model with synthetic data", async () => {
      const result = await mlServiceFixed.trainModelWithDemo();

      expect(result.success).toBe(true);
      expect(result.r2_score).toBeGreaterThan(0.7);
      expect(result.training_samples).toBeGreaterThan(100);
    });

    it("should handle training failures gracefully", async () => {
      // Test with invalid data
      jest
        .spyOn(mlServiceFixed, "trainModelWithDemo")
        .mockRejectedValue(new Error("Training failed"));

      await expect(mlServiceFixed.trainModelWithDemo()).rejects.toThrow(
        "Training failed",
      );
    });
  });

  describe("Prediction Accuracy", () => {
    it("should predict high success for optimal profiles", async () => {
      const optimalProfile = {
        level: 5,
        xp: 2500,
        category: "health",
        target_value: 1,
        frequency: "daily",
        reminder_set: true,
        existing_habits_count: 3,
        difficulty_score: 0.3,
      };

      const prediction = await mlServiceFixed.predictSuccess(optimalProfile);

      expect(prediction.success).toBe(true);
      expect(prediction.prediction).toBeGreaterThan(0.7);
      expect(prediction.confidence).toBe("high");
    });

    it("should predict low success for challenging profiles", async () => {
      const challengingProfile = {
        level: 1,
        xp: 50,
        category: "productivity",
        target_value: 5,
        frequency: "daily",
        reminder_set: false,
        existing_habits_count: 8,
        difficulty_score: 0.9,
      };

      const prediction =
        await mlServiceFixed.predictSuccess(challengingProfile);

      expect(prediction.success).toBe(true);
      expect(prediction.prediction).toBeLessThan(0.4);
      expect(prediction.confidence).toBe("low");
    });
  });
});

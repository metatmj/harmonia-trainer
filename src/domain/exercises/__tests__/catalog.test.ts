import { describe, it, expect } from "vitest";
import { EXERCISE_CATALOG, getExerciseBySlug } from "../catalog.js";

describe("EXERCISE_CATALOG", () => {
  it("contains exactly three exercises", () => {
    expect(EXERCISE_CATALOG).toHaveLength(3);
  });

  it("each exercise has required fields", () => {
    for (const ex of EXERCISE_CATALOG) {
      expect(ex.id).toBeTruthy();
      expect(ex.slug).toBeTruthy();
      expect(ex.title).toBeTruthy();
      expect(ex.description).toBeTruthy();
      expect(ex.type).toBeTruthy();
      expect(ex.supportedInputTypes.length).toBeGreaterThan(0);
      expect(ex.supportedDirections.length).toBeGreaterThan(0);
      expect(ex.defaultConfig).toBeDefined();
    }
  });

  it("includes match-third, sing-third, and phrase-harmony", () => {
    const slugs = EXERCISE_CATALOG.map((e) => e.slug);
    expect(slugs).toContain("match-third");
    expect(slugs).toContain("sing-third");
    expect(slugs).toContain("phrase-harmony");
  });

  it("match-third uses multiple-choice input", () => {
    const ex = EXERCISE_CATALOG.find((e) => e.slug === "match-third")!;
    expect(ex.supportedInputTypes).toContain("multiple-choice");
    expect(ex.defaultConfig.inputType).toBe("multiple-choice");
  });

  it("sing-third and phrase-harmony use voice input", () => {
    for (const slug of ["sing-third", "phrase-harmony"]) {
      const ex = EXERCISE_CATALOG.find((e) => e.slug === slug)!;
      expect(ex.supportedInputTypes).toContain("voice");
      expect(ex.defaultConfig.inputType).toBe("voice");
    }
  });

  it("every defaultConfig has a positive tempoBpm", () => {
    for (const ex of EXERCISE_CATALOG) {
      expect(ex.defaultConfig.tempoBpm).toBeGreaterThan(0);
    }
  });

  it("every defaultConfig has at least one allowedKey", () => {
    for (const ex of EXERCISE_CATALOG) {
      expect(ex.defaultConfig.allowedKeys.length).toBeGreaterThan(0);
    }
  });
});

describe("getExerciseBySlug", () => {
  it("returns the correct exercise for a known slug", () => {
    const ex = getExerciseBySlug("match-third");
    expect(ex).toBeDefined();
    expect(ex!.slug).toBe("match-third");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getExerciseBySlug("unknown-exercise")).toBeUndefined();
  });
});

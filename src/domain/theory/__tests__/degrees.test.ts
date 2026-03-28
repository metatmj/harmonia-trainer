import { describe, it, expect } from "vitest";
import {
  THIRD_ABOVE_MAP,
  THIRD_BELOW_MAP,
  getScaleDegree,
  getThirdAbove,
  getThirdBelow,
  type ScaleDegree,
} from "../degrees.js";

describe("THIRD_ABOVE_MAP", () => {
  it("maps every degree 1–7 to a degree 1–7", () => {
    const degrees: ScaleDegree[] = [1, 2, 3, 4, 5, 6, 7];
    for (const d of degrees) {
      const result = THIRD_ABOVE_MAP[d];
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(7);
    }
  });

  it("has the correct SRS-specified mapping", () => {
    expect(THIRD_ABOVE_MAP[1]).toBe(3);
    expect(THIRD_ABOVE_MAP[2]).toBe(4);
    expect(THIRD_ABOVE_MAP[3]).toBe(5);
    expect(THIRD_ABOVE_MAP[4]).toBe(6);
    expect(THIRD_ABOVE_MAP[5]).toBe(7);
    expect(THIRD_ABOVE_MAP[6]).toBe(1);
    expect(THIRD_ABOVE_MAP[7]).toBe(2);
  });
});

describe("THIRD_BELOW_MAP", () => {
  it("has the correct SRS-specified mapping", () => {
    expect(THIRD_BELOW_MAP[1]).toBe(6);
    expect(THIRD_BELOW_MAP[2]).toBe(7);
    expect(THIRD_BELOW_MAP[3]).toBe(1);
    expect(THIRD_BELOW_MAP[4]).toBe(2);
    expect(THIRD_BELOW_MAP[5]).toBe(3);
    expect(THIRD_BELOW_MAP[6]).toBe(4);
    expect(THIRD_BELOW_MAP[7]).toBe(5);
  });
});

describe("getScaleDegree", () => {
  it("returns the correct degree for each note in C major", () => {
    const cMajor = ["C", "D", "E", "F", "G", "A", "B"] as const;
    cMajor.forEach((note, i) => {
      expect(getScaleDegree(note, "C")).toBe(i + 1);
    });
  });

  it("returns null for a note not in the key", () => {
    expect(getScaleDegree("C#", "C")).toBeNull();
    expect(getScaleDegree("Bb", "C")).toBeNull();
  });

  it("returns the correct degree for notes in G major", () => {
    expect(getScaleDegree("G", "G")).toBe(1);
    expect(getScaleDegree("F#", "G")).toBe(7);
  });

  it("returns the correct degree for notes in F major", () => {
    expect(getScaleDegree("F", "F")).toBe(1);
    expect(getScaleDegree("Bb", "F")).toBe(4);
  });
});

describe("getThirdAbove", () => {
  it("returns the third above for each diatonic note in C major", () => {
    expect(getThirdAbove("C", "C")).toBe("E");
    expect(getThirdAbove("D", "C")).toBe("F");
    expect(getThirdAbove("E", "C")).toBe("G");
    expect(getThirdAbove("F", "C")).toBe("A");
    expect(getThirdAbove("G", "C")).toBe("B");
    expect(getThirdAbove("A", "C")).toBe("C");
    expect(getThirdAbove("B", "C")).toBe("D");
  });

  it("returns null for a non-diatonic note", () => {
    expect(getThirdAbove("C#", "C")).toBeNull();
  });

  it("works in G major", () => {
    expect(getThirdAbove("G", "G")).toBe("B");
    expect(getThirdAbove("B", "G")).toBe("D");
    expect(getThirdAbove("F#", "G")).toBe("A");
  });
});

describe("getThirdBelow", () => {
  it("returns the third below for each diatonic note in C major", () => {
    expect(getThirdBelow("C", "C")).toBe("A");
    expect(getThirdBelow("D", "C")).toBe("B");
    expect(getThirdBelow("E", "C")).toBe("C");
    expect(getThirdBelow("F", "C")).toBe("D");
    expect(getThirdBelow("G", "C")).toBe("E");
    expect(getThirdBelow("A", "C")).toBe("F");
    expect(getThirdBelow("B", "C")).toBe("G");
  });

  it("returns null for a non-diatonic note", () => {
    expect(getThirdBelow("F#", "C")).toBeNull();
  });

  it("works in F major", () => {
    expect(getThirdBelow("F", "F")).toBe("D");
    expect(getThirdBelow("Bb", "F")).toBe("G");
  });
});

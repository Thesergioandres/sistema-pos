import { describe, it, expect } from "vitest";
import { parseError } from "./errors";

describe("parseError", () => {
  it("devuelve el mensaje de Error", () => {
    expect(parseError(new Error("falló"))).toBe("falló");
  });
  it("devuelve string tal cual", () => {
    expect(parseError("oops")).toBe("oops");
  });
  it("serializa objetos no Error", () => {
    expect(parseError({ a: 1 })).toBe(JSON.stringify({ a: 1 }));
  });
  it("usa fallback cuando no serializa", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(parseError(circular, "F")).toBe("F");
  });
});

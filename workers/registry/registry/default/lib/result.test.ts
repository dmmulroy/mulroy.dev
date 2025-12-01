import { describe, expect, it } from "vitest";
import { Result } from "./result";

describe("Ok", () => {
  it("isOk returns true", () => {
    expect(Result.ok(1).isOk()).toBe(true);
  });

  it("isErr returns false", () => {
    expect(Result.ok(1).isErr()).toBe(false);
  });

  it("map transforms value", () => {
    const result = Result.ok(2).map((x) => x * 3);
    expect(result.isOk() && result.value).toBe(6);
  });

  it("mapErr returns same instance", () => {
    const original = Result.ok<number, string>(1);
    const mapped = original.mapErr((e) => e.length);
    expect(mapped).toBe(original);
  });

  it("andThen chains operations", () => {
    const result = Result.ok(2).andThen((x) => Result.ok(x * 3));
    expect(result.isOk() && result.value).toBe(6);
  });

  it("andThen propagates errors", () => {
    const result = Result.ok(2).andThen(() => Result.err("fail"));
    expect(result.isErr() && result.error).toBe("fail");
  });

  it("orElse returns same instance", () => {
    const original = Result.ok<number, string>(1);
    const result = original.orElse(() => Result.ok(2));
    expect(result).toBe(original);
  });

  it("unwrap returns value", () => {
    expect(Result.ok(42).unwrap()).toBe(42);
  });

  it("unwrapOr returns value", () => {
    expect(Result.ok(42).unwrapOr(0)).toBe(42);
  });

  it("unwrapErr throws", () => {
    expect(() => Result.ok(1).unwrapErr()).toThrow("Called unwrapErr on Ok");
  });

  it("match calls ok handler", () => {
    const result = Result.ok(5).match({
      ok: (v) => v * 2,
      err: () => 0,
    });
    expect(result).toBe(10);
  });
});

describe("Err", () => {
  it("isOk returns false", () => {
    expect(Result.err("fail").isOk()).toBe(false);
  });

  it("isErr returns true", () => {
    expect(Result.err("fail").isErr()).toBe(true);
  });

  it("map returns same instance", () => {
    const original = Result.err<string, number>("fail");
    const mapped = original.map((x) => x * 2);
    expect(mapped).toBe(original);
  });

  it("mapErr transforms error", () => {
    const result = Result.err("fail").mapErr((e) => e.length);
    expect(result.isErr() && result.error).toBe(4);
  });

  it("andThen returns same instance", () => {
    const original = Result.err<string, number>("fail");
    const result = original.andThen((x) => Result.ok(x * 2));
    expect(result).toBe(original);
  });

  it("orElse calls recovery function", () => {
    const result = Result.err<string, number>("fail").orElse(() =>
      Result.ok<number, string>(42),
    );
    expect(result.isOk() && result.value).toBe(42);
  });

  it("unwrap throws", () => {
    expect(() => Result.err("fail").unwrap()).toThrow("Called unwrap on Err");
  });

  it("unwrapOr returns default", () => {
    expect(Result.err<string, number>("fail").unwrapOr(0)).toBe(0);
  });

  it("unwrapErr returns error", () => {
    expect(Result.err("fail").unwrapErr()).toBe("fail");
  });

  it("match calls err handler", () => {
    const result = Result.err<string, number>("fail").match({
      ok: () => 0,
      err: (e) => e.length,
    });
    expect(result).toBe(4);
  });
});

describe("tryCatch", () => {
  it("returns Ok on success", () => {
    const result = Result.tryCatch(() => 42);
    expect(result.isOk() && result.value).toBe(42);
  });

  it("returns Err on throw with object form", () => {
    const result = Result.tryCatch({
      try: () => {
        throw new Error("oops");
      },
      catch: (e) => (e as Error).message,
    });
    expect(result.isErr() && result.error).toBe("oops");
  });

  it("uses default error handler wrapping in Error", () => {
    const original = new Error("oops");
    const result = Result.tryCatch(() => {
      throw original;
    });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toBe("Unexpected exception");
      expect(result.error.cause).toBe(original);
    }
  });
});

describe("tryCatchAsync", () => {
  it("returns Ok on success", async () => {
    const result = await Result.tryCatchAsync(async () => 42);
    expect(result.isOk() && result.value).toBe(42);
  });

  it("returns Err on rejection with object form", async () => {
    const result = await Result.tryCatchAsync({
      try: async () => {
        throw new Error("oops");
      },
      catch: (e) => (e as Error).message,
    });
    expect(result.isErr() && result.error).toBe("oops");
  });

  it("uses default error handler wrapping in Error", async () => {
    const original = new Error("oops");
    const result = await Result.tryCatchAsync(async () => {
      throw original;
    });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toBe("Unexpected exception");
      expect(result.error.cause).toBe(original);
    }
  });
});

describe("all", () => {
  it("returns Ok with all values on success", () => {
    const result = Result.all([Result.ok(1), Result.ok(2), Result.ok(3)]);
    expect(result.isOk() && result.value).toEqual([1, 2, 3]);
  });

  it("returns first Err on failure", () => {
    const result = Result.all([
      Result.ok(1),
      Result.err("first"),
      Result.ok(3),
      Result.err("second"),
    ]);
    expect(result.isErr() && result.error).toBe("first");
  });

  it("returns same Err instance (no allocation)", () => {
    const e = Result.err("fail");
    const result = Result.all([Result.ok(1), e, Result.ok(3)]);
    expect(result).toBe(e);
  });

  it("returns Ok for empty array", () => {
    const result = Result.all([]);
    expect(result.isOk() && result.value).toEqual([]);
  });
});

describe("partition", () => {
  it("returns Ok with all values on success", () => {
    const result = Result.partition([Result.ok(1), Result.ok(2), Result.ok(3)]);
    expect(result.isOk() && result.value).toEqual([1, 2, 3]);
  });

  it("returns Err with all errors on failure", () => {
    const result = Result.partition([
      Result.ok(1),
      Result.err("a"),
      Result.ok(2),
      Result.err("b"),
    ]);
    expect(result.isErr() && result.error).toEqual(["a", "b"]);
  });

  it("returns Ok for empty array", () => {
    const result = Result.partition([]);
    expect(result.isOk() && result.value).toEqual([]);
  });
});

describe("firstOk", () => {
  it("returns first Ok", () => {
    const result = Result.firstOk([
      Result.err("a"),
      Result.err("b"),
      Result.ok(1),
      Result.ok(2),
    ]);
    expect(result.isOk() && result.value).toBe(1);
  });

  it("returns last Err when all fail", () => {
    const result = Result.firstOk([
      Result.err("a"),
      Result.err("b"),
      Result.err("c"),
    ]);
    expect(result.isErr() && result.error).toBe("c");
  });

  it("throws on empty array", () => {
    expect(() => Result.firstOk([])).toThrow("firstOk called with empty array");
  });
});

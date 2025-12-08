import { describe, expect, it } from "vitest";
import { AsyncResult, Result } from "./result";

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

describe("try", () => {
  it("returns Ok on success", () => {
    const result = Result.try(() => 42);
    expect(result.isOk() && result.value).toBe(42);
  });

  it("returns Err on throw with object form", () => {
    const result = Result.try({
      try: () => {
        throw new Error("oops");
      },
      catch: (e: unknown) => (e as Error).message,
    });
    expect(result.isErr() && result.error).toBe("oops");
  });

  it("uses default error handler wrapping in Error", () => {
    const original = new Error("oops");
    const result = Result.try(() => {
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

describe("tryPromise", () => {
  it("returns Ok on success", async () => {
    const result = await Result.tryPromise(async () => 42);
    expect(result.isOk() && result.value).toBe(42);
  });

  it("returns Err on rejection with object form", async () => {
    const result = await Result.tryPromise({
      try: async () => {
        throw new Error("oops");
      },
      catch: (e: unknown) => (e as Error).message,
    });
    expect(result.isErr() && result.error).toBe("oops");
  });

  it("uses default error handler wrapping in Error", async () => {
    const original = new Error("oops");
    const result = await Result.tryPromise(async () => {
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

describe("AsyncResult", () => {
  describe("factory functions", () => {
    it("okAsync creates success AsyncResult", async () => {
      const result = await Result.okAsync(42);
      expect(result.isOk() && result.value).toBe(42);
    });

    it("errAsync creates failure AsyncResult", async () => {
      const result = await Result.errAsync("fail");
      expect(result.isErr() && result.error).toBe("fail");
    });

    it("tryPromise catches rejections", async () => {
      const result = await Result.tryPromise({
        try: () => Promise.reject(new Error("oops")),
        catch: (e: unknown) => (e as Error).message,
      });
      expect(result.isErr() && result.error).toBe("oops");
    });

    it("tryPromise wraps resolved values", async () => {
      const result = await Result.tryPromise({
        try: () => Promise.resolve(42),
        catch: () => "error",
      });
      expect(result.isOk() && result.value).toBe(42);
    });
  });

  describe("map", () => {
    it("transforms success value sync", async () => {
      const result = await Result.okAsync(2).map((x) => x * 3);
      expect(result.isOk() && result.value).toBe(6);
    });

    it("transforms success value async", async () => {
      const result = await Result.okAsync(2).map(async (x) => x * 3);
      expect(result.isOk() && result.value).toBe(6);
    });

    it("skips transform on error", async () => {
      const result = await Result.errAsync<string, number>("fail").map(
        (x) => x * 2,
      );
      expect(result.isErr() && result.error).toBe("fail");
    });
  });

  describe("mapErr", () => {
    it("transforms error value sync", async () => {
      const result = await Result.errAsync("fail").mapErr((e) => e.length);
      expect(result.isErr() && result.error).toBe(4);
    });

    it("transforms error value async", async () => {
      const result = await Result.errAsync("fail").mapErr(
        async (e) => e.length,
      );
      expect(result.isErr() && result.error).toBe(4);
    });

    it("skips transform on success", async () => {
      const result = await Result.okAsync<number, string>(42).mapErr(
        (e) => e.length,
      );
      expect(result.isOk() && result.value).toBe(42);
    });
  });

  describe("andThen", () => {
    it("chains with sync Result", async () => {
      const result = await Result.okAsync(2).andThen((x) => Result.ok(x * 3));
      expect(result.isOk() && result.value).toBe(6);
    });

    it("chains with AsyncResult", async () => {
      const result = await Result.okAsync(2).andThen((x) =>
        Result.okAsync(x * 3),
      );
      expect(result.isOk() && result.value).toBe(6);
    });

    it("propagates error", async () => {
      const result = await Result.okAsync(2).andThen(() => Result.err("fail"));
      expect(result.isErr() && result.error).toBe("fail");
    });

    it("short-circuits on error", async () => {
      let called = false;
      const result = await Result.errAsync<string, number>("fail").andThen(
        (x) => {
          called = true;
          return Result.ok(x * 2);
        },
      );
      expect(called).toBe(false);
      expect(result.isErr() && result.error).toBe("fail");
    });
  });

  describe("orElse", () => {
    it("recovers from error with sync Result", async () => {
      const result = await Result.errAsync<string, number>("fail").orElse(() =>
        Result.ok(42),
      );
      expect(result.isOk() && result.value).toBe(42);
    });

    it("recovers from error with AsyncResult", async () => {
      const result = await Result.errAsync<string, number>("fail").orElse(() =>
        Result.okAsync(42),
      );
      expect(result.isOk() && result.value).toBe(42);
    });

    it("skips recovery on success", async () => {
      let called = false;
      const result = await Result.okAsync<number, string>(42).orElse(() => {
        called = true;
        return Result.ok(0);
      });
      expect(called).toBe(false);
      expect(result.isOk() && result.value).toBe(42);
    });
  });

  describe("match", () => {
    it("calls ok handler on success", async () => {
      const result = await Result.okAsync(5).match({
        ok: (v) => v * 2,
        err: () => 0,
      });
      expect(result).toBe(10);
    });

    it("calls err handler on failure", async () => {
      const result = await Result.errAsync<string, number>("fail").match({
        ok: () => 0,
        err: (e) => e.length,
      });
      expect(result).toBe(4);
    });

    it("handles async handlers", async () => {
      const result = await Result.okAsync(5).match({
        ok: async (v) => v * 2,
        err: async () => 0,
      });
      expect(result).toBe(10);
    });
  });

  describe("unwrapOr", () => {
    it("returns value on success", async () => {
      const value = await Result.okAsync(42).unwrapOr(0);
      expect(value).toBe(42);
    });

    it("returns default on error", async () => {
      const value = await Result.errAsync<string, number>("fail").unwrapOr(0);
      expect(value).toBe(0);
    });
  });

  describe("static array methods", () => {
    it("all returns Ok with all values", async () => {
      const result = await AsyncResult.all([
        Result.okAsync(1),
        Result.okAsync(2),
        Result.okAsync(3),
      ]);
      expect(result.isOk() && result.value).toEqual([1, 2, 3]);
    });

    it("all returns first error", async () => {
      const result = await AsyncResult.all([
        Result.okAsync(1),
        Result.errAsync("first"),
        Result.errAsync("second"),
      ]);
      expect(result.isErr() && result.error).toBe("first");
    });

    it("partition returns Ok with all values", async () => {
      const result = await AsyncResult.partition([
        Result.okAsync(1),
        Result.okAsync(2),
      ]);
      expect(result.isOk() && result.value).toEqual([1, 2]);
    });

    it("partition collects all errors", async () => {
      const result = await AsyncResult.partition([
        Result.okAsync(1),
        Result.errAsync("a"),
        Result.errAsync("b"),
      ]);
      expect(result.isErr() && result.error).toEqual(["a", "b"]);
    });

    it("firstOk returns first success", async () => {
      const result = await AsyncResult.firstOk([
        Result.errAsync("a"),
        Result.okAsync(42),
        Result.errAsync("b"),
      ]);
      expect(result.isOk() && result.value).toBe(42);
    });

    it("firstOk returns last error when all fail", async () => {
      const result = await AsyncResult.firstOk([
        Result.errAsync("a"),
        Result.errAsync("b"),
        Result.errAsync("c"),
      ]);
      expect(result.isErr() && result.error).toBe("c");
    });
  });
});

describe("sync Result async bridging", () => {
  it("Ok.map with async fn returns AsyncResult", async () => {
    const result = await Result.ok(2).map(async (x) => x * 3);
    expect(result.isOk() && result.value).toBe(6);
  });

  it("Err.map with async fn returns AsyncResult", async () => {
    const result = await Result.err<string, number>("fail").map(
      async (x) => x * 2,
    );
    expect(result.isErr() && result.error).toBe("fail");
  });

  it("Ok.andThen with AsyncResult returns AsyncResult", async () => {
    const result = await Result.ok(2).andThen((x) => Result.okAsync(x * 3));
    expect(result.isOk() && result.value).toBe(6);
  });

  it("Ok.andThen with Promise<Result> returns AsyncResult", async () => {
    const result = await Result.ok(2).andThen(async (x) => Result.ok(x * 3));
    expect(result.isOk() && result.value).toBe(6);
  });

  it("Err.andThen with async fn returns AsyncResult", async () => {
    const result = await Result.err<string, number>("fail").andThen(async (x) =>
      Result.ok(x * 2),
    );
    expect(result.isErr() && result.error).toBe("fail");
  });

  it("Err.orElse with AsyncResult returns AsyncResult", async () => {
    const result = await Result.err<string, number>("fail").orElse(() =>
      Result.okAsync(42),
    );
    expect(result.isOk() && result.value).toBe(42);
  });

  it("Err.orElse with Promise<Result> returns AsyncResult", async () => {
    const result = await Result.err<string, number>("fail").orElse(async () =>
      Result.ok(42),
    );
    expect(result.isOk() && result.value).toBe(42);
  });
});

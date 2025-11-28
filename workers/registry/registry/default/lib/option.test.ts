import { describe, expect, it } from "vitest";
import { Option } from "./option";

describe("Some", () => {
  it("isSome returns true", () => {
    expect(Option.some(1).isSome()).toBe(true);
  });

  it("isNone returns false", () => {
    expect(Option.some(1).isNone()).toBe(false);
  });

  it("map transforms value", () => {
    const option = Option.some(2).map((x) => x * 3);
    expect(option.isSome() && option.value).toBe(6);
  });

  it("andThen chains operations", () => {
    const option = Option.some(2).andThen((x) => Option.some(x * 3));
    expect(option.isSome() && option.value).toBe(6);
  });

  it("andThen propagates None", () => {
    const option = Option.some(2).andThen(() => Option.none<number>());
    expect(option.isNone()).toBe(true);
  });

  it("orElse returns same instance", () => {
    const original = Option.some(1);
    const result = original.orElse(() => Option.some(2));
    expect(result).toBe(original);
  });

  it("filter returns Some when predicate passes", () => {
    const option = Option.some(5).filter((x) => x > 0);
    expect(option.isSome() && option.value).toBe(5);
  });

  it("filter returns None when predicate fails", () => {
    const option = Option.some(5).filter((x) => x > 10);
    expect(option.isNone()).toBe(true);
  });

  it("unwrap returns value", () => {
    expect(Option.some(42).unwrap()).toBe(42);
  });

  it("unwrapOr returns value", () => {
    expect(Option.some(42).unwrapOr(0)).toBe(42);
  });

  it("unwrapOrElse returns value", () => {
    expect(Option.some(42).unwrapOrElse(() => 0)).toBe(42);
  });

  it("match calls some handler", () => {
    const result = Option.some(5).match({
      some: (v) => v * 2,
      none: () => 0,
    });
    expect(result).toBe(10);
  });

  it("toNullable returns value", () => {
    expect(Option.some(42).toNullable()).toBe(42);
  });

  it("zip returns Some tuple when both are Some", () => {
    const option = Option.some(1).zip(Option.some("a"));
    expect(option.isSome() && option.value).toEqual([1, "a"]);
  });

  it("zip returns None when other is None", () => {
    const option = Option.some(1).zip(Option.none<string>());
    expect(option.isNone()).toBe(true);
  });
});

describe("None", () => {
  it("isSome returns false", () => {
    expect(Option.none().isSome()).toBe(false);
  });

  it("isNone returns true", () => {
    expect(Option.none().isNone()).toBe(true);
  });

  it("map returns same instance", () => {
    const original = Option.none<number>();
    const mapped = original.map((x) => x * 2);
    expect(mapped).toBe(original);
  });

  it("andThen returns same instance", () => {
    const original = Option.none<number>();
    const result = original.andThen((x) => Option.some(x * 2));
    expect(result).toBe(original);
  });

  it("orElse calls alternative function", () => {
    const option = Option.none<number>().orElse(() => Option.some(42));
    expect(option.isSome() && option.value).toBe(42);
  });

  it("filter returns same instance", () => {
    const original = Option.none<number>();
    const result = original.filter((x) => x > 0);
    expect(result).toBe(original);
  });

  it("unwrap throws", () => {
    expect(() => Option.none().unwrap()).toThrow("Called unwrap on None");
  });

  it("unwrapOr returns default", () => {
    expect(Option.none<number>().unwrapOr(0)).toBe(0);
  });

  it("unwrapOrElse calls function", () => {
    expect(Option.none<number>().unwrapOrElse(() => 42)).toBe(42);
  });

  it("match calls none handler", () => {
    const result = Option.none<number>().match({
      some: (v) => v * 2,
      none: () => 0,
    });
    expect(result).toBe(0);
  });

  it("toNullable returns null", () => {
    expect(Option.none().toNullable()).toBe(null);
  });

  it("zip returns same instance", () => {
    const original = Option.none<number>();
    const result = original.zip(Option.some("a"));
    expect(result).toBe(original);
  });

  it("none returns singleton", () => {
    const a = Option.none();
    const b = Option.none();
    expect(a).toBe(b);
  });
});

describe("fromNullable", () => {
  it("returns Some for non-null value", () => {
    const option = Option.fromNullable(42);
    expect(option.isSome() && option.value).toBe(42);
  });

  it("returns None for null", () => {
    const option = Option.fromNullable(null);
    expect(option.isNone()).toBe(true);
  });

  it("returns None for undefined", () => {
    const option = Option.fromNullable(undefined);
    expect(option.isNone()).toBe(true);
  });

  it("returns Some for falsy non-null values", () => {
    expect(Option.fromNullable(0).isSome()).toBe(true);
    expect(Option.fromNullable("").isSome()).toBe(true);
    expect(Option.fromNullable(false).isSome()).toBe(true);
  });
});

describe("fromPredicate", () => {
  it("returns Some when predicate passes", () => {
    const option = Option.fromPredicate(5, (x) => x > 0);
    expect(option.isSome() && option.value).toBe(5);
  });

  it("returns None when predicate fails", () => {
    const option = Option.fromPredicate(5, (x) => x > 10);
    expect(option.isNone()).toBe(true);
  });
});

describe("all", () => {
  it("returns Some with all values on success", () => {
    const option = Option.all([Option.some(1), Option.some(2), Option.some(3)]);
    expect(option.isSome() && option.value).toEqual([1, 2, 3]);
  });

  it("returns first None on failure", () => {
    const n = Option.none<number>();
    const option = Option.all([Option.some(1), n, Option.some(3)]);
    expect(option).toBe(n);
  });

  it("returns Some for empty array", () => {
    const option = Option.all([]);
    expect(option.isSome() && option.value).toEqual([]);
  });
});

describe("firstSome", () => {
  it("returns first Some", () => {
    const option = Option.firstSome([
      Option.none(),
      Option.none(),
      Option.some(1),
      Option.some(2),
    ]);
    expect(option.isSome() && option.value).toBe(1);
  });

  it("returns None when all are None", () => {
    const option = Option.firstSome([Option.none(), Option.none(), Option.none()]);
    expect(option.isNone()).toBe(true);
  });

  it("returns None for empty array", () => {
    const option = Option.firstSome([]);
    expect(option.isNone()).toBe(true);
  });
});

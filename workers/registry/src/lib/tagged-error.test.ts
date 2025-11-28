import { describe, expect, it } from "vitest";
import { TaggedError } from "./tagged-error";

describe("TaggedError", () => {
  it("creates error with literal _tag", () => {
    class TestError extends TaggedError("TestError")<{}> {}
    const err = new TestError();
    expect(err._tag).toBe("TestError");
  });

  it("sets name to tag", () => {
    class TestError extends TaggedError("TestError")<{}> {}
    const err = new TestError();
    expect(err.name).toBe("TestError");
  });

  it("is instanceof Error", () => {
    class TestError extends TaggedError("TestError")<{}> {}
    const err = new TestError();
    expect(err instanceof Error).toBe(true);
  });

  it("uses tag as default message", () => {
    class TestError extends TaggedError("TestError")<{}> {}
    const err = new TestError();
    expect(err.message).toBe("TestError");
  });

  it("uses provided message", () => {
    class TestError extends TaggedError("TestError")<{ message: string }> {}
    const err = new TestError({ message: "custom message" });
    expect(err.message).toBe("custom message");
  });

  it("assigns props as readonly fields", () => {
    class TestError extends TaggedError("TestError")<{
      foo: string;
      bar: number;
    }> {}
    const err = new TestError({ foo: "hello", bar: 42 });
    expect(err.foo).toBe("hello");
    expect(err.bar).toBe(42);
  });

  it("chains cause stack", () => {
    class InnerError extends TaggedError("InnerError")<{}> {}
    class OuterError extends TaggedError("OuterError")<{ cause: Error }> {}
    const inner = new InnerError();
    const outer = new OuterError({ cause: inner });
    expect(outer.stack).toContain("Caused by:");
    expect(outer.cause).toBe(inner);
  });

  it("toJSON returns serializable object", () => {
    class TestError extends TaggedError("TestError")<{
      foo: string;
      message: string;
    }> {}
    const err = new TestError({ foo: "bar", message: "test" });
    const json = err.toJSON();
    expect(json._tag).toBe("TestError");
    expect(json.message).toBe("test");
    expect(json.foo).toBe("bar");
    expect(typeof json.stack).toBe("string");
  });

  it("prettyPrint formats error", () => {
    class TestError extends TaggedError("TestError")<{
      foo: string;
      message: string;
    }> {}
    const err = new TestError({ foo: "bar", message: "something went wrong" });
    const pretty = err.prettyPrint();
    expect(pretty).toContain("TestError: something went wrong");
    expect(pretty).toContain('foo: "bar"');
  });

  it("allows optional props when empty", () => {
    class TestError extends TaggedError("TestError")<{}> {}
    const err1 = new TestError();
    const err2 = new TestError({});
    expect(err1._tag).toBe("TestError");
    expect(err2._tag).toBe("TestError");
  });

  it("requires props when defined", () => {
    class TestError extends TaggedError("TestError")<{ required: string }> {}
    const err = new TestError({ required: "value" });
    expect(err.required).toBe("value");
  });

  it("handles optional cause", () => {
    class TestError extends TaggedError("TestError")<{ cause?: Error }> {}
    const err1 = new TestError();
    const err2 = new TestError({ cause: new Error("inner") });
    expect(err1.cause).toBeUndefined();
    expect(err2.cause).toBeInstanceOf(Error);
  });
});

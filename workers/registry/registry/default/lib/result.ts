/**
 * A discriminated union representing either success (Ok) or failure (Err).
 *
 * @template A - The success value type
 * @template E - The error value type
 */
export type Result<A, E> = Ok<A, E> | Err<E, A>;

// Helper types for inference
type InferOk<R> = R extends Result<infer T, unknown> ? T : never;
type InferErr<R> = R extends Result<unknown, infer E> ? E : never;
type InferAsyncOk<R> = R extends AsyncResult<infer T, unknown> ? T : never;
type InferAsyncErr<R> = R extends AsyncResult<unknown, infer E> ? E : never;

/**
 * Success variant of Result.
 *
 * @template A - The success value type
 * @template E - The error type (phantom, unused at runtime)
 */
export class Ok<A, E = never> {
  readonly _tag = "Ok" as const;
  constructor(readonly value: A) { }

  /**
   * Type guard for Ok variant.
   *
   * @returns true
   */
  isOk(): this is Ok<A, E> {
    return true;
  }

  /**
   * Type guard for Err variant.
   *
   * @returns false
   */
  isErr(): this is Err<E, A> {
    return false;
  }

  /**
   * Transform the success value.
   *
   * @param fn - Transform function (sync or async)
   * @returns Result or AsyncResult with transformed value
   */
  map<U>(fn: (value: A) => Promise<U>): AsyncResult<U, E>;
  map<U>(fn: (value: A) => U): Result<U, E>;
  map<U>(fn: (value: A) => U | Promise<U>): Result<U, E> | AsyncResult<U, E> {
    const result = fn(this.value);
    if (result instanceof Promise) {
      return new AsyncResult(result.then((v) => new Ok<U, E>(v)));
    }
    return new Ok(result);
  }

  /**
   * Transform the error value. No-op for Ok.
   *
   * @param _fn - Transform function (not called)
   * @returns This Ok with new error type
   */
  mapErr<F>(_fn: (error: E) => F): Result<A, F> {
    // SAFETY: E is phantom in Ok;
    return this as unknown as Ok<A, F>;
  }

  /**
   * Chain a Result-returning function on success.
   *
   * @param fn - Function returning Result, AsyncResult, or Promise<Result>
   * @returns Result or AsyncResult from fn
   */
  andThen<R extends Result<unknown, unknown>>(
    fn: (value: A) => R,
  ): Result<InferOk<R>, E | InferErr<R>>;
  andThen<R extends AsyncResult<unknown, unknown>>(
    fn: (value: A) => R,
  ): AsyncResult<InferAsyncOk<R>, E | InferAsyncErr<R>>;
  andThen<U, F>(fn: (value: A) => Promise<Result<U, F>>): AsyncResult<U, E | F>;
  andThen(
    fn: (
      value: A,
    ) =>
      | Result<unknown, unknown>
      | AsyncResult<unknown, unknown>
      | Promise<Result<unknown, unknown>>,
  ): Result<unknown, unknown> | AsyncResult<unknown, unknown> {
    const result = fn(this.value);
    if (result instanceof AsyncResult) {
      return result;
    }
    if (result instanceof Promise) {
      return new AsyncResult(result);
    }
    return result;
  }

  /**
   * Recover from error with a Result-returning function. No-op for Ok.
   *
   * @param _fn - Recovery function (not called)
   * @returns This Ok with new error type
   */
  orElse<R extends Result<A, unknown>>(
    _fn: (error: E) => R,
  ): Result<A, InferErr<R>>;
  orElse<R extends AsyncResult<A, unknown>>(
    _fn: (error: E) => R,
  ): AsyncResult<A, InferAsyncErr<R>>;
  orElse<F>(_fn: (error: E) => Promise<Result<A, F>>): AsyncResult<A, F>;
  orElse(
    _fn: (
      error: E,
    ) =>
      | Result<A, unknown>
      | AsyncResult<A, unknown>
      | Promise<Result<A, unknown>>,
  ): Result<A, unknown> | AsyncResult<A, unknown> {
    // SAFETY: E is phantom in Ok
    return this as unknown as Ok<A, never>;
  }

  /**
   * Extract success value.
   *
   * @returns The success value
   */
  unwrap(): A {
    return this.value;
  }

  /**
   * Extract success value or return default.
   *
   * @param _defaultValue - Default value (not used)
   * @returns The success value
   */
  unwrapOr(_defaultValue: A): A {
    return this.value;
  }

  /**
   * Extract error value.
   *
   * @throws Error always (Ok has no error)
   */
  unwrapErr(): E {
    throw new Error("Called unwrapErr on Ok");
  }

  /**
   * Pattern match on Result.
   *
   * @param handlers - Object with ok and err handlers
   * @returns Result of ok handler
   */
  match<U>(handlers: { ok: (value: A) => U; err: (error: E) => U; }): U {
    return handlers.ok(this.value);
  }
}

// SAFETY: Err only stores `error: E`. The `T` type parameter is phantom (unused at runtime).
// Casting Err<T, E> to Err<U, E> is safe because T has no runtime representation.
/**
 * Failure variant of Result.
 *
 * @template A - The success type (phantom, unused at runtime)
 * @template E - The error value type
 */
export class Err<E, A = never> {
  readonly _tag = "Err" as const;
  constructor(readonly error: E) { }

  /**
   * Type guard for Ok variant.
   *
   * @returns false
   */
  isOk(): this is Ok<A, E> {
    return false;
  }

  /**
   * Type guard for Err variant.
   *
   * @returns true
   */
  isErr(): this is Err<E, A> {
    return true;
  }

  /**
   * Transform the success value. No-op for Err.
   *
   * @param _fn - Transform function (not called)
   * @returns This Err with new success type, wrapped in AsyncResult if async fn detected
   */
  map<U>(_fn: (value: A) => Promise<U>): AsyncResult<U, E>;
  map<U>(_fn: (value: A) => U): Result<U, E>;
  map<U>(fn: (value: A) => U | Promise<U>): Result<U, E> | AsyncResult<U, E> {
    // SAFETY: A is phantom in Err
    // Detect async function to return correct type
    if (fn.constructor.name === "AsyncFunction") {
      return new AsyncResult(Promise.resolve(this as unknown as Err<E>));
    }
    return this as unknown as Err<E>;
  }

  /**
   * Transform the error value.
   *
   * @param fn - Transform function
   * @returns New Err with transformed error
   */
  mapErr<F>(fn: (error: E) => F): Result<A, F> {
    return new Err(fn(this.error));
  }

  /**
   * Chain a Result-returning function on success. No-op for Err.
   *
   * @param _fn - Function returning Result, AsyncResult, or Promise<Result> (not called)
   * @returns This Err, wrapped in AsyncResult if async fn detected
   */
  andThen<R extends Result<unknown, unknown>>(
    _fn: (value: A) => R,
  ): Result<InferOk<R>, E | InferErr<R>>;
  andThen<R extends AsyncResult<unknown, unknown>>(
    _fn: (value: A) => R,
  ): AsyncResult<InferAsyncOk<R>, E | InferAsyncErr<R>>;
  andThen<U, F>(
    _fn: (value: A) => Promise<Result<U, F>>,
  ): AsyncResult<U, E | F>;
  andThen(
    fn: (
      value: A,
    ) =>
      | Result<unknown, unknown>
      | AsyncResult<unknown, unknown>
      | Promise<Result<unknown, unknown>>,
  ): Result<unknown, unknown> | AsyncResult<unknown, unknown> {
    // SAFETY: A is phantom in Err
    // Detect async function to return correct type
    if (fn.constructor.name === "AsyncFunction") {
      return new AsyncResult(Promise.resolve(this as unknown as Err<E>));
    }
    return this as unknown as Err<E>;
  }

  /**
   * Recover from error with a Result-returning function.
   *
   * @param fn - Recovery function returning Result, AsyncResult, or Promise<Result>
   * @returns Result or AsyncResult from fn
   */
  orElse<R extends Result<A, unknown>>(
    fn: (error: E) => R,
  ): Result<A, InferErr<R>>;
  orElse<R extends AsyncResult<A, unknown>>(
    fn: (error: E) => R,
  ): AsyncResult<A, InferAsyncErr<R>>;
  orElse<F>(fn: (error: E) => Promise<Result<A, F>>): AsyncResult<A, F>;
  orElse(
    fn: (
      error: E,
    ) =>
      | Result<A, unknown>
      | AsyncResult<A, unknown>
      | Promise<Result<A, unknown>>,
  ): Result<A, unknown> | AsyncResult<A, unknown> {
    const result = fn(this.error);
    if (result instanceof AsyncResult) {
      return result;
    }
    if (result instanceof Promise) {
      return new AsyncResult(result);
    }
    return result;
  }

  /**
   * Extract success value.
   *
   * @throws Error always (Err has no success value)
   */
  unwrap(): A {
    throw new Error("Called unwrap on Err");
  }

  /**
   * Extract success value or return default.
   *
   * @param defaultValue - Default value to return
   * @returns The default value
   */
  unwrapOr(defaultValue: A): A {
    return defaultValue;
  }

  /**
   * Extract error value.
   *
   * @returns The error value
   */
  unwrapErr(): E {
    return this.error;
  }

  /**
   * Pattern match on Result.
   *
   * @param handlers - Object with ok and err handlers
   * @returns Result of err handler
   */
  match<U>(handlers: { ok: (value: A) => U; err: (error: E) => U; }): U {
    return handlers.err(this.error);
  }
}

/**
 * Async wrapper around Promise<Result<A, E>> with chainable operations.
 *
 * @template A - The success value type
 * @template E - The error value type
 */
export class AsyncResult<A, E> implements PromiseLike<Result<A, E>> {
  constructor(private readonly promise: Promise<Result<A, E>>) { }

  /**
   * PromiseLike implementation for await support.
   */

  // biome-ignore lint/suspicious/noThenProperty: Needed for AsyncResult API/promise flattening
  then<TResult1 = Result<A, E>, TResult2 = never>(
    onfulfilled?:
      | ((value: Result<A, E>) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }

  /**
   * Transform the success value.
   *
   * @param fn - Transform function (sync or async)
   * @returns New AsyncResult with transformed value
   */
  map<B>(fn: (value: A) => B | Promise<B>): AsyncResult<B, E> {
    return new AsyncResult(
      this.promise.then(async (result) => {
        if (result.isOk()) {
          const mapped = fn(result.value);
          const resolved = mapped instanceof Promise ? await mapped : mapped;
          return new Ok<B, E>(resolved);
        }
        // SAFETY: A is phantom in Err
        return result as unknown as Err<E>;
      }),
    );
  }

  /**
   * Transform the error value.
   *
   * @param fn - Transform function (sync or async)
   * @returns New AsyncResult with transformed error
   */
  mapErr<F>(fn: (error: E) => F | Promise<F>): AsyncResult<A, F> {
    return new AsyncResult(
      this.promise.then(async (result) => {
        if (result.isErr()) {
          const mapped = fn(result.error);
          const resolved = mapped instanceof Promise ? await mapped : mapped;
          return new Err<F>(resolved);
        }
        // SAFETY: E is phantom in Ok
        return result as unknown as Ok<A, F>;
      }),
    );
  }

  /**
   * Chain a Result-returning function on success.
   *
   * @param fn - Function returning Result or AsyncResult
   * @returns AsyncResult from fn
   */
  andThen<R extends Result<unknown, unknown>>(
    fn: (value: A) => R,
  ): AsyncResult<InferOk<R>, E | InferErr<R>>;
  andThen<R extends AsyncResult<unknown, unknown>>(
    fn: (value: A) => R,
  ): AsyncResult<InferAsyncOk<R>, E | InferAsyncErr<R>>;
  andThen(
    fn: (value: A) => Result<unknown, unknown> | AsyncResult<unknown, unknown>,
  ): AsyncResult<unknown, unknown> {
    return new AsyncResult(
      this.promise.then(async (result) => {
        if (result.isOk()) {
          const next = fn(result.value);
          if (next instanceof AsyncResult) {
            return next.promise;
          }
          return next;
        }
        return result;
      }),
    );
  }

  /**
   * Recover from error with a Result-returning function.
   *
   * @param fn - Recovery function returning Result or AsyncResult
   * @returns AsyncResult from fn
   */
  orElse<R extends Result<A, unknown>>(
    fn: (error: E) => R,
  ): AsyncResult<A, InferErr<R>>;
  orElse<R extends AsyncResult<A, unknown>>(
    fn: (error: E) => R,
  ): AsyncResult<A, InferAsyncErr<R>>;
  orElse(
    fn: (error: E) => Result<A, unknown> | AsyncResult<A, unknown>,
  ): AsyncResult<A, unknown> {
    return new AsyncResult(
      this.promise.then(async (result) => {
        if (result.isErr()) {
          const next = fn(result.error);
          if (next instanceof AsyncResult) {
            return next.promise;
          }
          return next;
        }
        return result;
      }),
    );
  }

  /**
   * Pattern match on Result.
   *
   * @param handlers - Object with ok and err handlers (sync or async)
   * @returns Promise of handler result
   */
  async match<B>(handlers: {
    ok: (value: A) => B | Promise<B>;
    err: (error: E) => B | Promise<B>;
  }): Promise<B> {
    const result = await this.promise;
    if (result.isOk()) {
      return handlers.ok(result.value);
    }
    return handlers.err(result.error);
  }

  /**
   * Extract success value or return default.
   *
   * @param defaultValue - Default value to return on error
   * @returns Promise of success value or default
   */
  async unwrapOr(defaultValue: A): Promise<A> {
    const result = await this.promise;
    return result.unwrapOr(defaultValue);
  }

  /**
   * Convert array of AsyncResults to AsyncResult of array. Fails on first error.
   *
   * @param results - Array of AsyncResults
   * @returns AsyncResult with array of values or first error
   */
  static all<T, F>(results: AsyncResult<T, F>[]): AsyncResult<T[], F> {
    return new AsyncResult(
      Promise.all(results.map((r) => r.promise)).then((settled) =>
        Result.all(settled),
      ),
    );
  }

  /**
   * Convert array of AsyncResults to AsyncResult of array. Collects all errors.
   *
   * @param results - Array of AsyncResults
   * @returns AsyncResult with array of values or array of all errors
   */
  static partition<T, F>(results: AsyncResult<T, F>[]): AsyncResult<T[], F[]> {
    return new AsyncResult(
      Promise.all(results.map((r) => r.promise)).then((settled) =>
        Result.partition(settled),
      ),
    );
  }

  /**
   * Return first Ok or last Err from array of AsyncResults.
   *
   * @param results - Non-empty array of AsyncResults
   * @returns AsyncResult with first Ok or last Err
   */
  static firstOk<T, F>(results: AsyncResult<T, F>[]): AsyncResult<T, F> {
    return new AsyncResult(
      Promise.all(results.map((r) => r.promise)).then((settled) =>
        Result.firstOk(settled),
      ),
    );
  }

  /**
   * Wrap a promise-returning function, catching rejections.
   *
   * @param args - Object with try/catch handlers, or just a try function
   * @returns AsyncResult with resolved value or transformed error
   *
   * @example
   * ```typescript
   * // With custom error handler
   * const result = Result.tryPromise({
   *   try: () => fetch(url).then(r => r.json()),
   *   catch: (e) => new FetchError({ cause: e })
   * });
   *
   * // Without handler (wraps in Error)
   * const result = Result.tryPromise(() => fetch(url));
   * ```
   */
  static tryPromise<T, E>(handlers: {
    try: () => Promise<T>;
    catch: (cause: unknown) => E;
  }): AsyncResult<T, E>;
  static tryPromise<T, E = Error>(fn: () => Promise<T>): AsyncResult<T, E>;
  static tryPromise<T, E = Error>(
    args:
      | { try: () => Promise<T>; catch: (cause: unknown) => E; }
      | (() => Promise<T>),
  ): AsyncResult<T, E> {
    if (typeof args === "object" && "try" in args) {
      return new AsyncResult(
        args
          .try()
          .then((value) => new Ok<T, E>(value))
          .catch((cause) => new Err<E>(args.catch(cause))),
      );
    }
    return new AsyncResult(
      args()
        .then((value) => new Ok<T, E>(value))
        .catch(
          (cause) =>
            new Err<E>(new Error("Unexpected exception", { cause }) as E),
        ),
    );
  }
}

/**
 * Create a success Result.
 *
 * @param value - The success value
 * @returns Ok containing value
 *
 * @example
 * ```typescript
 * const result = Result.ok(42);
 * ```
 */
function ok<T, E = never>(value: T): Result<T, E> {
  return new Ok(value);
}

/**
 * Create a failure Result.
 *
 * @param error - The error value
 * @returns Err containing error
 *
 * @example
 * ```typescript
 * const result = Result.err("not found");
 * ```
 */
function err<E, T = never>(error: E): Result<T, E> {
  return new Err(error);
}

/**
 * Wrap a throwing function in a Result.
 *
 * @param args - Object with try/catch handlers, or just a try function
 * @returns Ok with return value or Err with transformed error
 *
 * @example
 * ```typescript
 * // With custom error handler
 * const result = Result.try({
 *   try: () => JSON.parse(input),
 *   catch: (e) => new ParseError({ cause: e })
 * });
 *
 * // Without handler (wraps in Error)
 * const result = Result.try(() => JSON.parse(input));
 * ```
 */
function tryCatch<T, E = Error>(handlers: {
  try: () => T;
  catch: (cause: unknown) => E;
}): Result<T, E>;
function tryCatch<T, E = Error>(fn: () => T): Result<T, E>;
function tryCatch<T, E = Error>(
  args: { try: () => T; catch: (cause: unknown) => E; } | (() => T),
): Result<T, E> {
  if (typeof args === "object" && "try" in args) {
    try {
      return Result.ok(args.try());
    } catch (cause) {
      return Result.err(args.catch(cause));
    }
  }

  try {
    return Result.ok(args());
  } catch (cause) {
    // SAFETY: The caller did not pass a catch handler so E defaults to type of Error
    return Result.err(new Error("Unexpected exception", { cause })) as Result<
      T,
      E
    >;
  }
}
/**
 * Convert array of Results to Result of array. Fails on first error.
 *
 * @param results - Array of Results
 * @returns Ok with array of values or first Err encountered
 *
 * @example
 * ```typescript
 * const results = [Result.ok(1), Result.ok(2), Result.ok(3)];
 * const combined = Result.all(results); // Ok([1, 2, 3])
 * ```
 */
function all<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];
  for (const result of results) {
    if (result.isOk()) {
      values.push(result.value);
    } else {
      // SAFETY: A is phantom in Err, casting to adjust phantom type
      return result as unknown as Err<E, T[]>;
    }
  }
  return ok(values);
}

/**
 * Convert array of Results to Result of array. Collects all errors.
 *
 * @param results - Array of Results
 * @returns Ok with array of values or Err with array of all errors
 *
 * @example
 * ```typescript
 * const results = [Result.ok(1), Result.err("a"), Result.err("b")];
 * const combined = Result.partition(results); // Err(["a", "b"])
 * ```
 */
function partition<T, E>(results: Result<T, E>[]): Result<T[], E[]> {
  const values: T[] = [];
  const errors: E[] = [];
  for (const result of results) {
    if (result.isOk()) {
      values.push(result.value);
    } else {
      errors.push(result.error);
    }
  }
  return errors.length > 0 ? err(errors) : ok(values);
}

/**
 * Return first Ok or last Err from array of Results.
 *
 * @param results - Non-empty array of Results
 * @returns First Ok found or last Err if all fail
 * @throws Error if array is empty
 *
 * @example
 * ```typescript
 * const results = [Result.err("a"), Result.ok(42), Result.err("b")];
 * const first = Result.firstOk(results); // Ok(42)
 * ```
 */
function firstOk<T, E>(results: Result<T, E>[]): Result<T, E> {
  let lastErr: Result<T, E> | undefined;
  for (const result of results) {
    if (result.isOk()) {
      return result;
    }
    lastErr = result;
  }
  if (lastErr) {
    return lastErr;
  }
  throw new Error("firstOk called with empty array");
}

/**
 * Create a success AsyncResult.
 *
 * @param value - The success value
 * @returns AsyncResult containing Ok with value
 *
 * @example
 * ```typescript
 * const result = Result.okAsync(42);
 * ```
 */
function okAsync<T, E = never>(value: T): AsyncResult<T, E> {
  return new AsyncResult(Promise.resolve(new Ok<T, E>(value)));
}

/**
 * Create a failure AsyncResult.
 *
 * @param error - The error value
 * @returns AsyncResult containing Err with error
 *
 * @example
 * ```typescript
 * const result = Result.errAsync("not found");
 * ```
 */
function errAsync<E, T = never>(error: E): AsyncResult<T, E> {
  return new AsyncResult(Promise.resolve(new Err<E>(error)));
}

export const Result = {
  ok,
  err,
  okAsync,
  errAsync,
  try: tryCatch,
  tryPromise: AsyncResult.tryPromise,
  all,
  partition,
  firstOk,
} as const;

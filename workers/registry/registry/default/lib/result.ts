/**
 * A discriminated union representing either success (Ok) or failure (Err).
 *
 * @template A - The success value type
 * @template E - The error value type
 */
export type Result<A, E> = Ok<A, E> | Err<E>;

/**
 * Success variant of Result.
 *
 * @template A - The success value type
 * @template E - The error type (phantom, unused at runtime)
 */
export class Ok<A, E = never> {
  readonly _tag = "Ok" as const;
  constructor(readonly value: A) {}

  /**
   * Type guard for Ok variant.
   *
   * @returns true
   */
  isOk(): this is Ok<A> {
    return true;
  }

  /**
   * Type guard for Err variant.
   *
   * @returns false
   */
  isErr(): this is Err<E> {
    return false;
  }

  /**
   * Transform the success value.
   *
   * @param fn - Transform function
   * @returns New Result with transformed value
   */
  map<U>(fn: (value: A) => U): Result<U, E> {
    return new Ok(fn(this.value));
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
   * @param fn - Function returning a new Result
   * @returns Result from fn
   */
  andThen<U, F>(fn: (value: A) => Result<U, F>): Result<U, E | F> {
    return fn(this.value);
  }

  /**
   * Recover from error with a Result-returning function. No-op for Ok.
   *
   * @param _fn - Recovery function (not called)
   * @returns This Ok with new error type
   */
  orElse<F>(_fn: (error: E) => Result<A, F>): Result<A, F> {
    // SAFETY: E is phantom in Ok;
    return this as unknown as Ok<A, F>;
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
  match<U>(handlers: { ok: (value: A) => U; err: (error: E) => U }): U {
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
  constructor(readonly error: E) {}

  /**
   * Type guard for Ok variant.
   *
   * @returns false
   */
  isOk(): this is Ok<A> {
    return false;
  }

  /**
   * Type guard for Err variant.
   *
   * @returns true
   */
  isErr(): this is Err<E> {
    return true;
  }

  /**
   * Transform the success value. No-op for Err.
   *
   * @param _fn - Transform function (not called)
   * @returns This Err with new success type
   */
  map<U>(_fn: (value: A) => U): Result<U, E> {
    // SAFETY: A is phantom in Err;
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
   * @param _fn - Function returning a new Result (not called)
   * @returns This Err with union error type
   */
  andThen<U, F>(_fn: (value: A) => Result<U, F>): Result<U, E | F> {
    // SAFETY: A is phantom in Err;
    return this as unknown as Err<E>;
  }

  /**
   * Recover from error with a Result-returning function.
   *
   * @param fn - Recovery function
   * @returns Result from fn
   */
  orElse<F>(fn: (error: E) => Result<A, F>): Result<A, F> {
    return fn(this.error);
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
  match<U>(handlers: { ok: (value: A) => U; err: (error: E) => U }): U {
    return handlers.err(this.error);
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
 * const result = Result.tryCatch({
 *   try: () => JSON.parse(input),
 *   catch: (e) => new ParseError({ cause: e })
 * });
 *
 * // Without handler (wraps in Error)
 * const result = Result.tryCatch(() => JSON.parse(input));
 * ```
 */
function tryCatch<T, E = Error>(handlers: {
  try: () => T;
  catch: (cause: unknown) => E;
}): Result<T, E>;
function tryCatch<T, E = Error>(fn: () => T): Result<T, E>;
function tryCatch<T, E = Error>(
  args: { try: () => T; catch: (cause: unknown) => E } | (() => T),
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
 * Wrap an async throwing function in a Result.
 *
 * @param args - Object with try/catch handlers, or just a try function
 * @returns Promise of Ok with return value or Err with transformed error
 *
 * @example
 * ```typescript
 * // With custom error handler
 * const result = await Result.tryCatchAsync({
 *   try: () => fetch(url).then(r => r.json()),
 *   catch: (e) => new FetchError({ cause: e })
 * });
 *
 * // Without handler (wraps in Error)
 * const result = await Result.tryCatchAsync(() => fetch(url));
 * ```
 */
function tryCatchAsync<T, E>(handlers: {
  try: () => Promise<T>;
  catch: (cause: unknown) => E;
}): Promise<Result<T, E>>;
function tryCatchAsync<T, E = Error>(
  fn: () => Promise<T>,
): Promise<Result<T, E>>;
async function tryCatchAsync<T, E = Error>(
  args:
    | { try: () => Promise<T>; catch: (cause: unknown) => E }
    | (() => Promise<T>),
): Promise<Result<T, E>> {
  if (typeof args === "object" && "try" in args) {
    try {
      return Result.ok(await args.try());
    } catch (cause) {
      return Result.err(args.catch(cause));
    }
  }

  try {
    return Result.ok(await args());
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
    if (result.isErr()) {
      return result;
    }
    values.push(result.value);
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
    if (result.isErr()) {
      errors.push(result.error);
    } else {
      values.push(result.value);
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

export const Result = {
  ok,
  err,
  tryCatch,
  tryCatchAsync,
  all,
  partition,
  firstOk,
} as const;

/**
 * Option type for representing optional values without null/undefined.
 *
 * @example
 * ```typescript
 * const option = Option.some(42)
 *   .map(x => x * 2)
 *   .filter(x => x > 50);
 *
 * if (option.isSome()) {
 *   console.log(option.value);
 * } else {
 *   console.log("no value");
 * }
 * ```
 */

export type Option<T> = Some<T> | None<T>;

/**
 * Some variant of Option containing a value.
 *
 * @template T - The value type
 */
export class Some<T> {
  readonly _tag = "Some" as const;
  constructor(readonly value: T) {}

  /**
   * Type guard for Some variant.
   *
   * @returns true
   */
  isSome(): this is Some<T> {
    return true;
  }

  /**
   * Type guard for None variant.
   *
   * @returns false
   */
  isNone(): this is None<T> {
    return false;
  }

  /**
   * Transform the value.
   *
   * @param fn - Transform function
   * @returns New Option with transformed value
   */
  map<U>(fn: (value: T) => U): Option<U> {
    return new Some(fn(this.value));
  }

  /**
   * Chain an Option-returning function.
   *
   * @param fn - Function returning a new Option
   * @returns Option from fn
   */
  andThen<U>(fn: (value: T) => Option<U>): Option<U> {
    return fn(this.value);
  }

  /**
   * Return alternative if None. No-op for Some.
   *
   * @param _fn - Function returning alternative (not called)
   * @returns This Some
   */
  orElse(_fn: () => Option<T>): Option<T> {
    return this;
  }

  /**
   * Filter the value by predicate.
   *
   * @param predicate - Predicate function
   * @returns Some if predicate passes, None otherwise
   */
  filter(predicate: (value: T) => boolean): Option<T> {
    return predicate(this.value) ? this : none();
  }

  /**
   * Extract value.
   *
   * @returns The value
   */
  unwrap(): T {
    return this.value;
  }

  /**
   * Extract value or return default.
   *
   * @param _defaultValue - Default value (not used)
   * @returns The value
   */
  unwrapOr(_defaultValue: T): T {
    return this.value;
  }

  /**
   * Extract value or compute default.
   *
   * @param _fn - Function to compute default (not called)
   * @returns The value
   */
  unwrapOrElse(_fn: () => T): T {
    return this.value;
  }

  /**
   * Pattern match on Option.
   *
   * @param handlers - Object with some and none handlers
   * @returns Result of some handler
   */
  match<U>(handlers: { some: (value: T) => U; none: () => U }): U {
    return handlers.some(this.value);
  }

  /**
   * Convert to nullable.
   *
   * @returns The value
   */
  toNullable(): T | null {
    return this.value;
  }

  /**
   * Zip with another Option.
   *
   * @param other - Another Option
   * @returns Some with tuple if both are Some, None otherwise
   */
  zip<U>(other: Option<U>): Option<[T, U]> {
    return other.isSome() ? some([this.value, other.value]) : none();
  }
}

// SAFETY: None has no runtime value. The `T` type parameter is phantom (unused at runtime).
// Casting None<T> to None<U> is safe because T has no runtime representation.
/**
 * None variant of Option representing absence of value.
 *
 * @template T - The value type (phantom, unused at runtime)
 */
export class None<T> {
  readonly _tag = "None" as const;

  /**
   * Type guard for Some variant.
   *
   * @returns false
   */
  isSome(): this is Some<T> {
    return false;
  }

  /**
   * Type guard for None variant.
   *
   * @returns true
   */
  isNone(): this is None<T> {
    return true;
  }

  /**
   * Transform the value. No-op for None.
   *
   * @param _fn - Transform function (not called)
   * @returns This None with new type
   */
  map<U>(_fn: (value: T) => U): Option<U> {
    // SAFETY: T is phantom in None; see class comment
    return this as unknown as None<U>;
  }

  /**
   * Chain an Option-returning function. No-op for None.
   *
   * @param _fn - Function returning a new Option (not called)
   * @returns This None with new type
   */
  andThen<U>(_fn: (value: T) => Option<U>): Option<U> {
    // SAFETY: T is phantom in None; see class comment
    return this as unknown as None<U>;
  }

  /**
   * Return alternative if None.
   *
   * @param fn - Function returning alternative
   * @returns Option from fn
   */
  orElse(fn: () => Option<T>): Option<T> {
    return fn();
  }

  /**
   * Filter the value by predicate. No-op for None.
   *
   * @param _predicate - Predicate function (not called)
   * @returns This None
   */
  filter(_predicate: (value: T) => boolean): Option<T> {
    return this;
  }

  /**
   * Extract value.
   *
   * @throws Error always (None has no value)
   */
  unwrap(): T {
    throw new Error("Called unwrap on None");
  }

  /**
   * Extract value or return default.
   *
   * @param defaultValue - Default value to return
   * @returns The default value
   */
  unwrapOr(defaultValue: T): T {
    return defaultValue;
  }

  /**
   * Extract value or compute default.
   *
   * @param fn - Function to compute default
   * @returns The computed default
   */
  unwrapOrElse(fn: () => T): T {
    return fn();
  }

  /**
   * Pattern match on Option.
   *
   * @param handlers - Object with some and none handlers
   * @returns Result of none handler
   */
  match<U>(handlers: { some: (value: T) => U; none: () => U }): U {
    return handlers.none();
  }

  /**
   * Convert to nullable.
   *
   * @returns null
   */
  toNullable(): T | null {
    return null;
  }

  /**
   * Zip with another Option. No-op for None.
   *
   * @param _other - Another Option (not used)
   * @returns This None with tuple type
   */
  zip<U>(_other: Option<U>): Option<[T, U]> {
    // SAFETY: T is phantom in None; see class comment
    return this as unknown as None<[T, U]>;
  }
}

// Singleton None instance for reuse
const NONE = new None<never>();

/**
 * Create a Some Option.
 *
 * @param value - The value
 * @returns Some containing value
 *
 * @example
 * ```typescript
 * const option = Option.some(42);
 * ```
 */
function some<T>(value: T): Option<T> {
  return new Some(value);
}

/**
 * Create a None Option.
 *
 * @returns None
 *
 * @example
 * ```typescript
 * const option = Option.none<number>();
 * ```
 */
function none<T = never>(): Option<T> {
  return NONE as Option<T>;
}

/**
 * Create Option from nullable value.
 *
 * @param value - Value that may be null or undefined
 * @returns Some if value exists, None otherwise
 *
 * @example
 * ```typescript
 * const option = Option.fromNullable(maybeValue);
 * ```
 */
function fromNullable<T>(value: T | null | undefined): Option<T> {
  return value == null ? none() : some(value);
}

/**
 * Create Option from predicate.
 *
 * @param value - Value to test
 * @param predicate - Predicate function
 * @returns Some if predicate passes, None otherwise
 *
 * @example
 * ```typescript
 * const option = Option.fromPredicate(5, x => x > 0);
 * ```
 */
function fromPredicate<T>(value: T, predicate: (value: T) => boolean): Option<T> {
  return predicate(value) ? some(value) : none();
}

/**
 * Convert array of Options to Option of array. Fails on first None.
 *
 * @param options - Array of Options
 * @returns Some with array of values or None if any is None
 *
 * @example
 * ```typescript
 * const options = [Option.some(1), Option.some(2), Option.some(3)];
 * const combined = Option.all(options); // Some([1, 2, 3])
 * ```
 */
function all<T>(options: Option<T>[]): Option<T[]> {
  const values: T[] = [];
  for (const option of options) {
    if (option.isNone()) {
      // SAFETY: T is phantom in None; None<T> and None<T[]> are identical at runtime
      return option as unknown as None<T[]>;
    }
    values.push(option.value);
  }
  return some(values);
}

/**
 * Return first Some or None from array of Options.
 *
 * @param options - Array of Options
 * @returns First Some found or None if all are None
 *
 * @example
 * ```typescript
 * const options = [Option.none(), Option.some(42), Option.none()];
 * const first = Option.firstSome(options); // Some(42)
 * ```
 */
function firstSome<T>(options: Option<T>[]): Option<T> {
  for (const option of options) {
    if (option.isSome()) {
      return option;
    }
  }
  return none();
}

export const Option = {
  some,
  none,
  fromNullable,
  fromPredicate,
  all,
  firstSome,
} as const;

/**
 * Branded type representing a value that should not be logged or serialized.
 * Prevents accidental exposure of sensitive data in logs, JSON, or console output.
 * @template A - The type of the underlying secret value
 */
export interface Redacted<A> extends Object {}

const registry = new WeakMap<Redacted<any>, any>();

const proto = {
	toString() {
		return '<redacted>';
	},
	toJSON() {
		return '<redacted>';
	},
	[Symbol.for('nodejs.util.inspect.custom')]() {
		return '<redacted>';
	},
};

/**
 * Utilities for creating and accessing redacted values.
 * Redacted values hide sensitive data from serialization/logging while
 * allowing controlled access to the underlying value.
 *
 * @example
 * ```ts
 * const secret = Redacted.make('api-key-123');
 * console.log(secret);        // '<redacted>'
 * JSON.stringify(secret);     // '"<redacted>"'
 * Redacted.value(secret);     // 'api-key-123'
 * ```
 */
export const Redacted = {
	/**
	 * Wraps a value in a redacted container.
	 * @template A - The type of value to redact
	 * @param value - The sensitive value to protect
	 * @returns A redacted wrapper that hides the value from serialization
	 */
	make<A>(value: A): Redacted<A> {
		const redacted = Object.create(proto);
		registry.set(redacted, value);
		return redacted;
	},
	/**
	 * Extracts the underlying value from a redacted container.
	 * @template A - The type of the redacted value
	 * @param self - The redacted container
	 * @returns The original unwrapped value
	 * @throws {Error} If the redacted value is not in the registry
	 */
	value<A>(self: Redacted<A>): A {
		const value = registry.get(self);

		if (value === undefined) {
			throw new Error('Redacted value was not in registry');
		}

		return value;
	},
} as const;

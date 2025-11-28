/**
 * Mixin factory for discriminated error classes with typed props.
 *
 * Props become readonly fields; `message`/`cause` auto-wire to Error; `cause.stack` chains.
 *
 * @see [TypeScript Mixins](https://www.typescriptlang.org/docs/handbook/mixins.html)
 * @typeParam Tag - Literal string for `_tag` discriminant
 * @returns Base class to extend with optional generic props
 *
 * @example
 * ```typescript
 * class CreateGitRepoError extends TaggedError("CreateGitRepoError")<{
 *   repoName: string;
 *   org: string;
 *   cause?: Error;
 * }> {}
 *
 * const err = new CreateGitRepoError({ repoName: "api", org: "acme", cause: httpErr });
 * err._tag;    // "CreateGitRepoError" (literal)
 * err.repoName; // string (typed)
 * err.toJSON(); // serializable
 * ```
 */
export function TaggedError<Tag extends string>(
  tag: Tag,
): new <A extends Record<string, unknown> = {}>(
  ...args: {} extends TaggedErrorProps<A>
    ? [props?: TaggedErrorProps<A>]
    : [props: TaggedErrorProps<A>]
) => Error & {
  readonly _tag: Tag;
  toJSON(): Record<string, unknown>;
  prettyPrint(): string;
} & Readonly<A> {
  const instances = new WeakMap<Error, Record<string, unknown>>();

  class TaggedErrorClass extends Error {
    readonly _tag: Tag = tag;
    override readonly name = tag;

    constructor(props?: Record<string, unknown>) {
      const message = getMessage(tag, props);
      const cause = getCause(props);
      super(message, { cause });

      if (props) {
        Object.assign(this, props);
        instances.set(this, props);
      }

      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, new.target);
      }

      if (cause) {
        this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
      }
    }

    toJSON(): Record<string, unknown> {
      return {
        _tag: this._tag,
        message: this.message,
        stack: this.stack,
        ...instances.get(this),
      };
    }

    [Symbol.for("nodejs.util.inspect.custom")](): string {
      return this.prettyPrint();
    }

    /** Formats error with tag, message, properties, and stack trace */
    prettyPrint(): string {
      const props = instances.get(this);
      const propsStr = props
        ? Object.entries(props)
            .filter(([k]) => k !== "message" && k !== "cause")
            .map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`)
            .join("\n")
        : "";

      let result = `${tag}: ${this.message}`;
      if (propsStr) result += `\n${propsStr}`;
      if (this.stack) {
        const stackLines = this.stack.split("\n").slice(1).join("\n");
        if (stackLines) result += `\n${stackLines}`;
      }
      return result;
    }
  }

  // Cast required: internal class can't express the generic `Readonly<A>` constraint
  // that gets applied per-instantiation. `never` is assignable to any type.
  return TaggedErrorClass as never;
}

type TaggedErrorProps<A extends Record<string, unknown>> = {
  readonly [P in keyof A as P extends "_tag" ? never : P]: A[P];
};

function getMessage(tag: string, props?: Record<string, unknown>): string {
  return props && "message" in props && typeof props.message === "string"
    ? props.message
    : tag;
}

function getCause(props?: Record<string, unknown>): Error | undefined {
  return props && "cause" in props && Error.isError(props.cause)
    ? props.cause
    : undefined;
}

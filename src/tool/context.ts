import { ValueOf } from "./value-of";

/**
 * The {@link Context} class captures the context of an agent interaction. It has a request id that
 * is unique for each interaction and an invocation counter for the number of times the LLM is
 * invoked in the course of producing a request response.
 *
 * Additional key-value pairs can be provided to securely pass information to the function calls
 * outside the LLM call stack.
 *
 * The request id and secure information are static for the duration of an interaction. The
 * counter is incremented for each time the LLM is invoked.
 */
export interface Context<T extends {}> {
  /**
   * Returns the context as a key-value map.
   */
  asMap(): Map<keyof T, ValueOf<T>>;

  /**
   * Retrieves a value from the context by key.
   * @param key - The key to look up.
   * @returns The value associated with the key, or undefined if the key doesn't exist.
   */
  get(key: string): ValueOf<T> | undefined;

  /**
   * Executes a provided function once for each key-value pair in the context.
   * @param action - A function that takes a key and a value.
   */
  forEach(
    callbackFn: (
      value: ValueOf<T>,
      key: keyof T,
      map: Map<keyof T, ValueOf<T>>,
    ) => void,
  ): void;

  /**
   * Advances the invocation counter (if applicable).
   */
  nextInvocation(): void;
}

/**
 * Default implementation of the `Context` interface.
 */
export class DefaultContext<T extends {}> implements Context<T> {
  private readonly secureData: Map<keyof T, ValueOf<T>>;

  constructor(secureData: Record<string, any> = {}) {
    this.secureData = new Map(
      Object.entries(secureData) as [keyof T, ValueOf<T>][],
    );
  }

  asMap() {
    return new Map(this.secureData);
  }

  get(key: string) {
    return this.secureData.get(key as keyof T);
  }

  forEach(
    callbackFn: (
      value: ValueOf<T>,
      key: keyof T,
      map: Map<keyof T, ValueOf<T>>,
    ) => void,
  ): void {
    this.secureData.forEach(callbackFn);
  }

  nextInvocation(): void {
    // No-op for DefaultContext
  }
}

/**
 * A static factory for creating `Context` instances.
 */
export const ContextFactory = {
  EMPTY: new DefaultContext(),

  /**
   * Creates a new `Context` with provided secure data.
   * @param secure - Key-value pairs to initialize the `Context`.
   * @returns An empty `Context`.
   */
  create<T extends {}>(secureData?: T): Context<T> {
    return new DefaultContext(secureData);
  },
};

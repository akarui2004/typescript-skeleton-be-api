export type Result<T, E = Error> = Success<T> | Failure<E>;

export class Success<T> {
  public readonly success = true as const;
  public readonly value: T;

  constructor(value: T) {
    this.value = value;
  }

  public isFailure(): this is Failure<never> {
    return false;
  }

  public isSuccess(): this is Success<T> {
    return true;
  }

  public map<U>(fn: (value: T) => U): Result<U, never> {
    return new Success(fn(this.value));
  }

  public flatMap<U, E>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }

  public getOrElse(_defaultValue: T): T {
    return this.value;
  }
}

export class Failure<E> {
  public readonly success = false as const;
  public readonly error: E;

  constructor(error: E) {
    this.error = error;
  }

  public isFailure(): this is Failure<E> {
    return true;
  }

  public isSuccess(): this is Success<never> {
    return false;
  }

  public map<U>(_fn: (value: never) => U): Result<never, E> {
    return this;
  }

  public flatMap<U, F>(_fn: (value: never) => Result<U, F>): Result<never, E | F> {
    return this as Failure<E | F>;
  }

  public getOrElse(defaultValue: never): never {
    return defaultValue;
  }
}

export const success = <T>(value: T): Success<T> => new Success(value);
export const failure = <E>(error: E): Failure<E> => new Failure(error);

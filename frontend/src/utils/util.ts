export function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function noop() {}

export function toIntegerString(value: bigint | string | number): string {
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) {
      throw new Error("Unsafe integer. Use a decimal string or bigint instead.");
    }
    return String(value);
  }

  if (!/^-?\d+$/.test(value)) {
    throw new Error("Expected an integer decimal string.");
  }
  return value;
}

export function formatShortId(value: string, start = 5, end = 4) {
  if (value.length <= start + end + 1) return value;
  return `${value.slice(0, start)}…${value.slice(-end)}`;
}

export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message = "Operation timed out") {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

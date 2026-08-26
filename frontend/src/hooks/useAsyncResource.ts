import { useCallback, useEffect, useState } from "react";

export function useAsyncResource<T>(
  loader: () => Promise<T>,
  dependencies: readonly unknown[] = [],
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loader();
      setData(result);
      setUpdatedAt(new Date().toISOString());
      return result;
    } catch (value) {
      const next = value instanceof Error ? value : new Error("Request failed.");
      setError(next);
      return null;
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    data,
    error,
    loading,
    stale: Boolean(error && data),
    updatedAt,
    refresh,
  };
}

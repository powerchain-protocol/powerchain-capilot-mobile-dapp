export async function fetchJsonBounded<T>(url: string | URL, init: RequestInit, options: { timeoutMs: number; maxBytes: number }): Promise<{ response: Response; payload: T }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, redirect: 'error' });
    const declared = Number(response.headers.get('content-length') || '0');
    if (declared > options.maxBytes) throw new Error(`Provider response exceeds ${options.maxBytes} bytes.`);
    const reader = response.body?.getReader();
    if (!reader) return { response, payload: await response.json() as T };
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > options.maxBytes) {
        await reader.cancel();
        throw new Error(`Provider response exceeds ${options.maxBytes} bytes.`);
      }
      chunks.push(next.value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const text = new TextDecoder().decode(bytes);
    return { response, payload: JSON.parse(text) as T };
  } finally {
    clearTimeout(timer);
  }
}

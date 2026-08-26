export type LoraAdapter = { id: string; baseModel: string; adapterPath: string; enabled: boolean };

export function loadLoraRegistry(source: NodeJS.ProcessEnv = process.env) {
  const enabled = (source.LORA_ENABLED || 'false').trim().toLowerCase() === 'true';
  const raw = source.LORA_ADAPTERS_JSON?.trim() || '[]';
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) throw new Error('LORA_ADAPTERS_JSON must be an array.');
  const adapters = parsed.map((value) => {
    const row = value as Partial<LoraAdapter>;
    if (!row.id?.trim() || !row.baseModel?.trim() || !row.adapterPath?.trim()) throw new Error('LoRA adapter requires id, baseModel and adapterPath.');
    if (/^https?:\/\//i.test(row.adapterPath)) throw new Error('Remote LoRA adapter URLs are not allowed. Use a deployment-local path.');
    return { id: row.id.trim(), baseModel: row.baseModel.trim(), adapterPath: row.adapterPath.trim(), enabled: row.enabled !== false };
  });
  return { enabled, adapters: enabled ? adapters.filter((adapter) => adapter.enabled) : [] };
}

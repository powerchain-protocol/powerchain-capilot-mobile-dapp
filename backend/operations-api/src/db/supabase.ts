import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function createSupabaseServerClient(url: string, serviceRoleKey: string): SupabaseClient | null {
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { 'x-powerchain-service': 'operations-api' } },
  });
}

export class SupabaseOperationsEventPublisher {
  constructor(private readonly client: SupabaseClient | null) {}
  async publish(topic: string, payload: Record<string, unknown>) {
    if (!this.client) return false;
    const channel = this.client.channel('powerchain-operations');
    try {
      await channel.send({ type: 'broadcast', event: topic, payload });
      return true;
    } finally {
      await this.client.removeChannel(channel);
    }
  }
}

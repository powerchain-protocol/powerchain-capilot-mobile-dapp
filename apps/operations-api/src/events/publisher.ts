import { createClient } from "@supabase/supabase-js";
import type { OperationalEvent } from "@powerchain/energy-contracts";
import { config } from "../config.js";

const realtime = config.SUPABASE_REALTIME_ENABLED
  ? createClient(config.SUPABASE_URL!, config.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

export async function broadcastOperationalEvent(event: OperationalEvent) {
  if (!realtime) return false;
  const channel = realtime.channel(config.SUPABASE_REALTIME_CHANNEL);
  try {
    await channel.send({ type: "broadcast", event: event.type, payload: event });
    return true;
  } finally {
    await realtime.removeChannel(channel);
  }
}

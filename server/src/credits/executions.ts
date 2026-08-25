const inFlight = new Map<string, AbortController>();

function key(userId: string, clientRequestId: string) {
  return `${userId}:${clientRequestId}`;
}

export function registerCopilotExecution(
  userId: string,
  clientRequestId: string,
) {
  const controller = new AbortController();
  inFlight.set(key(userId, clientRequestId), controller);
  return controller;
}

export function unregisterCopilotExecution(
  userId: string,
  clientRequestId: string,
) {
  inFlight.delete(key(userId, clientRequestId));
}

export function cancelCopilotExecution(
  userId: string,
  clientRequestId: string,
) {
  const controller = inFlight.get(key(userId, clientRequestId));
  if (!controller) return false;
  controller.abort("user_cancelled");
  return true;
}

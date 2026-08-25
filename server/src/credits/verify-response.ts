export function verifyCopilotResponse(content: string) {
  const normalized = content.trim();
  return {
    verified: normalized.length > 0,
    content: normalized,
    reason: normalized.length > 0 ? undefined : "empty_response",
  };
}

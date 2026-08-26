export const CHAT_LIMITS = {
  messageMaxLength: 2000,
  composerMaxHeight: 132,
  messageBubbleMaxWidth: "84%",
  historyPageSize: 30,
} as const;

export const CHAT_TIMINGS = {
  typingDelayMs: 180,
  retryDelayMs: 800,
  toastDurationMs: 2400,
} as const;

export const CHAT_COPY = {
  composerPlaceholder: "Message PowerChain Copilot",
  send: "Send message",
  stop: "Stop generating",
  retry: "Retry",
  copy: "Copy",
  regenerate: "Regenerate",
  loadingConversation: "Loading conversation",
  assistantTyping: "PowerChain Copilot is responding",
} as const;

export type MessageLine =
  | { type: "title"; text: string }
  | { type: "bullet"; text: string }
  | { type: "body"; text: string }
  | { type: "spacer"; text: "" };

function stripInlineMarkdown(value: string) {
  return value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

export function normalizeCopilotMessage(content: string): MessageLine[] {
  return content.split(/\r?\n/).map((rawLine) => {
    const raw = rawLine.trim();

    if (!raw) {
      return { type: "spacer", text: "" } as const;
    }

    // Convert Markdown headings to PowerChain's quieter "• title" pattern.
    if (/^#{1,6}\s+/.test(raw)) {
      return {
        type: "title",
        text: stripInlineMarkdown(raw.replace(/^#{1,6}\s+/, "")),
      } as const;
    }

    // Normalize Markdown and Unicode bullet variants to one bullet style.
    if (/^[-*+•]\s+/.test(raw)) {
      return {
        type: "bullet",
        text: stripInlineMarkdown(raw.replace(/^[-*+•]\s+/, "")),
      } as const;
    }

    return {
      type: "body",
      text: stripInlineMarkdown(raw),
    } as const;
  });
}

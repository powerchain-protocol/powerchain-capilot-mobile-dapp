export type QuickPrompt = {
  id: string;
  label: string;
  prompt: string;
};

export const quickPrompts: QuickPrompt[] = [
  {
    id: "energy-status",
    label: "Energy status",
    prompt: "Summarize current renewable generation, storage, and grid status.",
  },
  {
    id: "rwa-review",
    label: "Review RWA",
    prompt: "Review the latest Energy RWA evidence, backing, and risk signals.",
  },
  {
    id: "priority-actions",
    label: "Priority actions",
    prompt: "Show the highest-priority operational actions that need human review.",
  },
  {
    id: "evidence",
    label: "Evidence",
    prompt: "Summarize the latest verified evidence and provenance updates.",
  },
];

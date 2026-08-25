import { creditPrompts } from "./credit-prompts";

export type QuickPrompt = {
  id: string;
  label: string;
  costLabel: string;
  action:
    | { kind: "message"; prompt: string }
    | { kind: "route"; href: "/(app)/copilot-credits" };
};

const operationalPrompts: QuickPrompt[] = [
  {
    id: "energy-status",
    label: "Energy status",
    costLabel: "10,000 PWRC · ≈ $0.02 ref",
    action: {
      kind: "message",
      prompt: "Summarize current renewable generation, storage, and grid status.",
    },
  },
  {
    id: "rwa-review",
    label: "Review RWA",
    costLabel: "10,000 PWRC · ≈ $0.02 ref",
    action: {
      kind: "message",
      prompt: "Review the latest Energy RWA evidence, backing, and risk signals.",
    },
  },
  {
    id: "priority-actions",
    label: "Priority actions",
    costLabel: "10,000 PWRC · ≈ $0.02 ref",
    action: {
      kind: "message",
      prompt: "Show the highest-priority operational actions that need human review.",
    },
  },
];

export const quickPrompts: QuickPrompt[] = [
  ...operationalPrompts,
  ...creditPrompts,
];

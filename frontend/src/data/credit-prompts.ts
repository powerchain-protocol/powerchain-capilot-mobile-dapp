import type { QuickPrompt } from "./quick-prompts";

export const creditPrompts: QuickPrompt[] = [
  {
    id: "credits-center",
    label: "Open PWRC credit center",
    costLabel: "No message charge",
    action: { kind: "route", href: "/(app)/copilot-credits" },
  },
  {
    id: "credits-explain",
    label: "Explain PWRC credit accounting",
    costLabel: "10,000 PWRC · ≈ $0.02 ref",
    action: {
      kind: "message",
      prompt:
        "Explain my PWRC Copilot credit accounting using the current grounded balance and pricing context. Distinguish available, reserved, spent, funded, and remaining response runway. Treat $0.000002/PWRC as a configured reference value, not a live market price.",
    },
  },
  {
    id: "credits-usage",
    label: "Review recent PWRC credit usage",
    costLabel: "10,000 PWRC · ≈ $0.02 ref",
    action: {
      kind: "message",
      prompt:
        "Review the recent PWRC Copilot credit ledger context, summarize reservations, settlements, releases, funding, and any reconciliation exception. Do not infer transactions that are not present in the grounded credit context.",
    },
  },
];

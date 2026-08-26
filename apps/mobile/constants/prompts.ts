export type PromptDefinition = {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: 'operations' | 'evidence' | 'credits';
};

export const PROMPT_LIBRARY: PromptDefinition[] = [
  {
    id: 'ops-risk-review',
    title: 'Operational risk review',
    description: 'Prioritize the operational risks that need human review.',
    prompt: 'Summarize the operational risks I should review today and separate observed evidence from assumptions.',
    category: 'operations',
  },
  {
    id: 'evidence-readiness',
    title: 'Evidence readiness',
    description: 'Identify evidence needed before an execution can be approved.',
    prompt: 'What evidence should be verified before approving an execution? Identify any missing or stale evidence explicitly.',
    category: 'evidence',
  },
  {
    id: 'credits-balance',
    title: 'Explain my PWRC credits',
    description: 'Explain available, reserved, spent, and funded balances.',
    prompt: 'Explain my PWRC Copilot credit account: available, reserved, spent, and funded balances. Use only the authenticated Credit Kernel context.',
    category: 'credits',
  },
  {
    id: 'credits-capacity',
    title: 'Responses remaining',
    description: 'Calculate how many Copilot responses the available balance supports.',
    prompt: 'How many Copilot responses can I run with my currently available PWRC credits? Show the integer base-unit calculation.',
    category: 'credits',
  },
  {
    id: 'credits-ledger',
    title: 'Review credit ledger',
    description: 'Interpret recent credit funding and reservation movements.',
    prompt: 'Explain my recent PWRC credit ledger activity. Distinguish funding, reservations, releases, expiry recovery, and settled spend.',
    category: 'credits',
  },
  {
    id: 'credits-payment-verification',
    title: 'Top-up verification',
    description: 'Explain how Solana Pay becomes usable Copilot credit.',
    prompt: 'Explain the PWRC Solana Pay top-up verification flow and why credits are added only after the Payment Kernel verifies payment.settled.',
    category: 'credits',
  },
  {
    id: 'credits-reservation-state',
    title: 'Reserved vs spent',
    description: 'Explain the reservation lifecycle for a Copilot response.',
    prompt: 'Explain why PWRC credits move from available to reserved before generation, then to spent only after the completed response proof is durably stored and atomically settled. Include expiry recovery.',
    category: 'credits',
  },
  {
    id: 'credits-quote-proof',
    title: 'Verify a credit quote',
    description: 'Explain the deterministic quote hash and pricing snapshot.',
    prompt: 'Explain how my PWRC Copilot quote hash binds user, price version, quantity, 9-decimal base-unit cost, mint/network identity, and quote timestamps.',
    category: 'credits',
  },
];

export const COPILOT_SUGGESTIONS = PROMPT_LIBRARY.slice(0, 3).map((item) => item.prompt);

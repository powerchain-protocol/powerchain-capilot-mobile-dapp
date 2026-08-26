# PowerChain Copilot Mobile v1.0.0 — Interaction Design

## Primary navigation

The application uses exactly five primary tabs:

1. **Overview** — command-center summary and shortcuts.
2. **Actions** — approvals, deliverable review, settlement review, reconciliation and informational work.
3. **Copilot** — managed AI, MCP-grounded analysis and PWRC-billed responses.
4. **Assets** — renewable assets, evidence, settlement posture and token/network context.
5. **Systems** — AI providers, chains, databases, gateways and operational status.

Settings is intentionally not a sixth tab. It is an infrastructure/operator route opened from Systems or the account control.

## Canonical routes

| Intent | Route |
| --- | --- |
| Overview | `/(app)/(tabs)` |
| Action Center | `/(app)/(tabs)/action-center` |
| Copilot | `/(app)/(tabs)/copilot` |
| Assets | `/(app)/(tabs)/assets` |
| Systems | `/(app)/(tabs)/integrations` |
| PWRC Credits | `/(app)/copilot-credits` |
| Batch approval review | `/(app)/approvals/batch` |
| Asset details | `/(app)/assets/[assetId]` |
| Reports | `/(app)/reports` |
| Settlement review | `/(app)/settlements/review` |
| Service Health | `/(app)/service-health` |
| Diagnostics | `/(app)/diagnostics` |
| Settings | `/(app)/settings` |

All primary toolbar and card actions resolve through `src/constants/routes.ts`. There are no placeholder buttons in the primary interaction flow.

## Toolbar model

Each operational screen uses a purpose-built toolbar with:

- section identity;
- concise operational description;
- optional environment/status badge;
- no more than three high-value actions;
- route-specific actions rather than generic overflow controls.

Examples:

- Overview → Batch review / Reports
- Actions → Batch review / Settlement review
- Assets → Reports / Diagnostics
- Systems → Service Health / Diagnostics / Settings
- Copilot → Credits / Diagnostics

## Trust and execution UX

The UI must not imply that navigation, selection, AI recommendation or batch review equals approval or financial execution.

Canonical model:

```text
AI prepares
  ↓
Operator reviews
  ↓
Policy / approval authority
  ↓
Wallet authorizes
  ↓
Execution
  ↓
Receipt / reconciliation
```

Settlement Review and Batch Approval Review therefore describe authority explicitly and do not expose UI-only mock execution buttons.

## PWRC Credits

The PWRC Credit Center remains outside the five tabs but is reachable from Overview, Copilot and the desktop header.

One completed acknowledged Copilot response remains:

```text
1 MSG UNIT = 10,000 PWRC
```

MCP calls, provider fallback and internal retries do not create additional message charges.

## MCP diagnostics

Diagnostics surfaces only sanitized MCP metadata and tool counts. Raw tool output, API keys, credentials, private RPC URLs and sensitive MCP arguments are never rendered.

## Data mode

Operational sample assets, actions, reports and settlement cards are displayed only when:

```env
EXPO_PUBLIC_DATA_MODE=demo
```

In `live` or `tba` mode the screens use honest empty/unavailable states until authoritative production data sources are connected.

## Brand and theme

The supplied PowerChain mark is the canonical header/app-icon direction.

- default UI: Light
- operations dark UI: Carbon Dark
- primary operational action: dark green
- no purple/neon/cyberpunk treatment

The internal theme key `darkGreen` is retained for backward compatibility but is displayed to users as **Carbon Dark**.

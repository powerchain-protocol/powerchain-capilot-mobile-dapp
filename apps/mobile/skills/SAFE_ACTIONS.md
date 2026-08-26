# Safe Actions — Prepare-Only Contract

Version 1.0.0

Safe Actions are a policy and review boundary. They do not execute physical equipment, submit blockchain transactions, or sign with server-held keys.

## Allowed outcomes

- `prepared`
- `rejected`
- `expired`

## Execution boundaries

- `ems.dispatch.prepare` requires explicit human approval before any external execution workflow.
- `wallet.signature.prepare` and `settlement.prepare` require a user-controlled wallet.
- `/api/v1/actions/execute` fails closed with `405 PHYSICAL_EXECUTION_DISABLED`.
- The operations backend `/v1/actions/execute` also fails closed.
- No private key, seed phrase, signing key, or custodial execution credential belongs in this service.

Safe Action idempotency binds the request to the authenticated user/resource and prevents duplicate preparation from becoming duplicate intent.

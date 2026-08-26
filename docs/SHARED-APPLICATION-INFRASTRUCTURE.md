# Shared Application Infrastructure

PowerChain Copilot 1.0.0 now has explicit shared boundaries for code that was
previously duplicated or coupled directly to Expo APIs.

## Layout

```text
apps/mobile/src/
├── shared/
│   ├── assets.ts
│   ├── errors.ts
│   ├── helpers.ts
│   ├── tokens.ts
│   ├── types.ts
│   └── index.ts
├── storage/
│   ├── keys.ts
│   ├── secure-storage.ts
│   ├── preferences-storage.ts
│   ├── json-storage.ts
│   ├── session-storage.ts
│   └── index.ts
├── store/
│   ├── create-store.ts
│   ├── app-store.ts
│   ├── session-store.ts
│   ├── preferences-store.ts
│   └── index.ts
└── utils/
    ├── util.ts
    ├── errors.ts
    ├── helpers.ts
    ├── tokens.ts
    ├── assets.ts
    └── index.ts
```

## Rules

- `shared/` contains environment-independent application contracts/constants.
- `storage/` owns persistence adapters and storage keys.
- `store/` owns observable in-memory application state and hydration.
- `utils/` exposes small reusable functions and compatibility re-exports.
- API code must not import `expo-secure-store` directly.
- PWRC integer values remain bigint/domain data; do not convert balances to JS
  floating-point numbers.
- Static image imports remain literal `require()` calls in the asset registry so
  Metro can bundle them deterministically.
- Stores do not replace backend authorization or financial accounting. They are
  client state only.

# HOOKLABS — Contract Sources

HOOKLABS currently **reads and analyzes externally deployed contracts**. It does **not** require a new, HOOKLABS-owned on-chain contract to operate.

- `interfaces/IERC20Metadata.sol`: read-only contract interface documenting the standard token calls relevant to token inspection. An interface contains no implementation and cannot be deployed as a token.
- Hook scanning, network configuration, permissions inspection, and RPC calls already live in `lib/blockchain.ts` and related application files. These are TypeScript integrations, not Solidity contracts.
- The $HOOKLB token contract address is a **configuration value** after launch; it must not be guessed or replaced with a fabricated token contract.
- Uniswap v4's external PoolManager and existing Ponsfamily contracts are **not owned by HOOKLABS**. Do not deploy substitutes under those names.

## When to add deployable contracts

Add actual Solidity implementations only for a separately specified on-chain product feature (for example, an opt-in registry or access-control contract), with security review, reproducible tests, and an explicit deployment plan. No on-chain deploy commands or wallet keys are included here.

## Verification

Run `node --test test/contracts-structure.test.mjs` to check the repository contract scaffolding and deployment manifest schema. This is a **repository check**, not a Solidity compilation, audit, or live-chain test.

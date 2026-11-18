<div align="center">

# HOOKLABS

**A clearer view of on-chain activity.**

Explore contracts, inspect on-chain signals, and discover activity across supported blockchain networks — all in one focused workspace.

[**Explore HOOKLABS**](https://hooklabs.tech) · [Documentation](./docs) · [Contract References](./contracts)

</div>

---

## About HOOKLABS

HOOKLABS is a blockchain analytics and discovery platform built to make contract research more accessible. It brings contract inspection, an indexed registry, and network activity insights together in a clean interface, helping users move from an address to useful context with fewer steps.

The platform focuses on practical tools and readable data rather than unnecessary complexity.

## Explore the Platform

| Feature | What it does |
| --- | --- |
| **Inspect a Contract** | Search a contract address and review available on-chain information and assessment signals. |
| **Browse Registry** | Explore indexed contracts and related details from supported networks. |
| **Network Insights** | Follow available hook activity and ecosystem metrics. |
| **Token Information** | View project token information and verified links when configured. |

Data availability depends on network support, indexing, RPC services, and external data sources. Assessment signals are informational and should not be treated as a formal security audit.

## Built With

- **Next.js, React & TypeScript** — application framework and interface
- **Tailwind CSS** — responsive styling
- **viem & wagmi** — blockchain connectivity
- **Neon & Drizzle ORM** — database-backed functionality

## Local Development

Use **Node.js 20.9+** and **pnpm**.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to access the local application.

Some features require separately configured RPC endpoints, database credentials, or external services. Keep secrets in local environment files and out of version control.

## Contract References

The [`contracts/`](./contracts) directory documents interfaces used for blockchain integrations. It does not represent a deployed HOOKLABS-owned smart contract.

Public deployment records and templates are maintained in [`deployments/`](./deployments). Details for the planned HOOKLB token launch are available in the [launch guide](./docs/HOOKLB-LAUNCH-GUIDE.md). Contract addresses will be documented only after verification.

---

<div align="center">

**Research with clarity.**

[hooklabs.tech](https://hooklabs.tech)

</div>

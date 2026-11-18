# Deployment records

This directory stores **public, verified contract deployment metadata** only. It intentionally contains no asserted HOOKLABS deployments.

Copy `manifest.example.json` to a network-specific manifest only **after** an actual deployment or verified third-party address is confirmed. Include chain ID, checksum address, transaction hash, explorer, deployed code version and deployment provenance.

Never commit deployer private keys, mnemonics, wallet files, access tokens or environment files. An address in `lib/blockchain.ts` is not proof that HOOKLABS deployed or owns that contract.

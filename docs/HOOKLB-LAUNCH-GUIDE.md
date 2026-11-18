# HOOKLB token launch checklist (Robinhood Chain / Ponsfamily)

## Status before launch
- `contracts/interfaces/IERC20Metadata.sol` is a **read-only interface**, not a deployable HOOKLB token.
- `deployments/manifest.example.json` is a blank example, not proof of deployment.
- No CA or launch transaction is known yet. Keep `contractAddress` and `token.contractAddress` empty in your **private** `public/config.json`.
- Keep `token.launchStatus` set to `pre-launch` and `token.launchVersion` set to `pending` until you verify the actual launch.
- `public/config.json` is gitignored intentionally. It is **publicly served** when deployed, so never put a secret in it.

## At launch
1. Launch the token using your chosen Ponsfamily process (if that is still the intended platform). Check the **exact network** Robinhood Chain mainnet (chain ID **4663**) and actual Pons launch version (v1/v2).
2. Obtain the **actual token contract address** (40 hex characters after `0x`) and **confirmed launch transaction hash** (64 hex characters after `0x`) from the platform and chain explorer.
3. Independently verify token name/symbol, creator provenance, chain ID, and that the transaction succeeded. Avoid confusing token CA with factory, pool, router, or wallet addresses.
4. Run from your HOOKLABS project root:

   ```powershell
   node scripts/register-hooklb-launch.mjs --address 0xYOUR_REAL_TOKEN_ADDRESS --tx 0xYOUR_REAL_TRANSACTION_HASH --version v2 --apply-config
   ```

   Replace BOTH placeholders with actual values and select `v1` or `v2` according to the verified launch. `--apply-config` requires your private `public/config.json`; it makes a timestamped backup first. Without `--apply-config`, the command records only public deployment metadata.
5. The script populates `deployments/hooklb-robinhood-mainnet.json` and (with `--apply-config`) updates: top-level `contractAddress`, `chainId`, `chainName`, `updatedAt`, and `token.contractAddress`, `token.network`, `token.launchStatus`, `token.launchVersion`.
6. Validate the website locally. Add legitimate `token.purchase.url`, `token.chartUrl`, and `token.explorerUrl` to your private config when verified. Enable the corresponding purchase/chart controls only when those links work.
7. Deploy the **private config** using your hosting workflow. GitHub alone will **not** update the live config file. Confirm the site reads the new CA, the chart actually has data, and purchase links lead to the intended token.

## After launch: GitHub
- Check `git status --short` and `git check-ignore -v public/config.json`.
- Review the generated `deployments/hooklb-robinhood-mainnet.json` for correct public data; remove inaccurate claims.
- `git add contracts/ deployments/ docs/HOOKLB-LAUNCH-GUIDE.md scripts/register-hooklb-launch.mjs`
- `git commit -m "Document verified HOOKLB token launch"`
- `git push origin main` (or your actual branch).
- Do not push `.env*`, `public/config.json`, credentials, or a private backup.
- A token launched using Ponsfamily is not necessarily authored by HOOKLABS; do not claim source-code verification until actually verified.

## Safeguards
- Script never signs, sends a blockchain transaction, deploys a contract, or reads private keys.
- It validates **format only**, not chain provenance; human/on-chain verification remains required.
- It refuses to overwrite an existing deployment record or a different CA in config.
- If the command fails partway, inspect local files before rerunning.

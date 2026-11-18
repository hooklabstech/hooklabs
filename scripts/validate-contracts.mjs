import { readFile } from "node:fs/promises"
import assert from "node:assert/strict"

const sol = await readFile(new URL("../contracts/interfaces/IERC20Metadata.sol", import.meta.url), "utf8")
assert.match(sol, /interface\s+IERC20Metadata\s*\{/)
for (const name of ["name", "symbol", "decimals", "totalSupply", "balanceOf", "allowance"]) {
  assert.match(sol, new RegExp(`function\\s+${name}\\s*\\(`))
}
const manifest = JSON.parse(await readFile(new URL("../deployments/manifest.example.json", import.meta.url), "utf8"))
assert.equal(manifest.chainId, 4663)
assert.deepEqual(manifest.contracts, [])
console.log("Contract interface and deployment manifest structure validated (no compilation or on-chain audit).")

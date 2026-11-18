import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

test("token interface is read-only and has no deployable implementation", async () => {
  const source = await readFile(new URL("../contracts/interfaces/IERC20Metadata.sol", import.meta.url), "utf8")
  assert.match(source, /interface\s+IERC20Metadata\s*\{/)
  for (const fn of ["name", "symbol", "decimals", "totalSupply", "balanceOf", "allowance"]) {
    assert.ok(source.includes(`function ${fn}(`), `${fn} is declared`)
  }
  assert.doesNotMatch(source, /\bcontract\s+IERC20Metadata\b/)
})

test("example deployment manifest asserts no deployments", async () => {
  const manifest = JSON.parse(await readFile(new URL("../deployments/manifest.example.json", import.meta.url), "utf8"))
  assert.equal(manifest.chainId, 4663)
  assert.deepEqual(manifest.contracts, [])
})

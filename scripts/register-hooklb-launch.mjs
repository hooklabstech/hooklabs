#!/usr/bin/env node
/** Register a confirmed Ponsfamily HOOKLB token. Never deploys or signs transactions. */
import { readFile, writeFile, mkdir, access, copyFile } from 'node:fs/promises'
import path from 'node:path'

const args = process.argv.slice(2)
const arg = (key) => { const i = args.indexOf(`--${key}`); return i < 0 ? '' : args[i + 1] ?? '' }
const usage = `Usage:\n  node scripts/register-hooklb-launch.mjs --address 0x... --tx 0x... --version v2 [--explorer-url https://...] [--apply-config]\n\nOnly run after checking the transaction and actual token address on Robinhood Chain (4663). No wallet or private key required.\nDefault: generate deployment record only. --apply-config also updates your PRIVATE public/config.json (and creates a backup).\n`
if (args.includes('--help') || args.length === 0) { console.log(usage); process.exit(0) }
const address = arg('address')
const tx = arg('tx')
const version = arg('version')
const explorer = arg('explorer-url')
const apply = args.includes('--apply-config')
const isAddr = /^0x[0-9a-fA-F]{40}$/
const isTx = /^0x[0-9a-fA-F]{64}$/
if (!isAddr.test(address)) throw Error('Invalid token address. Expected 0x followed by 40 hexadecimal characters.')
if (!isTx.test(tx)) throw Error('Transaction hash required: 0x followed by 64 hexadecimal characters.')
if (!['v1','v2'].includes(version)) throw Error('Specify --version v1 or --version v2 after checking the launch details.')
if (explorer) {
 const url = new URL(explorer)
 if (url.protocol !== 'https:') throw Error('Explorer URL must use HTTPS.')
}
const root = process.cwd()
const output = path.join(root, 'deployments', 'hooklb-robinhood-mainnet.json')
const manifest = {
  network: 'Robinhood Chain', chainId: 4663,
  token: { name: 'HOOKLABS', symbol: 'HOOKLB', address, launchPlatform: 'Ponsfamily', launchVersion: version,
    deploymentTransactionHash: tx, ...(explorer ? { explorerUrl: explorer } : {}),
    provenance: 'Entered by project maintainer after independent on-chain verification',
    verifiedSourceCode: false },
  note: 'Project token deployed via third-party launchpad; this record does not claim a HOOKLABS-authored Solidity implementation or independently prove ownership.'
}
await mkdir(path.dirname(output), { recursive: true })
try { await access(output); throw Error('Deployment record already exists. Review it manually; refusing to overwrite.') } catch (e) { if (e.code !== 'ENOENT') throw e }
let configPath = path.join(root, 'public','config.json')
let updatedConfig = null
if (apply) {
 let cfg
 try { cfg = JSON.parse(await readFile(configPath, 'utf8')) } catch { throw Error('Could not read valid private public/config.json. Create/provision it first. No files written.') }
 if (!cfg.token || typeof cfg.token !== 'object') throw Error('config.json has no token object; no files written.')
 for (const existing of [cfg.contractAddress, cfg.token.contractAddress]) {
   if (existing && existing.toLowerCase() !== address.toLowerCase()) throw Error('Config already contains a different CA; refusing to replace it.')
 }
 const now = new Date().toISOString()
 cfg.contractAddress = address
 cfg.chainId = 4663
 cfg.chainName = 'Robinhood Chain'
 cfg.updatedAt = now
 cfg.token.contractAddress = address
 cfg.token.launchVersion = version
 cfg.token.launchStatus = 'live'
 cfg.token.network = 'Robinhood Chain'
 // Do not enable Buy or Chart automatically: links must be verified separately.
 updatedConfig = JSON.stringify(cfg, null, 2) + '\n'
}
if (apply) {
 const backup = path.join(root, "public", `config.pre-hooklb-launch-${new Date().toISOString().replace(/[:.]/g,'-')}.local.json`)
 await copyFile(configPath, backup)
 await writeFile(configPath, updatedConfig, 'utf8')
 console.log(`Updated private ${configPath}; backup: ${backup}`)
}
await writeFile(output, JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' })
console.log(`Created ${output}`)
console.log('Next: independently verify token and transaction, check buy/chart links, deploy private website config, review git status, and push ONLY public deployment record.')

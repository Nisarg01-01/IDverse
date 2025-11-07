# IDverse — Decentralized Identity & Access Management (IAM) dApp

## Project description
IDverse is a prototype Decentralized Identity and Access Management dApp.  
It demonstrates:
- DID registration (on-chain anchor for DID documents).
- Credential issuance workflow with off-chain credential storage (IPFS).
- On-chain credential status / revocation pointers for verifiers.
- Example front-end connection via Ethers.js and MetaMask.

This repository contains sample contracts, deployment scripts, and local test utilities for development and demonstration.

## Repo link
See repo: https://github.com/Nisarg01-01/IDverse.git

## Dependencies
- Node.js (LTS, >=18)
- npm
- Hardhat v3 (TypeScript template)
- Ethers.js v6
- dotenv
- web3.storage (for IPFS pinning)
- MetaMask (browser extension)
- VSCode + Git

## Quick setup (Windows, PowerShell)
1. Clone the repo (already done):
   ```powershell
   git clone https://github.com/Nisarg01-01/IDverse.git
   cd IDverse

2. Install dependencies:
    npm install


3. Create .env from .env.example and fill:
    RPC_URL= # e.g., Alchemy Sepolia URL or local http://127.0.0.1:8545
    PRIVATE_KEY=0x...      # test deployer private key (never commit)
    WEB3_STORAGE_TOKEN=... # web3.storage token for IPFS


4. Compile and test:
    npx hardhat compile
    npx hardhat test


5. Start local node (dev):
    npx hardhat node


## Local Deployment Test:

# set envs in current session (PowerShell)
$env:RPC_URL="http://127.0.0.1:8545"
$env:PRIVATE_KEY="0x..."
node scripts/deploy-local.mjs

## Contracts (draft)

contracts/IDverse.sol — DID registry and credential status registry (draft, safe to iterate).

contracts/IDverse.interfaces.sol — interface definitions and signatures.

### High-level contract responsibilities

DIDRegistry:

Register DID owner and pointer to DID document (IPFS CID or URL).

Update controller keys (with access control).

Emit events on registration and key changes.

CredentialRegistry:

Store mapping from credential ID -> on-chain status pointer (hash/CID/merkle root).

Allow issuer to update status (revocation) and emit events.

Provide view functions for verifiers to get latest status/pointers.
---

## Local-first development workflow (recommended)

We keep development local. No testnet keys required.

### 1) Start the Hardhat local node
In one terminal:
npx hardhat node

This prints several pre-funded dev accounts and their private keys. Use these keys locally only.

### 2) Deploy to local node
In another terminal (repo root):
`powershell
# optional: set env for this session (hardhat node default RPC)
='http://127.0.0.1:8545'
# use a local dev private key printed by 
px hardhat node OR leave unset because deploy-local.mjs defaults to a dev key
='0xac0974...'

# deploy with the ESM helper (uses local RPC by default)
node scripts/deploy-local.mjs

3) Interact with the deployed contract
# set local env (if needed)
='http://127.0.0.1:8545'
='0xac0974...' # use the same local dev key

# run interactions (reads & txs, script handles correct nonces)
node scripts/interact-local.mjs

4) IPFS (optional)

You do not need to use web3.storage for local-only development. If you want to demo off-chain storage later:

Create a web3.storage token.

Add WEB3_STORAGE_TOKEN to .env.

Run node scripts/upload-ipfs.mjs to pin a credential and get a CID.

Notes

No network keys or external RPC are required for local dev.

Use the Hardhat printed private keys only on your local node.

For multi-developer collaboration use the same git repo and instruct teammates to run npx hardhat node locally or use a shared Codespace if you want identical environments.

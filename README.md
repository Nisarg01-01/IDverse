# IDverse — Decentralized Identity & Access Management (IAM) dApp

## Project description

This project implements a decentralized Identity and Access Management (IAM) system using Ethereum smart contracts and self-sovereign identity (SSI) principles. The system enables *issuers* to create and sign credentials, *holders* to manage decentralized identifiers and store valid credentials, and *verifiers* to actually validate the credentials and check if they need to be revoked.

Only minimal data is stored on the chain such as metadata, hashes of the credentials, and audit events. Full credential documents are stored off-chain using `IPFS`, with hashes linking them to records that are on the chain.The project also includes a sample front-end built with React and Ethers.js, enabling authentication and contract interactions through MetaMask.

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
1.  Clone the repo (if you haven't already):
    ```powershell
    git clone https://github.com/Nisarg01-01/IDverse.git
    cd IDverse
    ```

2.  Install dependencies:
    ```powershell
    npm install
    ```

3.  Create a `.env` file from the example and add your environment variables.
    ```powershell
    copy .env.example .env
    ```
    Then, edit `.env` and fill in the values:
    ```dotenv
    # e.g., Alchemy Sepolia URL or local http://127.0.0.1:8545
    RPC_URL=
    # Test deployer private key (never commit this to git)
    PRIVATE_KEY=0x...
    # web3.storage token for IPFS examples
    WEB3_STORAGE_TOKEN=...
    ```
 
4.  Compile and test the contracts:
    ```powershell
    npx hardhat compile
    npx hardhat test
    ```

## Local Deployment Test:

To test a deployment to a local Hardhat node, first set the required environment variables for your PowerShell session:
```powershell
# Set environment variables for the current session
$env:RPC_URL="http://127.0.0.1:8545"
$env:PRIVATE_KEY="0x..." # Use a private key from 'npx hardhat node'

# Run the local deployment script
node scripts/deploy-local.mjs
```

## Contracts (draft)

`contracts/IDverse.sol` — DID registry and credential status registry (draft, safe to iterate).

`contracts/IDverse.interfaces.sol` — interface definitions and signatures.

### High-level contract responsibilities

**DIDRegistry:**
-   Register a DID owner and a pointer to a DID document (e.g., an IPFS CID or a URL).
-   Update controller keys with access control.
-   Emit events on registration and key changes.
 
**CredentialRegistry:**
-   Store a mapping from a credential ID to its on-chain status pointer (e.g., hash, CID, or Merkle root).
-   Allow the issuer to update a credential's status (e.g., for revocation) and emit corresponding events.
-   Provide view functions for verifiers to get the latest status/pointers.
---

## Local-first development workflow (recommended)

We keep development local. No testnet keys required.

### 1) Start the Hardhat local node
In one terminal, start the local node. This will print several pre-funded development accounts and their private keys. **Use these keys for local development only.**
```powershell
npx hardhat node
```
 
### 2) Deploy to local node
In a separate terminal, you can deploy the contracts. The `deploy-local.mjs` script is configured to use a default development key, but you can also set it explicitly in your environment.
```powershell
# Optional: Set environment variables for this session
$env:RPC_URL='http://127.0.0.1:8545'
# Use a private key from the 'npx hardhat node' output
$env:PRIVATE_KEY='0xac0974...'
 
# Deploy using the ESM helper script
node scripts/deploy-local.mjs
```
 
### 3) Interact with the deployed contract
After deployment, you can run the interaction script. Ensure you are using the same environment variables.
```powershell
# Set local environment (if not already set)
$env:RPC_URL='http://127.0.0.1:8545'
$env:PRIVATE_KEY='0xac0974...' # Use the same local dev key
 
# Run interactions (reads & transactions)
node scripts/interact-local.mjs
```
 
### 4) IPFS (optional)
You do not need `web3.storage` for local-only development. To demo off-chain storage:
1.  Create a web3.storage API token.
2.  Add `WEB3_STORAGE_TOKEN` to your `.env` file.
3.  Run `node scripts/upload-ipfs.mjs` to pin a sample credential and get its CID.
 
---
## Notes
-   No external network keys or RPC endpoints are required for local development.
-   Use the private keys printed by `npx hardhat node` **only** on your local node.
-   For multi-developer collaboration, use a shared git repository. Teammates can run `npx hardhat node` on their own machines or use a shared cloud development environment like GitHub Codespaces for identical setups.

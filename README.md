# IDverse - Decentralized Identity & Access Management

A production-ready blockchain-based decentralized identity management system built with Ethereum, IPFS, and React.

## Features

### Core Functionality
- **Decentralized Identifiers (DIDs)**: Create and manage self-sovereign identities
- **Verifiable Credentials**: Issue, hold, and verify digital credentials on-chain
- **Credential Revocation**: Issuers can revoke credentials with immediate status updates
- **Audit Trail**: Immutable verification logs on the blockchain

### User Interfaces
- **Issuer Dashboard**: Register DID, issue credentials using templates, view/revoke credentials
- **Holder Dashboard**: Register DID, view held credentials, export to PDF, view verification history
- **Verifier Dashboard**: Verify credentials, check IPFS integrity, log verifications

### Production Features
- Credential Templates (University Degree, Employment, Professional License, etc.)
- PDF Export for credentials
- Toast Notifications
- Loading Skeletons
- Error Boundary
- Search & Filter for credentials

## Tech Stack

| Category | Technology |
|----------|------------|
| Blockchain | Solidity 0.8.28, Hardhat 3.0.11 |
| Web3 | Ethers.js 6.15.0 |
| Frontend | React 18.3.1, Vite 7.2.4, TypeScript 5.6.2 |
| Styling | Tailwind CSS 3.4.17 |
| Storage | IPFS (Helia 6.0.11) |
| Wallet | MetaMask |
| PDF | jsPDF, html2canvas |

## Smart Contracts

| Contract | Purpose |
|----------|---------|
| `DIDRegistry` | Manages decentralized identifiers |
| `CredentialRegistry` | Handles credential lifecycle (issue, revoke, query) |
| `EventLogger` | Records verification events and audit trail |

---

## Quick Start (Local Deployment)

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **MetaMask** browser extension
- **Git**

### Step 1: Clone & Install

```bash
# Clone repository
git clone https://github.com/Nisarg01-01/IDverse.git
cd IDverse

# Install root dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### Step 2: Start Local Blockchain

Open **Terminal 1**:
```bash
npx hardhat node
```

Keep this terminal running. You'll see 20 test accounts with 10,000 ETH each.

### Step 3: Deploy Smart Contracts

Open **Terminal 2**:
```bash
npx hardhat run scripts/deploy-local.ts --network localhost
```

Expected output:
```
✅ DIDRegistry deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
✅ CredentialRegistry deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
✅ EventLogger deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

### Step 4: Start Frontend

Open **Terminal 3**:
```bash
cd client
npm run dev
```

Open http://localhost:5173 in your browser.

### Step 5: Configure MetaMask

**Add Hardhat Network:**
1. MetaMask → Settings → Networks → Add Network
2. Fill in:
   - **Network Name**: `Hardhat Local`
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`

**Import Test Account:**
1. Copy private key from Terminal 1:
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
2. MetaMask → Account → Import Account → Paste key
3. Switch to Hardhat Local network

You now have 10,000 ETH for testing!

---

## Usage Guide

### Issuer Workflow
1. Connect wallet on home page
2. Click **Issuer Dashboard** tab
3. **Register DID** tab → Enter DID identifier → Click "Register DID"
4. **Issue Credential** tab → Select template → Fill details → Click "Issue Credential"
5. **Credentials** tab → View all issued credentials
6. **Revoke** tab → Enter credential ID → Click "Revoke"

### Holder Workflow
1. Click **Holder Dashboard** tab
2. Register your DID in "My Decentralized Identity" section
3. Click "View All" in "My Credentials" to see your credentials
4. Click on a credential to view details
5. Use "Export PDF" to download credential
6. View verification history with the history icon

### Verifier Workflow
1. Click **Verifier Dashboard** tab
2. Enter Credential ID
3. Click "Verify" to check validity
4. View IPFS integrity check results
5. Click "Log Verification" to record on blockchain

---

## Run Tests

```bash
# Run all smart contract tests (107 tests)
npx hardhat test

# Run with gas report
REPORT_GAS=true npx hardhat test

# Run specific test file
npx hardhat test test/DIDRegistry.test.ts
```

---

## Project Structure

```
IDverse/
├── contracts/               # Solidity smart contracts
│   ├── DIDRegistry.sol
│   ├── CredentialRegistry.sol
│   └── EventLogger.sol
├── scripts/                 # Deployment scripts
│   └── deploy-local.ts
├── test/                    # Smart contract tests
│   ├── DIDRegistry.test.ts
│   ├── CredentialRegistry.test.ts
│   ├── EventLogger.test.ts
│   └── Integration.test.ts
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── Toast.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── WalletConnect.tsx
│   │   ├── pages/           # Page components
│   │   │   ├── IssuerPage.tsx
│   │   │   ├── HolderPage.tsx
│   │   │   └── VerifierPage.tsx
│   │   ├── services/        # Web3 & IPFS services
│   │   │   ├── web3.ts
│   │   │   └── ipfs.ts
│   │   ├── data/            # Static data
│   │   │   └── credentialTemplates.ts
│   │   └── App.tsx
│   └── package.json
├── hardhat.config.ts
└── package.json
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| MetaMask "Wrong Network" warning | Switch to Hardhat Local network (Chain ID 31337) |
| "Nonce too high" error | Reset MetaMask account: Settings → Advanced → Clear activity |
| Port 5173 in use | Frontend will auto-switch to 5174 |
| IPFS not ready | Wait a few seconds for Helia to initialize |
| Contract call fails | Ensure Hardhat node is running and contracts are deployed |

---

## License

MIT License

## Repository

https://github.com/Nisarg01-01/IDverse

---

**Built with ❤️ using Ethereum, IPFS, React, and TypeScript**

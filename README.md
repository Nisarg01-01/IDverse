# IDverse - Decentralized Identity & Access Management

## Project Description

IDverse is a blockchain-based decentralized identity management system that enables users to create, manage, and verify digital credentials without relying on centralized authorities. The system implements a complete workflow for:

- **Issuing Credentials**: Organizations can issue verifiable digital credentials stored on-chain
- **Managing Identity**: Users control their own decentralized identifiers (DIDs)
- **Verifying Credentials**: Third parties can verify credential authenticity with immutable audit trails
- **Credential Revocation**: Issuers can revoke credentials with immediate on-chain status updates

## Platform

**Ethereum Local Development Network (Hardhat)**
- RPC Endpoint: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Pre-funded Accounts: 20 accounts with 10,000 ETH each
- Network Type: Local development blockchain for testing and demonstration

## Technologies Used

### Blockchain & Smart Contracts
- **Solidity**: v0.8.28 - Smart contract programming language
- **Hardhat**: v3.0.11 - Ethereum development environment
- **Ethers.js**: v6.15.0 - Web3 library for blockchain interaction

### Frontend
- **React**: v18.3.1 - UI framework
- **Vite**: v7.2.4 - Build tool and development server
- **TypeScript**: v5.6.2 - Type-safe JavaScript
- **Tailwind CSS**: v3.4.17 - Utility-first CSS framework

### Storage & Integration
- **IPFS (Helia)**: v6.0.11 - Distributed credential storage with browser-native implementation
- **MetaMask**: Wallet integration for transaction signing

### IPFS Integration
The frontend uses Helia, a modern IPFS implementation, for decentralized credential storage:
- Credentials are stored on IPFS before blockchain registration
- Real CIDs are generated and linked to on-chain credentials
- Data can be retrieved and verified from IPFS during verification

### Smart Contracts
- **DIDRegistry**: Manages decentralized identifiers
- **CredentialRegistry**: Handles credential lifecycle (issue, revoke, query)
- **EventLogger**: Records verification events and audit trail

## Steps for Local Deployment

### Prerequisites

Install the following before proceeding:
- Node.js (v18 or higher)
- npm (v9 or higher)
- MetaMask browser extension
- Git

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/Nisarg01-01/IDverse.git
cd IDverse

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..

# Compile smart contracts
npx hardhat compile
```

### 2. Start Local Blockchain (Terminal 1)

```bash
npx hardhat node
```

**Expected Output:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
...
```

**Keep this terminal running throughout your session.**

### 3. Deploy Smart Contracts (Terminal 2)

```bash
npx hardhat run scripts/deploy-local.ts --network localhost
```

**Expected Output:**
```
DIDRegistry deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
CredentialRegistry deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
EventLogger deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

### 4. Run Automated Pipeline Test (Optional)

Verify the entire backend workflow (Register -> Issue -> Verify -> Revoke) with a single script:

```bash
npx hardhat run scripts/test-pipeline.ts --network localhost
```

### 5. Start Frontend (Terminal 3)

```bash
cd client
npm run dev
```

Open your browser to `http://localhost:5173` to interact with the application.

### 4. Start Frontend Application (Terminal 3)

```bash
cd client
npm run dev
```

**Expected Output:**
```
VITE v7.2.4  ready in 343 ms
➜  Local:   http://localhost:5173/
```

### 5. Configure MetaMask

**Add Hardhat Network:**
1. Open MetaMask → Networks → Add Network
2. Enter network details:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`
3. Save

**Import Test Account:**
1. Copy Account #0 private key from Terminal 1:
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
2. MetaMask → Import Account → Paste private key
3. Switch to imported account and Hardhat Local network

**You now have 10,000 ETH for testing.**

---

## Verify Implementation

See **VERIFICATION_GUIDE.md** for complete step-by-step demonstration of all implemented features:
- Issuer workflow (Frontend UI)
- Holder workflow (Console verification)
- Verifier workflow (Console verification)

---

## Project Status

**Phase 1: Core Implementation - COMPLETE (70%)**
- ✅ Smart contracts deployed and functional
- ✅ Frontend application with wallet integration
- ✅ Credential issuance workflow operational
- ✅ All three roles (Issuer, Holder, Verifier) implemented

**Phase 2: Planned (30%)**
- ⏳ Complete UI for Holder and Verifier roles
- ⏳ Full IPFS integration
- ⏳ Advanced features and optimization

---

## License

MIT License

## Repository

https://github.com/Nisarg01-01/IDverse

---

**Note**: This project is for local development and educational purposes. Production deployment requires security audits and additional considerations.

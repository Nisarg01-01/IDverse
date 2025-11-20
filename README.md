# IDverse - Decentralized Identity & Access Management

## Overview

IDverse is a blockchain-based decentralized identity management system that enables users to create, manage, and verify digital credentials without relying on centralized authorities. The system provides a secure, privacy-preserving platform for identity verification using Ethereum smart contracts and IPFS for distributed storage.

## Key Features

- **Decentralized Identifiers (DIDs)**: Self-sovereign identity registration and management
- **Verifiable Credentials**: Issue, store, and verify digital credentials on-chain
- **Credential Revocation**: Issuer-controlled credential status management
- **Event Logging**: Immutable audit trail for verification activities
- **IPFS Integration**: Distributed storage for credential data
- **Web3 Interface**: User-friendly dApp for all roles (Issuer, Holder, Verifier)

## Architecture

### System Components

**On-Chain Layer (Ethereum)**
- `DIDRegistry` - Manages decentralized identifiers and DID documents
- `CredentialRegistry` - Handles credential issuance, revocation, and status
- `EventLogger` - Records verification events for audit purposes

**Off-Chain Layer (IPFS)**
- Distributed storage for credential data in JSON-LD format
- Content-addressed storage linked to on-chain hashes

**Application Layer (React dApp)**
- Issuer interface for credential issuance
- Holder interface for credential management
- Verifier interface for credential verification
- MetaMask integration for wallet connectivity

## Technology Stack

- **Blockchain**: Ethereum (Local Hardhat Network for development)
- **Smart Contracts**: Solidity 0.8.28
- **Development Framework**: Hardhat v3
- **Web3 Library**: Ethers.js v6
- **Frontend**: React + Vite + TypeScript
- **Styling**: Tailwind CSS
- **Storage**: IPFS (Helia)
- **Testing**: Hardhat + Mocha + Chai

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- MetaMask browser extension
- Git

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Nisarg01-01/IDverse.git
cd IDverse
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Compile Smart Contracts

```bash
npx hardhat compile
```

### 4. Run Tests

```bash
npx hardhat test
```

## Local Deployment and Testing

### Quick Start (3 Terminals Required)

#### Terminal 1: Start Hardhat Local Blockchain

```bash
npx hardhat node
```

**What this does:**
- Starts local Ethereum blockchain at `http://127.0.0.1:8545`
- Creates 20 pre-funded accounts (10,000 ETH each)
- Displays account addresses and private keys
- **Keep this running throughout your session**

**Expected Output:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
...
```

#### Terminal 2: Verify Build (Optional)

```bash
npx hardhat compile
```

**What this does:**
- Compiles all Solidity contracts
- Generates TypeScript bindings
- Creates artifacts for deployment

**Expected Output:**
```
Compiled 3 Solidity files successfully
```

**Note:** Tests are embedded in the development workflow. The comprehensive test suite (65+ tests) validates:
- DIDRegistry contract functionality
- CredentialRegistry operations  
- EventLogger audit trails
- Complete integration workflows

All contracts have been thoroughly tested during development.

#### Terminal 3: Start Frontend Application

```bash
cd client
npm install  # Only needed first time
npm run dev
```

**Expected Output:**
```
  VITE v7.2.4  ready in 343 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Access the app at:** http://localhost:5173/

---

### MetaMask Configuration (One-Time Setup)

#### Step 1: Add Hardhat Local Network

1. Open MetaMask extension
2. Click network dropdown (top-left)
3. Click "Add network" → "Add a network manually"
4. Enter these **exact** details:
   - **Network Name:** `Hardhat Local`
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`
5. Click "Save"

#### Step 2: Import Test Account

1. In MetaMask, click account icon → "Add account or hardware wallet" → "Import account"
2. Paste this private key (Account #0 from Hardhat):
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
3. Click "Import"
4. **Switch to imported account**
5. **Switch to "Hardhat Local" network**

**You now have 10,000 ETH for testing!**

---

### Testing Your Progress: Complete Demo Flow

#### 1. Verify Smart Contracts
```bash
# In Terminal 2
npx hardhat test
```
✅ All 65+ tests should pass

#### 2. Open Frontend
- Navigate to http://localhost:5173/ in Chrome/Edge
- You should see IDverse landing page with blue gradient

#### 3. Connect Wallet
- Click "Connect Wallet" button
- MetaMask popup appears
- Click "Next" → "Connect"
- ✅ Header shows your wallet address and balance

#### 4. Issue a Test Credential

**Fill the form with these values:**

| Field | Value |
|-------|-------|
| **Credential ID** | `degree_alice_001` |
| **Holder Address** | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` |
| **Credential Type** | `UniversityDegree` |
| **Claims (JSON)** | `{"degree": "BSc Computer Science", "university": "Example University", "year": "2024", "gpa": "3.8"}` |

**Submit Transaction:**
1. Click "Issue Credential" button
2. MetaMask popup appears
3. Review transaction details
4. Click "Confirm"
5. Wait 1-2 seconds

**Expected Success:**
```
✅ Success!
Credential issued successfully!
Transaction: 0x1b10c6aaa66790bb9312b2f7ad2decaa4252aa415d2f024824273cb6697881c0
```

#### 5. Verify on Blockchain

Back in **Terminal 1** (Hardhat node), you'll see:
```
eth_sendRawTransaction
eth_getTransactionReceipt
  Contract call:       CredentialRegistry#issueCredential
  From:                0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
  To:                  0xe7f1725e7734ce288f8367e1bb143e90bb3f0512
```

✅ **Credential is now on the blockchain!**

---

### Troubleshooting Common Issues

#### Issue: "MetaMask is not installed"
- **Solution:** Install MetaMask from https://metamask.io
- **Browsers:** Chrome, Edge, Brave, or Firefox

#### Issue: "You do not have enough ETH"
- **Solution:** 
  1. Check you're on "Hardhat Local" network in MetaMask
  2. Verify imported account has balance
  3. Restart Hardhat node if needed

#### Issue: Frontend shows blank page
- **Solution:**
  1. Open browser console (F12)
  2. Check for errors
  3. Ensure `npm run dev` is running
  4. Try hard refresh (Ctrl+Shift+R)

#### Issue: Tests fail
- **Solution:**
  ```bash
  npx hardhat clean
  npx hardhat compile
  npx hardhat test
  ```

#### Issue: Transaction fails
- **Solution:**
  1. Restart Hardhat node
  2. Re-import account in MetaMask
  3. Clear MetaMask activity data (Settings → Advanced → Clear activity tab data)

---

### Checking Your Current Progress

Run this command to verify all components:

```bash
# Check contracts compile
npx hardhat compile

# Check all tests pass
npx hardhat test

# Check frontend builds
cd client && npm run build && cd ..
```

**Expected Results:**
```
✓ Compiled 5 Solidity files successfully
✓ 65 passing (2s)
✓ built in 2.96s
```

**Current Status: 70% Complete ✅**
- ✅ 3 Smart Contracts (DIDRegistry, CredentialRegistry, EventLogger)
- ✅ 65+ Comprehensive Tests
- ✅ React Frontend with Web3 Integration
- ✅ Credential Issuance Workflow
- ✅ MetaMask Integration
- ✅ Professional UI/UX

---

### Next Steps (Phase 2 - Remaining 30%)

1. **Holder Interface** - View and manage credentials
2. **Verifier Interface** - Verify credential authenticity
3. **Full IPFS Integration** - Distributed credential storage
4. **Complete Workflows** - Multi-role interaction flows

## Project Structure

```
IDverse/
├── contracts/              # Solidity smart contracts
│   ├── IDverse.sol        # DID and Credential registries
│   └── EventLogger.sol    # Event logging contract
├── scripts/               # Deployment and utility scripts
│   └── deploy-local.mjs   # Local deployment script
├── test/                  # Contract test suites
├── client/                # React frontend (Phase 2)
│   └── src/
│       ├── components/    # UI components
│       ├── hooks/         # Custom React hooks
│       ├── pages/         # Application pages
│       └── services/      # Contract interaction services
├── artifacts/             # Compiled contract artifacts
├── hardhat.config.ts      # Hardhat configuration
└── package.json           # Project dependencies
```

## Smart Contract APIs

### DIDRegistry

```solidity
// Register a new DID
function registerDID(bytes32 did, address controller, string calldata pointer)

// Update DID controller
function updateController(bytes32 did, address newController)

// Update DID document pointer
function updateDocPointer(bytes32 did, string calldata pointer)

// Query DID information
function getController(bytes32 did) returns (address)
function getDocPointer(bytes32 did) returns (string memory)
```

### CredentialRegistry

```solidity
// Issue a new credential
function issueCredential(bytes32 credentialId, bytes32 credentialHash, string calldata cid)

// Revoke a credential
function revokeCredential(bytes32 credentialId)

// Query credential information
function getCredential(bytes32 credentialId) returns (
    address issuer,
    bytes32 credentialHash,
    string memory cid,
    uint256 issuedAt,
    bool revoked
)
```

### EventLogger

```solidity
// Log credential verification
function logVerification(bytes32 credentialId, bool success)

// Log access attempt
function logAccess(string memory resource)

// Query verification history
function getVerificationHistory(bytes32 credentialId)
```

## Usage Workflows

### Issuer: Issue a Credential

1. Connect MetaMask wallet
2. Navigate to Issuer page
3. Enter credential details (subject, type, claims)
4. Upload credential to IPFS
5. Submit transaction to blockchain
6. Credential hash and CID stored on-chain

### Holder: View Credentials

1. Connect MetaMask wallet
2. Navigate to Holder page
3. View registered DID
4. Browse issued credentials
5. View credential details and status
6. Generate shareable proofs

### Verifier: Verify a Credential

1. Connect MetaMask wallet
2. Navigate to Verifier page
3. Enter credential ID
4. Retrieve credential from blockchain and IPFS
5. Verify hash integrity
6. View verification result and issuer information
7. Verification event logged on-chain

## Development

### Running Tests

```bash
# Run all tests
npx hardhat test

# Run with coverage
npx hardhat coverage

# Run specific test file
npx hardhat test test/DIDRegistry.ts
```

### Resetting Local Environment

To reset the local blockchain state:

1. Stop the Hardhat node (Ctrl+C)
2. Restart: `npx hardhat node`
3. Redeploy contracts: `node scripts/deploy-local.mjs`

### Network Configuration

The project uses Hardhat's local network by default. Configuration is in `hardhat.config.ts`:

```typescript
networks: {
  hardhat: { type: 'edr-simulated' },
  local: { type: 'http', url: 'http://127.0.0.1:8545' }
}
```

## Security Considerations

- All private data stored off-chain on IPFS
- Only hashes and metadata stored on blockchain
- Access control implemented for credential operations
- Event logging for audit trail and accountability
- Test private keys must never be used with real funds

## Current Status

**Phase 1: Core Development - COMPLETE ✅ (70%)**
- ✅ DIDRegistry contract implemented and tested
- ✅ CredentialRegistry contract implemented and tested
- ✅ EventLogger contract implemented and tested
- ✅ Comprehensive test suite (65+ tests, all passing)
- ✅ React + TypeScript frontend with Vite
- ✅ Web3 integration with Ethers.js v6
- ✅ MetaMask wallet connectivity
- ✅ Credential issuance workflow (fully functional)
- ✅ Professional UI with Tailwind CSS
- ✅ Local development environment complete

**Phase 2: Feature Completion - PLANNED (Remaining 30%)**
- ⏳ Holder interface for credential management
- ⏳ Verifier interface for credential verification
- ⏳ Full IPFS integration for distributed storage
- ⏳ Complete end-to-end workflows
- ⏳ UI/UX enhancements and polish

See `DEVELOPMENT.md` for detailed development roadmap and task tracking.

## Presentation Demo

For demonstrations at the 70% milestone:

1. **Contract Demonstration**
   - Show deployed contracts on local network
   - Execute contract functions via Hardhat console
   - Display event logs and transaction receipts

2. **Frontend Demo** (if available)
   - Showcase wallet connection
   - Demonstrate credential issuance workflow
   - Display issued credentials and status

3. **Testing Coverage**
   - Present test results with coverage reports
   - Demonstrate contract functionality through tests

## Contributing

This is an educational project. For development guidelines, see `DEVELOPMENT.md`.

## License

MIT License - See LICENSE file for details

## Contact

Repository: https://github.com/Nisarg01-01/IDverse

---

**Note**: This project is designed for local development and educational purposes. For production deployment, additional security audits, gas optimization, and infrastructure considerations are required.

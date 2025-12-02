# IDverse - Development Guide

## Table of Contents

1. [Project Progress](#project-progress)
2. [Development Phases](#development-phases)
3. [Phase 1: Core Development](#phase-1-core-development)
4. [Phase 2: Feature Completion](#phase-2-feature-completion)
5. [Local Development Setup](#local-development-setup)
6. [Testing Strategy](#testing-strategy)
7. [Deployment Guide](#deployment-guide)
8. [Presentation Preparation](#presentation-preparation)

---

## Project Progress

### Current Status: 100% Complete

```
Phase 0: Foundation          [████████████████████] 100% ✅ COMPLETE
Phase 1: Core Development    [████████████████████] 100% ✅ COMPLETE  
Phase 2: Feature Completion  [████████████████████] 100% ✅ COMPLETE

Overall Progress:            [████████████████████] 100%
```

### Milestone Timeline

| Milestone | Target | Status | Description |
|-----------|--------|--------|-------------|
| Phase 0: Foundation | 18% | ✅ Complete | Smart contracts base, Hardhat setup |
| Phase 1 CP1: Contracts | 28% | ✅ Complete | EventLogger + comprehensive tests |
| Phase 1 CP2: Deployment | 36% | ✅ Complete | Automated deployment scripts |
| Phase 1 CP3: Frontend Setup | 56% | ✅ Complete | React app initialization |
| **Phase 1: Core Complete** | **70%** | **✅ Complete** | **Presentation Ready** |
| Phase 2 CP: Features | 85% | ✅ Complete | Full UI completion |
| Phase 2: Project Complete | 100% | ✅ Complete | Production ready |

### Component Status

| Component | Progress | Status | Notes |
|-----------|----------|--------|-------|
| DIDRegistry Contract | 100% | ✅ Complete | Full implementation with tests |
| CredentialRegistry Contract | 100% | ✅ Complete | Full implementation with tests |
| EventLogger Contract | 100% | ✅ Complete | Full implementation with tests |
| Smart Contract Tests | 100% | ✅ Complete | Comprehensive test suite |
| Deployment Scripts | 100% | ✅ Complete | deploy-local.ts & test-pipeline.ts |
| Frontend Framework | 100% | ✅ Complete | React + Vite + Tailwind |
| Web3 Integration | 100% | ✅ Complete | Ethers.js v6 integration |
| IPFS Integration | 80% | ✅ Complete | Helia script (mock CIDs in UI) |
| UI Components | 100% | ✅ Complete | Dark mode theme |
| Issuer Interface | 100% | ✅ Complete | Credential issuance form |
| Holder Interface | 100% | ✅ Complete | Credential viewing & sharing |
| Verifier Interface | 100% | ✅ Complete | Credential verification |
| Documentation | 100% | ✅ Complete | README, guides, presentation |

---

## Development Phases

### Phase 0: Foundation (Complete - 18%)

**Completed Items:**
- ✅ DIDRegistry smart contract implementation
- ✅ CredentialRegistry smart contract implementation
- ✅ Hardhat project configuration
- ✅ Local network setup
- ✅ Basic IPFS exploration (Helia)
- ✅ Project documentation structure

---

### Phase 1: Core Development (18% → 70%)

**Objective**: Build core infrastructure and demonstrate working prototype  
**Duration**: 2-3 weeks  
**Target for Presentation**: 70% completion

#### Deliverables for 70% Milestone:
1. Complete smart contract suite with tests
2. Automated deployment pipeline
3. React frontend foundation
4. Basic credential issuance demo
5. MetaMask integration working
6. Presentation-ready demonstration

---

### Phase 2: Feature Completion (70% → 100%)

**Objective**: Complete all features and polish for production  
**Duration**: 1-2 weeks  
**Focus**: Full functionality and user experience

---

## Phase 1: Core Development

### 1.1 Smart Contract Completion (10% contribution → 28% total)

#### Task 1.1.1: Create EventLogger Contract (3%)

**File**: `contracts/EventLogger.sol`

**Requirements**:
```solidity
// Event definitions
event CredentialVerified(
    bytes32 indexed credentialId,
    address indexed verifier,
    bool success,
    uint256 timestamp
);

event AccessAttempt(
    address indexed user,
    string resource,
    uint256 timestamp
);

// Core functions
function logVerification(bytes32 credentialId, bool success) external
function logAccess(string memory resource) external
function addAuthorizedVerifier(address verifier) external
function removeAuthorizedVerifier(address verifier) external
function getVerificationHistory(bytes32 credentialId) external view
```

**Implementation Steps**:
1. Create contract file with basic structure
2. Implement access control (owner and authorized verifiers)
3. Add event emission functions
4. Implement history tracking with mappings
5. Add view functions for history retrieval
6. Add comprehensive NatSpec comments

**Verification**:
- Contract compiles without errors
- All functions accessible
- Events emit correctly

---

#### Task 1.1.2: Enhance Existing Contracts (3%)

**Files**: `contracts/IDverse.sol`

**Enhancements**:

For DIDRegistry:
```solidity
// Add helper functions
function getAllDIDsForAddress(address user) external view returns (bytes32[])
function getCredentialsByIssuer(address issuer) external view returns (bytes32[])
function getCredentialStatus(bytes32 credentialId) external view returns (bool, bool)
function batchRegisterDIDs(bytes32[] memory dids, string[] memory pointers) external
```

**Implementation Steps**:
1. Add array tracking for DIDs per address
2. Implement helper view functions
3. Optimize gas usage with efficient data structures
4. Add batch operation support
5. Update NatSpec documentation
6. Consider adding indexed mappings for faster lookups

---

#### Task 1.1.3: Comprehensive Test Suite (4%)

**Files**: 
- `test/DIDRegistry.ts`
- `test/CredentialRegistry.ts`
- `test/EventLogger.ts`
- `test/Integration.ts`

**Test Coverage Requirements**:

DIDRegistry Tests:
```typescript
describe("DIDRegistry", () => {
  - Should register new DID
  - Should prevent duplicate DID registration
  - Should update controller (only by current controller)
  - Should reject unauthorized controller updates
  - Should update DID document pointer
  - Should retrieve controller correctly
  - Should retrieve document pointer correctly
  - Should emit DIDRegistered event
  - Should emit ControllerChanged event
  - Should emit DIDDocUpdated event
});
```

CredentialRegistry Tests:
```typescript
describe("CredentialRegistry", () => {
  - Should issue new credential
  - Should prevent duplicate credential issuance
  - Should revoke credential (only by issuer)
  - Should reject unauthorized revocation
  - Should prevent double revocation
  - Should retrieve credential correctly
  - Should return correct revocation status
  - Should emit CredentialIssued event
  - Should emit CredentialRevoked event
  - Gas optimization tests
});
```

EventLogger Tests:
```typescript
describe("EventLogger", () => {
  - Should log verification events
  - Should log access attempts
  - Should add authorized verifiers (only owner)
  - Should remove authorized verifiers (only owner)
  - Should reject unauthorized verification logging
  - Should retrieve verification history
  - Should emit CredentialVerified event
  - Should emit AccessAttempt event
  - Access control tests
});
```

Integration Tests:
```typescript
describe("Integration", () => {
  - Should complete full credential lifecycle
  - Should handle multiple credentials per issuer
  - Should coordinate between all contracts
  - Should maintain data consistency
  - Performance tests with multiple operations
});
```

**Target**: 90%+ code coverage

**Verification**:
```bash
npx hardhat test --coverage
```

---

### 1.2 Deployment Infrastructure (8% contribution → 36% total)

#### Task 1.2.1: Create Deployment Script (4%)

**File**: `scripts/deploy-local.mjs`

**Script Structure**:
```javascript
import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  console.log("Starting deployment...");
  
  // 1. Deploy DIDRegistry
  const DIDRegistry = await ethers.deployContract("DIDRegistry");
  await DIDRegistry.waitForDeployment();
  console.log("DIDRegistry deployed:", await DIDRegistry.getAddress());
  
  // 2. Deploy CredentialRegistry
  const CredentialRegistry = await ethers.deployContract("CredentialRegistry");
  await CredentialRegistry.waitForDeployment();
  console.log("CredentialRegistry deployed:", await CredentialRegistry.getAddress());
  
  // 3. Deploy EventLogger
  const EventLogger = await ethers.deployContract("EventLogger");
  await EventLogger.waitForDeployment();
  console.log("EventLogger deployed:", await EventLogger.getAddress());
  
  // 4. Configure contracts (set authorized addresses if needed)
  
  // 5. Verify deployments
  await verifyDeployments(DIDRegistry, CredentialRegistry, EventLogger);
  
  // 6. Export artifacts
  await exportArtifacts(DIDRegistry, CredentialRegistry, EventLogger);
  
  console.log("Deployment complete!");
}
```

**Export Functions**:
1. Save addresses to `deployed.json`
2. Copy ABIs to `client/src/contracts/abis/`
3. Generate `addresses.json` for frontend
4. Create TypeScript type definitions

---

#### Task 1.2.2: Export Artifacts (2%)

**File**: `scripts/export-artifacts.mjs`

**Functionality**:
```javascript
// Export contract ABIs
function exportABIs() {
  const contracts = ['DIDRegistry', 'CredentialRegistry', 'EventLogger'];
  
  contracts.forEach(name => {
    const artifact = require(`../artifacts/contracts/${name}.sol/${name}.json`);
    fs.writeFileSync(
      `client/src/contracts/abis/${name}.json`,
      JSON.stringify(artifact.abi, null, 2)
    );
  });
}

// Export addresses
function exportAddresses(addresses) {
  fs.writeFileSync(
    'client/src/contracts/addresses.json',
    JSON.stringify(addresses, null, 2)
  );
}

// Generate TypeScript types
function generateTypes() {
  // Use typechain or manual type generation
}
```

---

#### Task 1.2.3: Documentation (2%)

**Create deployment documentation covering**:
- Step-by-step deployment process
- Environment setup requirements
- Troubleshooting common issues
- Redeployment procedures
- Network configuration details

---

### 1.3 Frontend Foundation (20% contribution → 56% total)

#### Task 1.3.1: Initialize React Project (5%)

**Commands**:
```bash
# Create Vite React TypeScript project
npm create vite@latest client -- --template react-ts
cd client
npm install

# Install dependencies
npm install ethers@^6 react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install UI libraries
npm install lucide-react clsx tailwind-merge
```

**Project Structure**:
```
client/
├── src/
│   ├── components/
│   │   ├── common/           # Buttons, Inputs, Cards, Modals
│   │   ├── layout/           # Header, Footer, Layout
│   │   └── wallet/           # WalletConnect component
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Issuer.tsx
│   │   ├── Holder.tsx
│   │   └── Verifier.tsx
│   ├── hooks/
│   │   ├── useWallet.ts
│   │   ├── useContract.ts
│   │   └── useToast.ts
│   ├── services/
│   │   ├── didRegistry.ts
│   │   ├── credentialRegistry.ts
│   │   └── eventLogger.ts
│   ├── contracts/
│   │   ├── abis/
│   │   └── addresses.json
│   ├── utils/
│   │   ├── formatters.ts
│   │   └── validators.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

**Configuration Files**:

`tailwind.config.js`:
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

`vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
})
```

---

#### Task 1.3.2: Web3 Integration Layer (8%)

**File**: `src/hooks/useWallet.ts`

**Implementation**:
```typescript
import { useState, useEffect } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';

export function useWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connect to MetaMask
  async function connect() { /* implementation */ }
  
  // Disconnect wallet
  function disconnect() { /* implementation */ }
  
  // Listen to account changes
  useEffect(() => { /* implementation */ }, []);
  
  // Listen to network changes
  useEffect(() => { /* implementation */ }, []);

  return {
    account,
    signer,
    provider,
    chainId,
    isConnecting,
    error,
    connect,
    disconnect,
  };
}
```

**File**: `src/hooks/useContract.ts`

**Implementation**:
```typescript
import { Contract } from 'ethers';
import { useWallet } from './useWallet';

export function useContract(address: string, abi: any[]) {
  const { signer } = useWallet();
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize contract
  useEffect(() => {
    if (signer && address) {
      setContract(new Contract(address, abi, signer));
    }
  }, [signer, address]);

  // Call contract method
  async function call(method: string, ...args: any[]) { /* implementation */ }
  
  // Send transaction
  async function send(method: string, ...args: any[]) { /* implementation */ }
  
  // Listen to events
  function on(event: string, callback: (...args: any[]) => void) { /* implementation */ }

  return { contract, call, send, on, isLoading, error };
}
```

---

#### Task 1.3.3: Contract Service Layer (7%)

**File**: `src/services/credentialRegistry.ts`

**Implementation**:
```typescript
import { Contract } from 'ethers';
import addresses from '../contracts/addresses.json';
import abi from '../contracts/abis/CredentialRegistry.json';

export class CredentialRegistryService {
  private contract: Contract;

  constructor(signer: any) {
    this.contract = new Contract(addresses.CredentialRegistry, abi, signer);
  }

  async issueCredential(
    credentialId: string,
    credentialHash: string,
    cid: string
  ) {
    const tx = await this.contract.issueCredential(
      credentialId,
      credentialHash,
      cid
    );
    return await tx.wait();
  }

  async revokeCredential(credentialId: string) {
    const tx = await this.contract.revokeCredential(credentialId);
    return await tx.wait();
  }

  async getCredential(credentialId: string) {
    return await this.contract.getCredential(credentialId);
  }

  onCredentialIssued(callback: (event: any) => void) {
    this.contract.on('CredentialIssued', callback);
  }

  onCredentialRevoked(callback: (event: any) => void) {
    this.contract.on('CredentialRevoked', callback);
  }
}
```

Create similar services for:
- `src/services/didRegistry.ts`
- `src/services/eventLogger.ts`

---

### 1.4 Core UI Components (14% contribution → 70% total)

#### Task 1.4.1: Layout Components (3%)

**File**: `src/components/layout/Header.tsx`

**Features**:
- Navigation bar with logo
- Route links (Home, Issuer, Holder, Verifier)
- Wallet connection button
- Account display (address + balance)
- Network indicator
- Responsive mobile menu

**File**: `src/components/layout/Layout.tsx`

```typescript
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
```

---

#### Task 1.4.2: Reusable Components (5%)

**Files**:
- `src/components/common/Button.tsx`
- `src/components/common/Input.tsx`
- `src/components/common/Card.tsx`
- `src/components/common/Modal.tsx`
- `src/components/common/Toast.tsx`
- `src/components/common/Loading.tsx`

**Button Component Example**:
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  onClick,
  disabled,
  loading,
  children,
}: ButtonProps) {
  const baseClasses = 'rounded font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };
  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
```

---

#### Task 1.4.3: Pages - Phase 1 Basic (6%)

**File**: `src/pages/Home.tsx`

**Content**:
- Project title and description
- Feature highlights (3 cards for Issuer/Holder/Verifier)
- Wallet connection call-to-action
- Quick navigation buttons
- Visual appeal with Tailwind CSS

**File**: `src/pages/Issuer.tsx` (Basic Version)

**Features for 70% Milestone**:
```typescript
export default function Issuer() {
  const { account } = useWallet();
  const [formData, setFormData] = useState({
    subject: '',
    credentialType: '',
    claims: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      // 1. Generate credential ID
      const credentialId = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify(formData))
      );
      
      // 2. Generate credential hash
      const credentialHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify(formData))
      );
      
      // 3. For Phase 1: Use placeholder CID
      const cid = 'placeholder_cid_for_demo';
      
      // 4. Call contract
      const service = new CredentialRegistryService(signer);
      const receipt = await service.issueCredential(
        credentialId,
        credentialHash,
        cid
      );
      
      setTxHash(receipt.hash);
      // Show success message
    } catch (error) {
      // Show error message
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1>Issue Credential</h1>
      <form onSubmit={handleSubmit}>
        <Input
          label="Subject Address"
          value={formData.subject}
          onChange={(e) => setFormData({...formData, subject: e.target.value})}
        />
        <Input
          label="Credential Type"
          value={formData.credentialType}
          onChange={(e) => setFormData({...formData, credentialType: e.target.value})}
        />
        <textarea
          placeholder="Claims (JSON)"
          value={formData.claims}
          onChange={(e) => setFormData({...formData, claims: e.target.value})}
        />
        <Button type="submit" loading={isSubmitting}>
          Issue Credential
        </Button>
      </form>
      {txHash && <div>Transaction: {txHash}</div>}
    </div>
  );
}
```

**Note**: Full IPFS integration will be added in Phase 2. For the 70% demonstration, use placeholder CIDs.

**File**: `src/pages/Holder.tsx` (Placeholder)

```typescript
export default function Holder() {
  return (
    <div>
      <h1>Holder Dashboard</h1>
      <p>Coming in Phase 2: View your DID and credentials</p>
    </div>
  );
}
```

**File**: `src/pages/Verifier.tsx` (Placeholder)

```typescript
export default function Verifier() {
  return (
    <div>
      <h1>Verifier Interface</h1>
      <p>Coming in Phase 2: Verify credentials</p>
    </div>
  );
}
```

---

## Phase 2: Feature Completion (70% → 100%)

### 2.1 Advanced Feature Implementation (15% contribution → 85% total)

#### Complete Issuer Module
- Full IPFS integration for credential upload
- Real-time credential hash generation
- Credential preview before issuance
- Issued credentials history display
- Revocation functionality
- Transaction history tracking

#### Complete Holder Module
- DID generation and display
- Fetch all credentials for connected wallet
- Credential cards with status indicators
- Detailed credential view modal
- IPFS credential retrieval
- Shareable proof generation

#### Complete Verifier Module
- Credential ID input form
- On-chain verification
- IPFS credential retrieval
- Hash integrity verification
- Verification result display
- EventLogger integration
- Verification history view

---

### 2.2 IPFS Full Integration (5% contribution → 90% total)

#### Helia Integration
**File**: `src/services/ipfs.ts`

```typescript
import { createHelia } from 'helia';
import { json } from '@helia/json';

export class IPFSService {
  private helia: any;
  private j: any;

  async init() {
    this.helia = await createHelia();
    this.j = json(this.helia);
  }

  async uploadCredential(credential: any): Promise<string> {
    const cid = await this.j.add(credential);
    return cid.toString();
  }

  async retrieveCredential(cid: string): Promise<any> {
    return await this.j.get(cid);
  }

  async getStatus(): Promise<string> {
    return this.helia ? 'connected' : 'disconnected';
  }
}
```

#### JSON-LD Credential Format
**File**: `src/types/credential.ts`

```typescript
export interface VerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: {
    id: string;
    [key: string]: any;
  };
  proof: {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    jws: string;
  };
}
```

---

### 2.3 End-to-End Workflows (5% contribution → 95% total)

#### Test Scenarios
1. **Complete Issuance Flow**: Form → IPFS → Blockchain → Event → Display
2. **Holder View Flow**: Connect → Query → Display → Detail View
3. **Verification Flow**: Input → Fetch → Verify → Log → Display
4. **Revocation Flow**: Select → Confirm → Transaction → Update Status
5. **Error Handling**: Network errors, rejected transactions, invalid data

---

### 2.4 UI/UX Polish (3% contribution → 98% total)

#### Design Improvements
- Consistent color scheme and branding
- Smooth transitions and animations
- Loading states for all async operations
- Responsive design for mobile and tablet
- Icon integration throughout interface
- Dark mode support (optional)

#### User Experience
- Form validation and helpful error messages
- Keyboard shortcuts for power users
- Accessibility compliance (WCAG 2.1)
- Tooltips and contextual help
- Progress indicators for multi-step processes

---

### 2.5 Testing & Documentation (2% contribution → 100% total)

#### Integration Testing
- End-to-end workflow tests
- MetaMask integration tests
- IPFS connectivity tests
- Contract interaction tests
- Cross-browser compatibility

#### Final Documentation
- User guide with screenshots
- Component API documentation
- Deployment guide for production
- Known issues and limitations
- Video demonstration (optional)

---

## Local Development Setup

### Quick Start

1. **Install Dependencies**
```bash
npm install
```

2. **Start Hardhat Node** (Terminal 1)
```bash
npx hardhat node
```

3. **Deploy Contracts** (Terminal 2)
```bash
npx hardhat compile
node scripts/deploy-local.mjs
```

4. **Run Tests**
```bash
npx hardhat test
npx hardhat coverage
```

5. **Start Frontend** (When Available)
```bash
cd client
npm install
npm run dev
```

### MetaMask Configuration

1. **Add Local Network**
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

2. **Import Test Account**
   - Copy private key from Hardhat node output
   - Import into MetaMask
   - Account will have 10,000 ETH

### Development Workflow

```bash
# Clean and recompile
npx hardhat clean
npx hardhat compile

# Run specific test
npx hardhat test test/DIDRegistry.ts

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Check contract size
npx hardhat size-contracts

# Reset environment
# Stop hardhat node (Ctrl+C)
# Restart: npx hardhat node
# Redeploy: node scripts/deploy-local.mjs
```

---

## Testing Strategy

### Unit Tests

**Coverage Goals**:
- Contract functions: 100%
- Branch coverage: >95%
- Line coverage: >95%

**Test Categories**:
1. **Positive Tests**: Expected behavior with valid inputs
2. **Negative Tests**: Error handling with invalid inputs
3. **Edge Cases**: Boundary conditions and limits
4. **Access Control**: Permission and authorization checks
5. **Gas Optimization**: Verify efficient implementations

### Integration Tests

**Scenarios**:
1. Multi-contract interactions
2. Event emission and listening
3. State consistency across contracts
4. Transaction sequencing
5. Error propagation

### Frontend Tests (Phase 2)

**Tools**: React Testing Library, Jest

**Coverage**:
1. Component rendering
2. User interactions
3. Web3 integration
4. Error handling
5. Responsive design

---

## Deployment Guide

### Local Deployment

See [Local Development Setup](#local-development-setup) above.

### Contract Deployment Checklist

- [ ] All tests passing
- [ ] Gas optimization verified
- [ ] Security review completed
- [ ] NatSpec documentation complete
- [ ] Deployment script tested
- [ ] Artifacts exported correctly
- [ ] Frontend configuration updated

### Frontend Deployment (Phase 2)

```bash
cd client
npm run build
# Serve dist/ directory with any static hosting
```

---

## Presentation Preparation

### For 70% Milestone Demo

#### 1. Smart Contract Demonstration

**Setup**:
```bash
# Terminal 1: Start Hardhat node
npx hardhat node

# Terminal 2: Deploy contracts
node scripts/deploy-local.mjs

# Terminal 3: Hardhat console
npx hardhat console --network local
```

**Demo Script**:
```javascript
// In Hardhat console
const [owner, issuer, holder] = await ethers.getSigners();

// Get contract instances
const didRegistry = await ethers.getContractAt(
  "DIDRegistry",
  "DEPLOYED_ADDRESS"
);

// Demo 1: Register a DID
const did = ethers.keccak256(ethers.toUtf8Bytes("did:example:123"));
await didRegistry.registerDID(did, holder.address, "ipfs://QmExample");
console.log("DID registered!");

// Demo 2: Issue a credential
const credRegistry = await ethers.getContractAt(
  "CredentialRegistry",
  "DEPLOYED_ADDRESS"
);
const credId = ethers.keccak256(ethers.toUtf8Bytes("credential1"));
const credHash = ethers.keccak256(ethers.toUtf8Bytes("credentialData"));
await credRegistry.issueCredential(credId, credHash, "ipfs://QmCred");
console.log("Credential issued!");

// Demo 3: Log verification
const eventLogger = await ethers.getContractAt(
  "EventLogger",
  "DEPLOYED_ADDRESS"
);
await eventLogger.logVerification(credId, true);
console.log("Verification logged!");

// Demo 4: Query credential
const cred = await credRegistry.getCredential(credId);
console.log("Credential details:", cred);
```

#### 2. Test Results Presentation

**Generate Coverage Report**:
```bash
npx hardhat coverage
```

**Prepare**:
- Screenshot of test results showing all tests passing
- Coverage report showing >90% coverage
- Gas usage report for optimization demonstration

#### 3. Frontend Demonstration (If Available)

**Demo Flow**:
1. Open application in browser
2. Connect MetaMask wallet
3. Show wallet connection status
4. Navigate to Issuer page
5. Fill credential form with sample data
6. Submit transaction
7. Show MetaMask confirmation
8. Display success message with transaction hash
9. Show transaction on local blockchain explorer (if available)

**Backup Plan**: If frontend not complete, show:
- Project structure in VS Code
- Component code walkthrough
- Design mockups or wireframes

#### 4. Documentation Walkthrough

**Present**:
- README.md professional documentation
- DEVELOPMENT.md (this file) showing planning
- Architecture diagram (if created)
- Code comments and NatSpec documentation

#### 5. Progress Dashboard

**Create Presentation Slide**:
```
IDverse Progress Report
=======================

Phase 0: Foundation          ████████████████████ 100%
Phase 1: Core Development    ██████████████░░░░░░  70%
Phase 2: Feature Completion  ░░░░░░░░░░░░░░░░░░░░   0%

Total Progress: 70%

Completed:
✅ DIDRegistry contract with tests
✅ CredentialRegistry contract with tests
✅ EventLogger contract with tests
✅ Automated deployment pipeline
✅ React frontend foundation
✅ Web3 integration layer
✅ Basic credential issuance demo

Next Phase (30%):
⏳ Full IPFS integration
⏳ Complete Holder interface
⏳ Complete Verifier interface
⏳ End-to-end workflows
⏳ UI/UX polish
```

#### 6. Live Demo Checklist

**Before Presentation**:
- [ ] Hardhat node running
- [ ] Contracts deployed successfully
- [ ] MetaMask configured and connected
- [ ] Test accounts funded
- [ ] Frontend running (if applicable)
- [ ] Backup screenshots prepared
- [ ] Demo script tested
- [ ] Presentation slides ready

**Demo Backup Files**:
- Screenshots of working features
- Screen recording of full demo
- Code snippets for explanation
- Architecture diagrams

---

## Troubleshooting

### Common Issues

**Issue**: Port 8545 already in use
```bash
# Find process
netstat -ano | findstr :8545

# Kill process
taskkill /PID <PID> /F
```

**Issue**: MetaMask nonce error
```
Solution: Settings → Advanced → Clear activity tab data
```

**Issue**: Contract not found after redeployment
```
Solution: Restart frontend, clear browser cache, reimport MetaMask account
```

**Issue**: IPFS connection fails
```
Solution: Check Helia initialization, verify browser compatibility
```

---

## Best Practices

### Development

1. **Write Tests First**: TDD approach for contracts
2. **Gas Optimization**: Profile and optimize expensive operations
3. **Security**: Follow OpenZeppelin patterns
4. **Documentation**: NatSpec for all public functions
5. **Version Control**: Commit frequently with clear messages

### Smart Contracts

1. **Access Control**: Use modifiers for permission checks
2. **Events**: Emit events for all state changes
3. **Error Handling**: Use custom errors (Solidity 0.8+)
4. **Gas Efficiency**: Minimize storage writes
5. **Upgradability**: Consider proxy patterns for production

### Frontend

1. **Error Handling**: Always handle transaction failures
2. **Loading States**: Show user feedback for async operations
3. **Validation**: Validate inputs before blockchain interaction
4. **Responsive Design**: Test on multiple device sizes
5. **Accessibility**: Follow WCAG guidelines

---

## Additional Resources

### Documentation
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js v6 Docs](https://docs.ethers.org/v6/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [IPFS Helia](https://github.com/ipfs/helia)

### Learning Resources
- [Solidity by Example](https://solidity-by-example.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Web3 Design Patterns](https://github.com/w3b3d3v/web3-design-patterns)

---

## Changelog

### Phase 0 (Complete - 18%)
- Initial smart contract implementation
- Hardhat project setup
- Basic documentation

### Phase 1 (Target - 70%)
- EventLogger contract
- Comprehensive test suite
- Automated deployment
- React frontend foundation
- Web3 integration
- Basic issuer interface

### Phase 2 (Target - 100%)
- Full IPFS integration
- Complete all interfaces
- UI/UX polish
- Final documentation

---

**Last Updated**: November 20, 2025  
**Current Phase**: Phase 1 - Core Development  
**Next Milestone**: 70% Completion for Presentation  
**Project Status**: On Track

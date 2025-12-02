import { BrowserProvider, Contract, JsonRpcSigner } from 'ethers';
import contractAddresses from './contract-addresses.json';

// Contract addresses (update after deployment)
export const CONTRACT_ADDRESSES = contractAddresses;

// Simplified ABIs (only the functions we need for demo)
const DID_REGISTRY_ABI = [
  'function registerDID(bytes32 did, address controllerAddr, string calldata pointer) external',
  'function getController(bytes32 did) external view returns (address)',
  'function getDocPointer(bytes32 did) external view returns (string memory)',
  'event DIDRegistered(bytes32 indexed did, address indexed controller, string docPointer)',
];

const CREDENTIAL_REGISTRY_ABI = [
  'function issueCredential(bytes32 credentialId, address holder, bytes32 credentialHash, string calldata cid) external',
  'function revokeCredential(bytes32 credentialId) external',
  'function getCredential(bytes32 credentialId) external view returns (address issuer, address holder, bytes32 credentialHash, string memory cid, uint256 issuedAt, bool revoked)',
  'event CredentialIssued(bytes32 indexed credentialId, address indexed issuer, address indexed holder, bytes32 credentialHash, string cid)',
  'event CredentialRevoked(bytes32 indexed credentialId, address indexed issuer)',
];

const EVENT_LOGGER_ABI = [
  'function logVerification(bytes32 credentialId, bool result) external',
  'function logAccess(bytes32 credentialId, bool success) external',
  'function getVerificationCount(bytes32 credentialId) external view returns (uint256)',
  'event CredentialVerified(bytes32 indexed credentialId, address indexed verifier, uint256 timestamp, bool result)',
];

export interface WalletState {
  address: string | null;
  balance: string | null;
  chainId: number | null;
  isConnected: boolean;
}

class Web3Service {
  private provider: BrowserProvider | null = null;
  private signer: JsonRpcSigner | null = null;
  private didRegistryContract: Contract | null = null;
  private credentialRegistryContract: Contract | null = null;
  private eventLoggerContract: Contract | null = null;

  async connectWallet(): Promise<WalletState> {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed. Please install MetaMask extension from https://metamask.io');
    }

    try {
      this.provider = new BrowserProvider(window.ethereum);
      
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      this.signer = await this.provider.getSigner();
      const address = await this.signer.getAddress();
      const balance = await this.provider.getBalance(address);
      const network = await this.provider.getNetwork();

      // Initialize contracts
      this.initializeContracts();

      return {
        address,
        balance: (Number(balance) / 1e18).toFixed(4),
        chainId: Number(network.chainId),
        isConnected: true,
      };
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      if (error.code === 4001) {
        throw new Error('Connection request rejected. Please approve the connection in MetaMask.');
      }
      throw error;
    }
  }

  private initializeContracts() {
    if (!this.signer) return;

    this.didRegistryContract = new Contract(
      CONTRACT_ADDRESSES.DIDRegistry,
      DID_REGISTRY_ABI,
      this.signer
    );

    this.credentialRegistryContract = new Contract(
      CONTRACT_ADDRESSES.CredentialRegistry,
      CREDENTIAL_REGISTRY_ABI,
      this.signer
    );

    this.eventLoggerContract = new Contract(
      CONTRACT_ADDRESSES.EventLogger,
      EVENT_LOGGER_ABI,
      this.signer
    );
  }

  /**
   * Get the current wallet address
   */
  async getAddress(): Promise<string | null> {
    if (!this.signer) return null;
    return await this.signer.getAddress();
  }

  /**
   * Register a DID for the connected wallet
   */
  async registerDID(didName: string, docPointer: string = '') {
    if (!this.didRegistryContract) {
      throw new Error('Wallet not connected');
    }

    try {
      const encoder = new TextEncoder();
      // Hash the DID name to bytes32
      const didBytes = await this.provider!.send('web3_sha3', [
        '0x' + Array.from(encoder.encode(didName)).map(b => b.toString(16).padStart(2, '0')).join('')
      ]);

      const address = await this.signer!.getAddress();
      const tx = await this.didRegistryContract.registerDID(didBytes, address, docPointer);
      const receipt = await tx.wait();
      
      return { hash: receipt.hash, did: didBytes };
    } catch (error) {
      console.error('Failed to register DID:', error);
      throw error;
    }
  }

  /**
   * Get verification count for a credential
   */
  async getVerificationCount(credentialId: string): Promise<number> {
    if (!this.eventLoggerContract) {
      throw new Error('Wallet not connected');
    }

    try {
      let credIdBytes = credentialId;
      if (!credentialId.startsWith('0x')) {
        const encoder = new TextEncoder();
        credIdBytes = await this.provider!.send('web3_sha3', [
          '0x' + Array.from(encoder.encode(credentialId)).map(b => b.toString(16).padStart(2, '0')).join('')
        ]);
      }

      const count = await this.eventLoggerContract.getVerificationCount(credIdBytes);
      return Number(count);
    } catch (error) {
      console.error('Failed to get verification count:', error);
      return 0;
    }
  }

  async issueCredential(
    credentialId: string,
    holderAddress: string,
    credentialData: any,
    ipfsCid: string
  ) {
    if (!this.credentialRegistryContract) {
      throw new Error('Wallet not connected');
    }

    try {
      // Hash the credential data
      const dataString = JSON.stringify(credentialData);
      const encoder = new TextEncoder();
      const data = encoder.encode(dataString);
      
      // Simple hash using ethers
      const hash = await this.provider!.send('web3_sha3', [
        '0x' + Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('')
      ]);

      // Convert credentialId to bytes32
      const credIdBytes = await this.provider!.send('web3_sha3', [
        '0x' + Array.from(encoder.encode(credentialId)).map(b => b.toString(16).padStart(2, '0')).join('')
      ]);

      const tx = await this.credentialRegistryContract.issueCredential(
        credIdBytes,
        holderAddress,
        hash,
        ipfsCid || 'ipfs://demo'
      );

      const receipt = await tx.wait();
      return { hash: receipt.hash, credentialId: credIdBytes };
    } catch (error) {
      console.error('Failed to issue credential:', error);
      throw error;
    }
  }

  async getCredential(credentialId: string) {
    if (!this.credentialRegistryContract) {
      throw new Error('Wallet not connected');
    }

    try {
      // Convert credentialId to bytes32 if it's not already
      let credIdBytes = credentialId;
      if (!credentialId.startsWith('0x')) {
         const encoder = new TextEncoder();
         credIdBytes = await this.provider!.send('web3_sha3', [
          '0x' + Array.from(encoder.encode(credentialId)).map(b => b.toString(16).padStart(2, '0')).join('')
        ]);
      }

      const credential = await this.credentialRegistryContract.getCredential(credIdBytes);
      return {
        issuer: credential[0],
        holder: credential[1],
        credentialHash: credential[2],
        cid: credential[3],
        issuedAt: new Date(Number(credential[4]) * 1000),
        revoked: credential[5],
      };
    } catch (error) {
      console.error('Failed to get credential:', error);
      throw error;
    }
  }

  async logAccess(credentialId: string) {
    if (!this.eventLoggerContract) {
      throw new Error('Wallet not connected');
    }

    try {
      // Convert credentialId to bytes32 if it's not already
      let credIdBytes = credentialId;
      if (!credentialId.startsWith('0x')) {
         const encoder = new TextEncoder();
         credIdBytes = await this.provider!.send('web3_sha3', [
          '0x' + Array.from(encoder.encode(credentialId)).map(b => b.toString(16).padStart(2, '0')).join('')
        ]);
      }

      const tx = await this.eventLoggerContract.logAccess(credIdBytes, true);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Failed to log access:', error);
      throw error;
    }
  }

  async verifyCredential(credentialId: string, isValid: boolean) {
    if (!this.eventLoggerContract) {
      throw new Error('Wallet not connected');
    }

    try {
      // Convert credentialId to bytes32 if it's not already
      let credIdBytes = credentialId;
      if (!credentialId.startsWith('0x')) {
         const encoder = new TextEncoder();
         credIdBytes = await this.provider!.send('web3_sha3', [
          '0x' + Array.from(encoder.encode(credentialId)).map(b => b.toString(16).padStart(2, '0')).join('')
        ]);
      }

      const tx = await this.eventLoggerContract.logVerification(credIdBytes, isValid);
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Failed to log verification:', error);
      throw error;
    }
  }

  /**
   * Revoke a credential (only issuer can do this)
   */
  async revokeCredential(credentialId: string) {
    if (!this.credentialRegistryContract) {
      throw new Error('Wallet not connected');
    }

    try {
      let credIdBytes = credentialId;
      if (!credentialId.startsWith('0x')) {
        const encoder = new TextEncoder();
        credIdBytes = await this.provider!.send('web3_sha3', [
          '0x' + Array.from(encoder.encode(credentialId)).map(b => b.toString(16).padStart(2, '0')).join('')
        ]);
      }

      const tx = await this.credentialRegistryContract.revokeCredential(credIdBytes);
      const receipt = await tx.wait();
      return { hash: receipt.hash };
    } catch (error) {
      console.error('Failed to revoke credential:', error);
      throw error;
    }
  }

  /**
   * Get all credentials issued by the connected wallet (from events)
   */
  async getIssuedCredentials(): Promise<Array<{credentialId: string, holder: string, cid: string, timestamp: number}>> {
    if (!this.credentialRegistryContract || !this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const address = await this.signer!.getAddress();
      const filter = this.credentialRegistryContract.filters.CredentialIssued(null, address);
      const events = await this.credentialRegistryContract.queryFilter(filter, 0, 'latest');
      
      return events.map((event: any) => ({
        credentialId: event.args[0],
        holder: event.args[2],
        cid: event.args[4],
        timestamp: event.blockNumber
      }));
    } catch (error) {
      console.error('Failed to get issued credentials:', error);
      return [];
    }
  }

  /**
   * Get all credentials held by the connected wallet (from events)
   */
  async getHeldCredentials(): Promise<Array<{credentialId: string, issuer: string, cid: string, timestamp: number}>> {
    if (!this.credentialRegistryContract || !this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const address = await this.signer!.getAddress();
      const filter = this.credentialRegistryContract.filters.CredentialIssued(null, null, address);
      const events = await this.credentialRegistryContract.queryFilter(filter, 0, 'latest');
      
      return events.map((event: any) => ({
        credentialId: event.args[0],
        issuer: event.args[1],
        cid: event.args[4],
        timestamp: event.blockNumber
      }));
    } catch (error) {
      console.error('Failed to get held credentials:', error);
      return [];
    }
  }

  /**
   * Resolve a DID to check if it's registered
   */
  async resolveDID(address: string): Promise<string | null> {
    if (!this.didRegistryContract || !this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const encoder = new TextEncoder();
      const didBytes = await this.provider.send('web3_sha3', [
        '0x' + Array.from(encoder.encode(`did:idverse:${address}`)).map(b => b.toString(16).padStart(2, '0')).join('')
      ]);

      const controller = await this.didRegistryContract.getController(didBytes);
      // If controller is zero address, DID doesn't exist
      if (controller === '0x0000000000000000000000000000000000000000') {
        return null;
      }
      return controller;
    } catch (error) {
      console.error('Failed to resolve DID:', error);
      return null;
    }
  }

  getProvider() {
    return this.provider;
  }

  getSigner() {
    return this.signer;
  }
}

// Singleton instance
export const web3Service = new Web3Service();

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

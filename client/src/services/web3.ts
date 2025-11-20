import { BrowserProvider, Contract, JsonRpcSigner } from 'ethers';

// Contract addresses (update after deployment)
export const CONTRACT_ADDRESSES = {
  DIDRegistry: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  CredentialRegistry: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  EventLogger: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
};

// Simplified ABIs (only the functions we need for demo)
const DID_REGISTRY_ABI = [
  'function registerDID(bytes32 did, address controllerAddr, string calldata pointer) external',
  'function getController(bytes32 did) external view returns (address)',
  'function getDocPointer(bytes32 did) external view returns (string memory)',
  'event DIDRegistered(bytes32 indexed did, address indexed controller, string docPointer)',
];

const CREDENTIAL_REGISTRY_ABI = [
  'function issueCredential(bytes32 credentialId, bytes32 credentialHash, string calldata cid) external',
  'function revokeCredential(bytes32 credentialId) external',
  'function getCredential(bytes32 credentialId) external view returns (address issuer, bytes32 credentialHash, string memory cid, uint256 issuedAt, bool revoked)',
  'event CredentialIssued(bytes32 indexed credentialId, address indexed issuer, bytes32 credentialHash, string cid)',
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

  async issueCredential(
    credentialId: string,
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
      const credential = await this.credentialRegistryContract.getCredential(credentialId);
      return {
        issuer: credential[0],
        credentialHash: credential[1],
        cid: credential[2],
        issuedAt: new Date(Number(credential[3]) * 1000),
        revoked: credential[4],
      };
    } catch (error) {
      console.error('Failed to get credential:', error);
      throw error;
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

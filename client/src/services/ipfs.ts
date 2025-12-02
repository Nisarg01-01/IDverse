/**
 * IPFS Service using Helia for browser-based decentralized storage
 * This service handles credential data storage and retrieval from IPFS
 */

import { createHelia, type Helia } from 'helia';
import { unixfs, type UnixFS } from '@helia/unixfs';
import { CID } from 'multiformats/cid';

export interface CredentialData {
  credentialId: string;
  holder: string;
  issuer: string;
  credentialType: string;
  data: Record<string, any>;
  issuedAt: string;
  expiresAt?: string;
}

class IPFSService {
  private helia: Helia | null = null;
  private fs: UnixFS | null = null;
  private initPromise: Promise<void> | null = null;
  private isInitialized = false;

  /**
   * Initialize Helia node for browser
   * Uses libp2p with WebSocket and WebRTC transports
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initHelia();
    return this.initPromise;
  }

  private async _initHelia(): Promise<void> {
    try {
      console.log('🚀 Initializing Helia IPFS node...');
      
      // Create Helia node with default browser-compatible configuration
      this.helia = await createHelia();
      this.fs = unixfs(this.helia);
      this.isInitialized = true;
      
      console.log('✅ Helia IPFS node initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Helia:', error);
      throw new Error('Failed to initialize IPFS service');
    }
  }

  /**
   * Store credential data on IPFS
   * @param credential - The credential data to store
   * @returns The IPFS CID as a string
   */
  async storeCredential(credential: CredentialData): Promise<string> {
    await this.init();
    
    if (!this.fs) {
      throw new Error('IPFS service not initialized');
    }

    try {
      // Convert credential to JSON and then to bytes
      const jsonString = JSON.stringify(credential, null, 2);
      const bytes = new TextEncoder().encode(jsonString);
      
      // Add to IPFS
      const cid = await this.fs.addBytes(bytes);
      const cidString = cid.toString();
      
      console.log(`📦 Credential stored on IPFS: ${cidString}`);
      return `ipfs://${cidString}`;
    } catch (error) {
      console.error('❌ Failed to store credential on IPFS:', error);
      throw new Error('Failed to store credential on IPFS');
    }
  }

  /**
   * Retrieve credential data from IPFS
   * @param ipfsCid - The IPFS CID (with or without ipfs:// prefix)
   * @returns The credential data
   */
  async getCredential(ipfsCid: string): Promise<CredentialData | null> {
    await this.init();
    
    if (!this.fs) {
      throw new Error('IPFS service not initialized');
    }

    try {
      // Remove ipfs:// prefix if present
      const cidString = ipfsCid.replace('ipfs://', '');
      const cid = CID.parse(cidString);
      
      // Retrieve bytes from IPFS
      const chunks: Uint8Array[] = [];
      for await (const chunk of this.fs.cat(cid)) {
        chunks.push(chunk);
      }
      
      // Combine chunks and decode
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      
      const jsonString = new TextDecoder().decode(combined);
      const credential = JSON.parse(jsonString) as CredentialData;
      
      console.log(`📥 Credential retrieved from IPFS: ${cidString}`);
      return credential;
    } catch (error) {
      console.error('❌ Failed to retrieve credential from IPFS:', error);
      return null;
    }
  }

  /**
   * Check if a CID exists and is retrievable
   * @param ipfsCid - The IPFS CID to check
   * @returns Boolean indicating if the CID is valid and retrievable
   */
  async verifyCid(ipfsCid: string): Promise<boolean> {
    try {
      const credential = await this.getCredential(ipfsCid);
      return credential !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get the status of the IPFS node
   */
  getStatus(): { initialized: boolean; nodeId?: string } {
    return {
      initialized: this.isInitialized,
      nodeId: this.helia?.libp2p?.peerId?.toString()
    };
  }

  /**
   * Stop the Helia node
   */
  async stop(): Promise<void> {
    if (this.helia) {
      await this.helia.stop();
      this.helia = null;
      this.fs = null;
      this.isInitialized = false;
      console.log('🛑 Helia IPFS node stopped');
    }
  }
}

// Export singleton instance
export const ipfsService = new IPFSService();

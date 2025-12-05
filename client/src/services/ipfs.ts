/**
 * IPFS Service using Helia for browser-based decentralized storage
 * This service handles credential data storage and retrieval from IPFS
 * Uses IndexedDB for local persistence between browser sessions
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

// IndexedDB helper for persistent local storage
class LocalIPFSCache {
  private dbName = 'idverse-ipfs-cache';
  private storeName = 'credentials';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'cid' });
        }
      };
    });
  }

  async store(cid: string, data: CredentialData): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({ cid, data, timestamp: Date.now() });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async get(cid: string): Promise<CredentialData | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(cid);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result?.data || null);
      };
    });
  }
}

class IPFSService {
  private helia: Helia | null = null;
  private fs: UnixFS | null = null;
  private initPromise: Promise<void> | null = null;
  private isInitialized = false;
  private localCache = new LocalIPFSCache();

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
      console.log('Initializing Helia IPFS node...');
      
      // Initialize local cache
      await this.localCache.init();
      
      // Create Helia node with default browser-compatible configuration
      this.helia = await createHelia();
      this.fs = unixfs(this.helia);
      this.isInitialized = true;
      
      console.log('Helia IPFS node initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Helia:', error);
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
      
      // Also store in local cache for persistence between sessions
      await this.localCache.store(cidString, credential);
      
      console.log('Credential stored on IPFS:', cidString);
      return `ipfs://${cidString}`;
    } catch (error) {
      console.error('Failed to store credential on IPFS:', error);
      throw new Error('Failed to store credential on IPFS');
    }
  }

  /**
   * Retrieve credential data from IPFS with timeout
   * Falls back to local cache if Helia can't retrieve the data
   * @param ipfsCid - The IPFS CID (with or without ipfs:// prefix)
   * @param timeoutMs - Timeout in milliseconds (default 3 seconds)
   * @returns The credential data
   */
  async getCredential(ipfsCid: string, timeoutMs: number = 3000): Promise<CredentialData | null> {
    await this.init();
    
    if (!this.fs) {
      throw new Error('IPFS service not initialized');
    }

    // Remove ipfs:// prefix if present
    const cidString = ipfsCid.replace('ipfs://', '');

    // First, try to get from local cache (fast)
    try {
      const cachedData = await this.localCache.get(cidString);
      if (cachedData) {
        console.log('Credential retrieved from local cache:', cidString);
        return cachedData;
      }
    } catch (cacheError) {
      console.warn('Local cache lookup failed:', cacheError);
    }

    // If not in cache, try Helia with timeout
    try {
      const cid = CID.parse(cidString);
      
      // Create a timeout promise
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('IPFS retrieval timeout')), timeoutMs);
      });
      
      // Create the retrieval promise
      const retrievalPromise = (async () => {
        const chunks: Uint8Array[] = [];
        for await (const chunk of this.fs!.cat(cid)) {
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
        
        // Store in local cache for future retrieval
        await this.localCache.store(cidString, credential);
        
        console.log('Credential retrieved from IPFS:', cidString);
        return credential;
      })();
      
      // Race between timeout and retrieval
      return await Promise.race([retrievalPromise, timeoutPromise]);
    } catch (error) {
      console.warn('Could not retrieve from IPFS (may be in different session):', error);
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

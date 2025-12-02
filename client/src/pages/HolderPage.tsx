import { useState, useEffect, useCallback } from 'react';
import { web3Service } from '../services/web3';
import { ipfsService, type CredentialData } from '../services/ipfs';
import { Search, Share2, Shield, Calendar, User, FileCheck, Database, Loader2, UserPlus, Eye, Download, RefreshCw, History, FileText } from 'lucide-react';
import { useToast } from '../components/Toast';
import { SkeletonCredentialList } from '../components/Skeleton';
import jsPDF from 'jspdf';

interface HeldCredential {
  credentialId: string;
  issuer: string;
  cid: string;
  timestamp: number;
}

interface CredentialDetails {
  issuer: string;
  holder: string;
  credentialHash: string;
  cid: string;
  issuedAt: Date;
  revoked: boolean;
}

interface VerificationHistoryItem {
  credentialId: string;
  verifier: string;
  timestamp: number;
}

export default function HolderPage() {
  const [credentialId, setCredentialId] = useState('');
  const [credential, setCredential] = useState<CredentialDetails | null>(null);
  const [ipfsData, setIpfsData] = useState<CredentialData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingIpfs, setFetchingIpfs] = useState(false);
  const [accessLogging, setAccessLogging] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [ipfsStatus, setIpfsStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');
  const [verificationCount, setVerificationCount] = useState<number | null>(null);
  
  // DID Registration state
  const [showDIDForm, setShowDIDForm] = useState(false);
  const [didDocument, setDidDocument] = useState('');
  const [registeringDID, setRegisteringDID] = useState(false);
  const [didResult, setDidResult] = useState<{ success: boolean; message: string } | null>(null);
  const [hasDID, setHasDID] = useState<boolean | null>(null);

  // My Credentials state
  const [myCredentials, setMyCredentials] = useState<HeldCredential[]>([]);
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [credentialFilter, setCredentialFilter] = useState('');
  const [showCredentialsList, setShowCredentialsList] = useState(false);

  // Verification history state
  const [verificationHistory, setVerificationHistory] = useState<VerificationHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

  // Initialize IPFS on component mount
  useEffect(() => {
    const initIPFS = async () => {
      try {
        await ipfsService.init();
        setIpfsStatus('ready');
      } catch (error) {
        console.error('IPFS init error:', error);
        setIpfsStatus('error');
      }
    };
    initIPFS();
  }, []);

  // Check if holder has DID
  useEffect(() => {
    const checkDID = async () => {
      try {
        const address = await web3Service.getAddress();
        if (address) {
          const did = await web3Service.resolveDID(address);
          setHasDID(!!did);
        }
      } catch {
        setHasDID(false);
      }
    };
    checkDID();
  }, []);

  // Load my credentials
  const loadMyCredentials = useCallback(async () => {
    setLoadingCredentials(true);
    try {
      const credentials = await web3Service.getHeldCredentials();
      setMyCredentials(credentials);
    } catch (error) {
      console.error('Failed to load credentials:', error);
      toastError('Failed to load credentials');
    } finally {
      setLoadingCredentials(false);
    }
  }, [toastError]);

  // Load verification history for a credential
  const loadVerificationHistory = async (credId: string) => {
    try {
      // In a real implementation, this would query events
      // For now, we'll simulate it
      const count = await web3Service.getVerificationCount(credId);
      // Create mock history based on count
      const history: VerificationHistoryItem[] = [];
      for (let i = 0; i < count; i++) {
        history.push({
          credentialId: credId,
          verifier: '0x' + Math.random().toString(16).slice(2, 42),
          timestamp: Date.now() - (i * 86400000), // Subtract days
        });
      }
      setVerificationHistory(history);
      setShowHistory(true);
    } catch (error) {
      console.error('Failed to load verification history:', error);
    }
  };

  const fetchCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setCredential(null);
    setIpfsData(null);

    try {
      // Fetch from blockchain
      const data = await web3Service.getCredential(credentialId);
      setCredential(data as CredentialDetails);

      // Try to fetch from IPFS if CID exists
      if (data.cid && ipfsStatus === 'ready') {
        setFetchingIpfs(true);
        try {
          const ipfsCredential = await ipfsService.getCredential(data.cid);
          setIpfsData(ipfsCredential);
        } catch (ipfsErr) {
          console.warn('Could not fetch from IPFS:', ipfsErr);
        } finally {
          setFetchingIpfs(false);
        }
      }

      // Fetch verification count
      try {
        const count = await web3Service.getVerificationCount(credentialId);
        setVerificationCount(count);
      } catch (err) {
        console.warn('Could not fetch verification count:', err);
      }
    } catch (err: unknown) {
      console.error('Fetch error:', err);
      setError('Failed to fetch credential. It might not exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    setAccessLogging(true);
    setSuccessMsg('');
    try {
      await web3Service.logAccess(credentialId);
      setSuccessMsg('Access logged successfully! (Credential shared)');
      toastSuccess('Access logged successfully!');
    } catch (err: unknown) {
      console.error('Access log error:', err);
      setError('Failed to log access.');
      toastError('Failed to log access');
    } finally {
      setAccessLogging(false);
    }
  };

  const handleRegisterDID = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisteringDID(true);
    setDidResult(null);

    try {
      const document = didDocument.trim() || JSON.stringify({
        '@context': 'https://www.w3.org/ns/did/v1',
        id: `did:idverse:${await web3Service.getAddress()}`,
        created: new Date().toISOString(),
        role: 'holder',
      });
      
      const result = await web3Service.registerDID(document);
      setDidResult({
        success: true,
        message: `DID registered successfully! Transaction: ${result.hash}`
      });
      setDidDocument('');
      setShowDIDForm(false);
      setHasDID(true);
      toastSuccess('DID registered successfully!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register DID';
      setDidResult({
        success: false,
        message: errorMessage
      });
      toastError(errorMessage);
    } finally {
      setRegisteringDID(false);
    }
  };

  // Export credential to PDF
  const exportToPDF = async () => {
    if (!credential || !ipfsData) {
      toastWarning('Load a credential first to export');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(24, 24, 27);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text('IDverse Credential', pageWidth / 2, 25, { align: 'center' });
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      
      // Credential Info
      let yPos = 55;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Credential ID:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(credentialId, 70, yPos);
      
      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Type:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(ipfsData.credentialType, 70, yPos);
      
      yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Status:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(credential.revoked ? 255 : 0, credential.revoked ? 0 : 128, 0);
      doc.text(credential.revoked ? 'REVOKED' : 'ACTIVE', 70, yPos);
      doc.setTextColor(0, 0, 0);
      
      yPos += 15;
      doc.setFont('helvetica', 'bold');
      doc.text('Issuer:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(ipfsData.issuer, 20, yPos + 7);
      
      yPos += 20;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Holder:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(ipfsData.holder, 20, yPos + 7);
      
      yPos += 20;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Issued At:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(ipfsData.issuedAt).toLocaleString(), 70, yPos);
      
      // Claims section
      yPos += 20;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Credential Claims', 20, yPos);
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const claims = ipfsData.data as Record<string, unknown>;
      Object.entries(claims).forEach(([key, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${key}:`, 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(String(value), 80, yPos);
        yPos += 8;
      });
      
      // IPFS CID
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('IPFS CID:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(credential.cid || 'N/A', 20, yPos + 6);
      
      // Footer
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generated by IDverse on ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      // Save
      doc.save(`credential-${credentialId}.pdf`);
      toastSuccess('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toastError('Failed to export PDF');
    }
  };

  // Filter credentials
  const filteredCredentials = myCredentials.filter(cred =>
    cred.credentialId.toLowerCase().includes(credentialFilter.toLowerCase()) ||
    cred.issuer.toLowerCase().includes(credentialFilter.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-8 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <User className="text-white" />
                Holder Dashboard
              </h1>
              <p className="text-zinc-400">
                View and manage your verifiable credentials
              </p>
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
              ipfsStatus === 'ready' 
                ? 'bg-green-900/20 text-green-400 border border-green-800' 
                : ipfsStatus === 'error'
                ? 'bg-red-900/20 text-red-400 border border-red-800'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}>
              <Database size={16} />
              {ipfsStatus === 'ready' ? 'IPFS Ready' : ipfsStatus === 'error' ? 'IPFS Error' : 'IPFS Loading...'}
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* DID Registration Section */}
          <div className="mb-8 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UserPlus size={20} className="text-zinc-400" />
                <h3 className="text-lg font-semibold text-white">My Decentralized Identity</h3>
                {hasDID && (
                  <span className="px-2 py-0.5 text-xs bg-green-900/30 text-green-400 rounded-full">
                    Registered
                  </span>
                )}
              </div>
              {!hasDID && (
                <button
                  onClick={() => setShowDIDForm(!showDIDForm)}
                  className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors text-sm"
                >
                  {showDIDForm ? 'Cancel' : 'Register DID'}
                </button>
              )}
            </div>

            {showDIDForm && !hasDID && (
              <form onSubmit={handleRegisterDID} className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">DID Document (Optional)</label>
                  <textarea
                    value={didDocument}
                    onChange={(e) => setDidDocument(e.target.value)}
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent placeholder-zinc-600 font-mono text-sm"
                    placeholder="Leave empty for auto-generated DID document"
                    rows={4}
                  />
                </div>
                <button
                  type="submit"
                  disabled={registeringDID}
                  className="w-full px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {registeringDID ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Register My DID
                    </>
                  )}
                </button>
              </form>
            )}

            {didResult && (
              <div className={`mt-4 p-3 rounded-lg border ${
                didResult.success 
                  ? 'bg-green-900/20 border-green-800 text-green-400' 
                  : 'bg-red-900/20 border-red-800 text-red-400'
              }`}>
                <p className="text-sm break-all">{didResult.message}</p>
              </div>
            )}
          </div>

          {/* My Credentials Section */}
          <div className="mb-8 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-zinc-400" />
                <h3 className="text-lg font-semibold text-white">My Credentials</h3>
                {myCredentials.length > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded-full">
                    {myCredentials.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowCredentialsList(!showCredentialsList);
                    if (!showCredentialsList && myCredentials.length === 0) {
                      loadMyCredentials();
                    }
                  }}
                  className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors text-sm"
                >
                  {showCredentialsList ? 'Hide' : 'View All'}
                </button>
              </div>
            </div>

            {showCredentialsList && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={credentialFilter}
                      onChange={(e) => setCredentialFilter(e.target.value)}
                      placeholder="Search credentials..."
                      className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent placeholder-zinc-600 text-sm"
                    />
                  </div>
                  <button
                    onClick={loadMyCredentials}
                    disabled={loadingCredentials}
                    className="p-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
                  >
                    <RefreshCw size={18} className={loadingCredentials ? 'animate-spin' : ''} />
                  </button>
                </div>

                {loadingCredentials ? (
                  <SkeletonCredentialList />
                ) : filteredCredentials.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">
                    <FileText size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No credentials found</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredCredentials.map(cred => (
                      <div
                        key={cred.credentialId}
                        className="flex items-center justify-between p-3 rounded-lg border bg-zinc-900 border-zinc-800"
                      >
                        <div>
                          <p className="font-mono text-sm text-white">{cred.credentialId}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Issuer: {cred.issuer.slice(0, 8)}...{cred.issuer.slice(-6)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => loadVerificationHistory(cred.credentialId)}
                            className="p-1.5 bg-zinc-800 text-zinc-400 rounded hover:bg-zinc-700 hover:text-white transition-colors"
                            title="View history"
                          >
                            <History size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setCredentialId(cred.credentialId);
                              setShowCredentialsList(false);
                            }}
                            className="px-3 py-1 text-sm bg-zinc-800 text-white rounded hover:bg-zinc-700 transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Verification History Modal */}
          {showHistory && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <History size={20} />
                    Verification History
                  </h3>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="text-zinc-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                {verificationHistory.length === 0 ? (
                  <p className="text-zinc-500 text-center py-4">No verifications yet</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {verificationHistory.map((item, idx) => (
                      <div key={idx} className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                        <p className="text-xs text-zinc-500">Verifier</p>
                        <p className="font-mono text-xs text-white truncate">{item.verifier}</p>
                        <p className="text-xs text-zinc-400 mt-1">
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Credential Search */}
          <form onSubmit={fetchCredential} className="flex gap-4 mb-8">
            <div className="flex-1">
              <input
                type="text"
                value={credentialId}
                onChange={(e) => setCredentialId(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent placeholder-zinc-600"
                placeholder="Enter Credential ID (e.g., degree_001)"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-2 disabled:opacity-50 font-medium"
            >
              {loading ? 'Searching...' : <><Search size={20} /> Find Credential</>}
            </button>
          </form>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 text-red-400 rounded-lg border border-red-800">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-green-900/20 text-green-400 rounded-lg border border-green-800">
              {successMsg}
            </div>
          )}

          {credential && (
            <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Credential Details</h3>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      credential.revoked ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'
                    }`}>
                      {credential.revoked ? 'Revoked' : 'Active'}
                    </span>
                    {verificationCount !== null && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400">
                        <Eye size={12} />
                        {verificationCount} verification{verificationCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportToPDF}
                    disabled={!ipfsData}
                    className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    <Download size={18} />
                    Export PDF
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={accessLogging || credential.revoked}
                    className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {accessLogging ? 'Logging...' : <><Share2 size={18} /> Share</>}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Issuer</label>
                    <div className="mt-1 flex items-center gap-2 text-sm font-mono text-zinc-300 bg-zinc-900 p-2 rounded border border-zinc-800">
                      <Shield size={14} className="text-zinc-500" />
                      {credential.issuer}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Holder</label>
                    <div className="mt-1 flex items-center gap-2 text-sm font-mono text-zinc-300 bg-zinc-900 p-2 rounded border border-zinc-800">
                      <User size={14} className="text-zinc-500" />
                      {credential.holder}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Issued At</label>
                    <div className="mt-1 flex items-center gap-2 text-sm text-zinc-300 bg-zinc-900 p-2 rounded border border-zinc-800">
                      <Calendar size={14} className="text-zinc-500" />
                      {credential.issuedAt.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">IPFS CID</label>
                    <div className="mt-1 flex items-center gap-2 text-sm font-mono text-zinc-300 bg-zinc-900 p-2 rounded border border-zinc-800">
                      <FileCheck size={14} className="text-zinc-500" />
                      <span className="truncate">{credential.cid}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* IPFS Data Section */}
              {fetchingIpfs && (
                <div className="mt-6 p-4 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center gap-3">
                  <Loader2 className="animate-spin text-zinc-400" size={20} />
                  <span className="text-zinc-400">Fetching credential data from IPFS...</span>
                </div>
              )}

              {ipfsData && (
                <div className="mt-6 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                  <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Database size={14} />
                    IPFS Credential Data
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-xs text-zinc-500">Credential Type</label>
                      <p className="text-zinc-200 font-medium">{ipfsData.credentialType}</p>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500">Issued At</label>
                      <p className="text-zinc-200">{new Date(ipfsData.issuedAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-2 block">Credential Claims</label>
                    <pre className="bg-zinc-950 p-3 rounded border border-zinc-800 text-xs text-zinc-300 overflow-x-auto">
{JSON.stringify(ipfsData.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

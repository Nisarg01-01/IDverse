import { useState, useEffect } from 'react';
import { web3Service } from '../services/web3';
import { ipfsService, type CredentialData } from '../services/ipfs';
import { Search, CheckCircle, XCircle, Loader2, Database, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { useToast } from '../components/Toast';

interface CredentialResult {
  issuer: string;
  holder: string;
  credentialHash: string;
  cid: string;
  issuedAt: Date;
  revoked: boolean;
}

export default function VerifierPage() {
  const [credentialId, setCredentialId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<CredentialResult | null>(null);
  const [ipfsData, setIpfsData] = useState<CredentialData | null>(null);
  const [fetchingIpfs, setFetchingIpfs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ipfsStatus, setIpfsStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');
  const [ipfsVerified, setIpfsVerified] = useState<boolean | null>(null);
  const [loggingVerification, setLoggingVerification] = useState(false);
  const [verificationLogged, setVerificationLogged] = useState(false);

  const { success: toastSuccess, error: toastError } = useToast();

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

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setResult(null);
    setIpfsData(null);
    setError(null);
    setIpfsVerified(null);
    setVerificationLogged(false);

    try {
      // Fetch from blockchain
      const data = await web3Service.getCredential(credentialId);
      setResult(data as CredentialResult);

      // Try to fetch and verify from IPFS
      if (data.cid && ipfsStatus === 'ready') {
        setFetchingIpfs(true);
        try {
          const ipfsCredential = await ipfsService.getCredential(data.cid);
          setIpfsData(ipfsCredential);
          
          // Verify IPFS data matches blockchain data
          if (ipfsCredential) {
            const issuerMatch = ipfsCredential.issuer.toLowerCase() === data.issuer.toLowerCase();
            const holderMatch = ipfsCredential.holder.toLowerCase() === data.holder.toLowerCase();
            const idMatch = ipfsCredential.credentialId === credentialId;
            setIpfsVerified(issuerMatch && holderMatch && idMatch);
          }
        } catch (ipfsErr) {
          console.warn('Could not verify from IPFS:', ipfsErr);
          setIpfsVerified(false);
        } finally {
          setFetchingIpfs(false);
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify credential';
      setError(errorMessage);
      toastError('Failed to verify credential');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogVerification = async (isValid: boolean) => {
    setLoggingVerification(true);
    try {
      await web3Service.verifyCredential(credentialId, isValid);
      setVerificationLogged(true);
      toastSuccess('Verification logged on blockchain!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to log verification: ' + errorMessage);
      toastError('Failed to log verification');
    } finally {
      setLoggingVerification(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Verify Credential</h1>
            <p className="text-zinc-400">
              Check the validity and details of a credential on the blockchain
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

        <form onSubmit={handleVerify} className="space-y-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Credential ID
            </label>
            <div className="flex gap-4">
              <input
                type="text"
                value={credentialId}
                onChange={(e) => setCredentialId(e.target.value)}
                className="flex-1 px-4 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent placeholder-zinc-600"
                placeholder="Enter Credential ID"
                required
              />
              <button
                type="submit"
                disabled={isVerifying || !credentialId}
                className="px-6 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    Verify
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="p-4 bg-red-900/20 text-red-400 border border-red-800 rounded-lg flex items-center gap-2">
            <XCircle size={20} />
            {error}
          </div>
        )}

        {result && (
          <div className="border border-zinc-800 rounded-lg overflow-hidden">
            <div className={`p-4 ${result.revoked ? 'bg-red-900/20 border-red-800' : 'bg-green-900/20 border-green-800'} border-b flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                {result.revoked ? (
                  <XCircle className="text-red-400" size={24} />
                ) : (
                  <CheckCircle className="text-green-400" size={24} />
                )}
                <span className={`font-bold ${result.revoked ? 'text-red-400' : 'text-green-400'}`}>
                  {result.revoked ? 'Revoked' : 'Valid Credential'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-400">
                  Issued: {result.issuedAt.toLocaleDateString()}
                </span>
                {!verificationLogged ? (
                  <button
                    onClick={() => handleLogVerification(!result.revoked)}
                    disabled={loggingVerification}
                    className="px-3 py-1.5 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                  >
                    {loggingVerification ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <ClipboardCheck size={14} />
                    )}
                    Log Verification
                  </button>
                ) : (
                  <span className="px-3 py-1.5 bg-green-900/30 text-green-400 rounded-lg text-sm flex items-center gap-2">
                    <CheckCircle size={14} />
                    Logged
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-6 space-y-4 bg-zinc-900">
              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                  Issuer Address
                </label>
                <div className="font-mono text-sm bg-zinc-950 p-2 rounded border border-zinc-800 text-zinc-300 break-all">
                  {result.issuer}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                  Holder Address
                </label>
                <div className="font-mono text-sm bg-zinc-950 p-2 rounded border border-zinc-800 text-zinc-300 break-all">
                  {result.holder}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                  Credential Hash
                </label>
                <div className="font-mono text-xs text-zinc-400 break-all">
                  {result.credentialHash}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                  IPFS CID
                </label>
                <div className="font-mono text-xs text-zinc-400 break-all">
                  {result.cid}
                </div>
              </div>

              {/* IPFS Verification Section */}
              {fetchingIpfs && (
                <div className="mt-4 p-3 bg-zinc-950 rounded-lg border border-zinc-800 flex items-center gap-3">
                  <Loader2 className="animate-spin text-zinc-400" size={18} />
                  <span className="text-sm text-zinc-400">Verifying IPFS data integrity...</span>
                </div>
              )}

              {ipfsVerified !== null && (
                <div className={`mt-4 p-3 rounded-lg border flex items-center gap-3 ${
                  ipfsVerified 
                    ? 'bg-green-900/20 border-green-800' 
                    : 'bg-red-900/20 border-red-800'
                }`}>
                  {ipfsVerified ? (
                    <>
                      <ShieldCheck className="text-green-400" size={20} />
                      <span className="text-sm text-green-400">IPFS data integrity verified ✓</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="text-red-400" size={20} />
                      <span className="text-sm text-red-400">IPFS data verification failed</span>
                    </>
                  )}
                </div>
              )}

              {ipfsData && (
                <div className="mt-4 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Database size={12} />
                    IPFS Credential Data
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <span className="text-zinc-500">Type:</span>
                      <span className="ml-2 text-zinc-200">{ipfsData.credentialType}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Issued:</span>
                      <span className="ml-2 text-zinc-200">{new Date(ipfsData.issuedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500">Claims:</span>
                    <pre className="mt-1 text-xs text-zinc-300 bg-zinc-900 p-2 rounded overflow-x-auto">
{JSON.stringify(ipfsData.data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

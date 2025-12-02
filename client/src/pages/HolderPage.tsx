import { useState, useEffect } from 'react';
import { web3Service } from '../services/web3';
import { Wallet, FileText, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';

interface Credential {
  credentialId: string;
  issuer: string;
  credentialHash: string;
  cid: string;
  issuedAt?: Date;
  revoked?: boolean;
}

export default function HolderPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [did, setDid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get wallet address
      const signer = web3Service.getSigner();
      if (!signer) {
        throw new Error('Please connect your wallet first');
      }

      const address = await signer.getAddress();
      setWalletAddress(address);

      // Get DID for this address
      const userDid = await web3Service.getDIDForAddress(address);
      setDid(userDid);

      // Get all credentials issued by this address (as issuer)
      const issuedCreds = await web3Service.getIssuedCredentials(address);

      // Fetch full details for each credential
      const credentialsWithDetails = await Promise.all(
        issuedCreds.map(async (cred) => {
          const details = await web3Service.getCredentialDetails(cred.credentialId);
          return {
            ...cred,
            issuedAt: details?.issuedAt,
            revoked: details?.revoked || false,
          };
        })
      );

      setCredentials(credentialsWithDetails);
    } catch (err: any) {
      console.error('Error loading credentials:', err);
      setError(err.message || 'Failed to load credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Unknown';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Credentials</h1>
            <p className="text-gray-600">
              View and manage your verifiable credentials
            </p>
          </div>
          <button
            onClick={loadCredentials}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Wallet Info */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={20} className="text-blue-600" />
            <h3 className="font-semibold text-blue-900">Wallet Information</h3>
          </div>
          <p className="text-sm text-blue-800">
            <span className="font-medium">Address:</span>{' '}
            <span className="font-mono">{walletAddress || 'Not connected'}</span>
          </p>
          {did && (
            <p className="text-sm text-blue-800 mt-1">
              <span className="font-medium">DID:</span>{' '}
              <span className="font-mono text-xs">{did}</span>
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-medium">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={40} className="animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading credentials...</span>
          </div>
        ) : credentials.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <FileText size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Credentials Found
            </h3>
            <p className="text-gray-500">
              You haven't issued any credentials yet. Credentials you issue will appear here.
            </p>
          </div>
        ) : (
          /* Credentials Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {credentials.map((credential, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedCredential(credential)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText size={20} className="text-blue-600" />
                    <h3 className="font-semibold text-gray-900">
                      Credential #{index + 1}
                    </h3>
                  </div>
                  {credential.revoked ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                      <XCircle size={14} />
                      Revoked
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                      <CheckCircle size={14} />
                      Active
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">ID:</span>{' '}
                    <span className="font-mono text-xs text-gray-900 break-all">
                      {credential.credentialId.slice(0, 20)}...
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Issuer:</span>{' '}
                    <span className="font-mono text-xs text-gray-900">
                      {formatAddress(credential.issuer)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Issued:</span>{' '}
                    <span className="text-gray-900">{formatDate(credential.issuedAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">CID:</span>{' '}
                    <span className="font-mono text-xs text-gray-900">
                      {credential.cid.length > 30
                        ? `${credential.cid.slice(0, 30)}...`
                        : credential.cid}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Credential Detail Modal */}
      {selectedCredential && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedCredential(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Credential Details</h2>
              <button
                onClick={() => setSelectedCredential(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                {selectedCredential.revoked ? (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-red-600 bg-red-100 px-3 py-1 rounded">
                    <XCircle size={16} />
                    Revoked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded">
                    <CheckCircle size={16} />
                    Active
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credential ID
                </label>
                <p className="font-mono text-sm bg-gray-50 p-3 rounded border border-gray-200 break-all">
                  {selectedCredential.credentialId}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issuer Address
                </label>
                <p className="font-mono text-sm bg-gray-50 p-3 rounded border border-gray-200">
                  {selectedCredential.issuer}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credential Hash
                </label>
                <p className="font-mono text-sm bg-gray-50 p-3 rounded border border-gray-200 break-all">
                  {selectedCredential.credentialHash}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IPFS CID
                </label>
                <p className="font-mono text-sm bg-gray-50 p-3 rounded border border-gray-200 break-all">
                  {selectedCredential.cid}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issued At
                </label>
                <p className="text-sm bg-gray-50 p-3 rounded border border-gray-200">
                  {formatDate(selectedCredential.issuedAt)}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedCredential(null)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

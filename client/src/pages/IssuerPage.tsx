import { useState, useEffect, useCallback } from 'react';
import { web3Service } from '../services/web3';
import { ipfsService, type CredentialData } from '../services/ipfs';
import { Send, Loader2, Database, CheckCircle, Ban, FileText, UserPlus, RefreshCw, Search, XCircle } from 'lucide-react';
import { credentialTemplates, getTemplateById, type CredentialTemplate } from '../data/credentialTemplates';
import { useToast } from '../components/Toast';
import { SkeletonCredentialList } from '../components/Skeleton';

type TabType = 'issue' | 'revoke' | 'credentials' | 'register';

interface IssuedCredential {
  credentialId: string;
  holder: string;
  isRevoked: boolean;
  timestamp?: number;
}

export default function IssuerPage() {
  const [activeTab, setActiveTab] = useState<TabType>('issue');
  const [formData, setFormData] = useState({
    credentialId: '',
    holderAddress: '',
    credentialType: '',
    claims: '',
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>('custom');
  const [templateFields, setTemplateFields] = useState<Record<string, string>>({});
  const [isIssuing, setIsIssuing] = useState(false);
  const [ipfsStatus, setIpfsStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');
  const [result, setResult] = useState<{ success: boolean; message: string; ipfsCid?: string } | null>(null);

  // Revoke tab state
  const [revokeCredentialId, setRevokeCredentialId] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);

  // Credentials tab state
  const [issuedCredentials, setIssuedCredentials] = useState<IssuedCredential[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [credentialFilter, setCredentialFilter] = useState('');

  // Register DID tab state
  const [didName, setDidName] = useState('');
  const [docPointer, setDocPointer] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasDID, setHasDID] = useState<boolean | null>(null);

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

  // Check if issuer has DID
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

  // Load issued credentials
  const loadIssuedCredentials = useCallback(async () => {
    setIsLoadingCredentials(true);
    try {
      const credentials = await web3Service.getIssuedCredentials();
      // Map to add isRevoked status (we'll need to check each one)
      const credentialsWithStatus = await Promise.all(
        credentials.map(async (cred) => {
          try {
            const details = await web3Service.getCredential(cred.credentialId);
            return { ...cred, isRevoked: details.revoked, holder: cred.holder };
          } catch {
            return { ...cred, isRevoked: false, holder: cred.holder };
          }
        })
      );
      setIssuedCredentials(credentialsWithStatus);
    } catch (error) {
      console.error('Failed to load credentials:', error);
      toastError('Failed to load credentials');
    } finally {
      setIsLoadingCredentials(false);
    }
  }, [toastError]);

  // Load credentials when switching to credentials tab
  useEffect(() => {
    if (activeTab === 'credentials') {
      loadIssuedCredentials();
    }
  }, [activeTab, loadIssuedCredentials]);

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = getTemplateById(templateId);
    if (template && templateId !== 'custom') {
      setFormData(prev => ({
        ...prev,
        credentialType: template.type,
      }));
      setTemplateFields({ ...template.defaultClaims });
    } else {
      setTemplateFields({});
    }
  };

  // Build claims JSON from template fields
  const buildClaimsFromTemplate = (): string => {
    const template = getTemplateById(selectedTemplate);
    if (!template || selectedTemplate === 'custom') {
      return formData.claims;
    }
    // Filter out empty values
    const filteredClaims: Record<string, string> = {};
    Object.entries(templateFields).forEach(([key, value]) => {
      if (value && value.trim()) {
        filteredClaims[key] = value;
      }
    });
    return JSON.stringify(filteredClaims, null, 2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIssuing(true);
    setResult(null);

    try {
      // Get claims from template or custom input
      const claimsJson = selectedTemplate === 'custom' ? formData.claims : buildClaimsFromTemplate();
      
      // Parse claims JSON
      let parsedClaims = {};
      try {
        parsedClaims = JSON.parse(claimsJson || '{}');
      } catch {
        throw new Error('Invalid JSON in claims field');
      }

      // Get wallet address (issuer)
      const walletAddress = await web3Service.getAddress();
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }

      // Prepare credential data for IPFS
      const credentialData: CredentialData = {
        credentialId: formData.credentialId,
        holder: formData.holderAddress,
        issuer: walletAddress,
        credentialType: formData.credentialType,
        data: parsedClaims,
        issuedAt: new Date().toISOString(),
      };

      // Store credential on IPFS
      console.log('📤 Storing credential on IPFS...');
      const ipfsCid = await ipfsService.storeCredential(credentialData);
      console.log('✅ Credential stored on IPFS:', ipfsCid);

      // Prepare blockchain credential data
      const blockchainData = {
        type: formData.credentialType,
        credentialSubject: {
          id: formData.holderAddress,
          ...parsedClaims,
        },
        issuedAt: credentialData.issuedAt,
      };

      // Issue credential on blockchain with real IPFS CID
      const { hash } = await web3Service.issueCredential(
        formData.credentialId,
        formData.holderAddress,
        blockchainData,
        ipfsCid
      );

      setResult({
        success: true,
        message: `Credential issued successfully! Transaction: ${hash}`,
        ipfsCid: ipfsCid,
      });
      toastSuccess('Credential issued successfully!');

      // Reset form
      setFormData({
        credentialId: '',
        holderAddress: '',
        credentialType: '',
        claims: '',
      });
      setTemplateFields({});
      setSelectedTemplate('custom');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to issue credential';
      setResult({
        success: false,
        message: errorMessage,
      });
      toastError(errorMessage);
    } finally {
      setIsIssuing(false);
    }
  };

  // Handle credential revocation
  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeCredentialId.trim()) {
      toastWarning('Please enter a credential ID');
      return;
    }

    setIsRevoking(true);
    try {
      const { hash } = await web3Service.revokeCredential(revokeCredentialId);
      toastSuccess(`Credential revoked! TX: ${hash.slice(0, 10)}...`);
      setRevokeCredentialId('');
      // Refresh credentials list if on that tab
      if (activeTab === 'credentials') {
        loadIssuedCredentials();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to revoke credential';
      toastError(errorMessage);
    } finally {
      setIsRevoking(false);
    }
  };

  // Handle DID registration
  const handleRegisterDID = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!didName.trim()) {
      toastError('Please enter a DID identifier');
      return;
    }
    setIsRegistering(true);
    try {
      const { hash } = await web3Service.registerDID(didName.trim(), docPointer.trim());
      toastSuccess(`DID registered! TX: ${hash.slice(0, 10)}...`);
      setHasDID(true);
      setDidName('');
      setDocPointer('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to register DID';
      toastError(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  // Filter credentials
  const filteredCredentials = issuedCredentials.filter(cred =>
    cred.credentialId.toLowerCase().includes(credentialFilter.toLowerCase()) ||
    cred.holder.toLowerCase().includes(credentialFilter.toLowerCase())
  );

  // Get current template
  const currentTemplate: CredentialTemplate | undefined = getTemplateById(selectedTemplate);

  const tabs = [
    { id: 'issue' as TabType, label: 'Issue', icon: Send },
    { id: 'revoke' as TabType, label: 'Revoke', icon: Ban },
    { id: 'credentials' as TabType, label: 'My Credentials', icon: FileText },
    { id: 'register' as TabType, label: 'Register DID', icon: UserPlus },
  ];

  return (
    <div className="w-full">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Issuer Dashboard</h1>
              <p className="text-zinc-400">
                Issue, manage, and revoke verifiable credentials
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

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-black'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Issue Tab */}
          {activeTab === 'issue' && (
            <div>
              {/* Template Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Credential Template
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {credentialTemplates.map(template => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => handleTemplateChange(template.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedTemplate === template.id
                          ? 'border-white bg-zinc-800'
                          : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'
                      }`}
                    >
                      <span className="text-2xl">{template.icon}</span>
                      <p className="text-sm font-medium text-white mt-1">{template.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{template.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Credential ID
                    </label>
                    <input
                      type="text"
                      value={formData.credentialId}
                      onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
                      className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent placeholder-zinc-600"
                      placeholder="e.g., degree_001"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Holder Address
                    </label>
                    <input
                      type="text"
                      value={formData.holderAddress}
                      onChange={(e) => setFormData({ ...formData, holderAddress: e.target.value })}
                      className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent font-mono text-sm placeholder-zinc-600"
                      placeholder="0x..."
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Credential Type
                  </label>
                  <input
                    type="text"
                    value={formData.credentialType}
                    onChange={(e) => setFormData({ ...formData, credentialType: e.target.value })}
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent placeholder-zinc-600"
                    placeholder="e.g., UniversityDegree"
                    required
                  />
                </div>

                {/* Template Fields or Custom JSON */}
                {selectedTemplate === 'custom' ? (
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Claims (JSON)
                    </label>
                    <textarea
                      value={formData.claims}
                      onChange={(e) => setFormData({ ...formData, claims: e.target.value })}
                      className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent font-mono text-sm placeholder-zinc-600"
                      rows={4}
                      placeholder='{"degree": "BSc Computer Science", "gpa": "3.8"}'
                      required
                    />
                    <p className="mt-1 text-xs text-zinc-500">
                      Enter credential claims as valid JSON
                    </p>
                  </div>
                ) : currentTemplate && currentTemplate.fields.length > 0 ? (
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      {currentTemplate.name} Details
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {currentTemplate.fields.map(field => (
                        <div key={field.key} className={field.type === 'text' && field.key.includes('Name') ? 'col-span-2' : ''}>
                          <label className="block text-xs text-zinc-500 mb-1">
                            {field.label} {field.required && <span className="text-red-400">*</span>}
                          </label>
                          {field.type === 'select' ? (
                            <select
                              value={templateFields[field.key] || ''}
                              onChange={(e) => setTemplateFields({ ...templateFields, [field.key]: e.target.value })}
                              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent text-sm"
                              required={field.required}
                            >
                              <option value="">Select...</option>
                              {field.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type}
                              value={templateFields[field.key] || ''}
                              onChange={(e) => setTemplateFields({ ...templateFields, [field.key]: e.target.value })}
                              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent text-sm placeholder-zinc-600"
                              placeholder={field.placeholder}
                              required={field.required}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isIssuing || ipfsStatus !== 'ready'}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-lg hover:bg-zinc-200 disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isIssuing ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Storing on IPFS & Issuing...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Issue Credential
                    </>
                  )}
                </button>
              </form>

              {result && (
                <div
                  className={`mt-6 p-4 rounded-lg border ${
                    result.success
                      ? 'bg-green-900/20 border-green-800 text-green-400'
                      : 'bg-red-900/20 border-red-800 text-red-400'
                  }`}
                >
                  <p className="font-medium flex items-center gap-2">
                    {result.success && <CheckCircle size={18} />}
                    {result.success ? 'Success!' : 'Error'}
                  </p>
                  <p className="text-sm mt-1 break-all">{result.message}</p>
                  {result.ipfsCid && (
                    <p className="text-sm mt-2 font-mono text-zinc-300">
                      📦 IPFS CID: {result.ipfsCid}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Revoke Tab */}
          {activeTab === 'revoke' && (
            <div>
              <div className="bg-red-900/10 border border-red-900/30 rounded-lg p-4 mb-6">
                <h3 className="text-red-400 font-medium flex items-center gap-2">
                  <Ban size={18} />
                  Revoke Credential
                </h3>
                <p className="text-sm text-zinc-400 mt-1">
                  Revoked credentials will no longer be considered valid. This action cannot be undone.
                </p>
              </div>

              <form onSubmit={handleRevoke} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Credential ID to Revoke
                  </label>
                  <input
                    type="text"
                    value={revokeCredentialId}
                    onChange={(e) => setRevokeCredentialId(e.target.value)}
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-zinc-600"
                    placeholder="e.g., degree_001"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isRevoking || !revokeCredentialId.trim()}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isRevoking ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Revoking...
                    </>
                  ) : (
                    <>
                      <XCircle size={20} />
                      Revoke Credential
                    </>
                  )}
                </button>
              </form>

              {/* Quick revoke from list */}
              {issuedCredentials.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-sm font-medium text-zinc-300 mb-3">Quick Revoke from Issued Credentials</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {issuedCredentials.filter(c => !c.isRevoked).map(cred => (
                      <div key={cred.credentialId} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                        <div>
                          <p className="text-white font-mono text-sm">{cred.credentialId}</p>
                          <p className="text-xs text-zinc-500">Holder: {cred.holder.slice(0, 10)}...{cred.holder.slice(-8)}</p>
                        </div>
                        <button
                          onClick={() => setRevokeCredentialId(cred.credentialId)}
                          className="px-3 py-1 text-sm bg-red-900/30 text-red-400 rounded hover:bg-red-900/50 transition-colors"
                        >
                          Select
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Credentials Tab */}
          {activeTab === 'credentials' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={credentialFilter}
                    onChange={(e) => setCredentialFilter(e.target.value)}
                    placeholder="Search by ID or holder address..."
                    className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent placeholder-zinc-600 text-sm"
                  />
                </div>
                <button
                  onClick={loadIssuedCredentials}
                  disabled={isLoadingCredentials}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors ml-3"
                >
                  <RefreshCw size={18} className={isLoadingCredentials ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>

              {isLoadingCredentials ? (
                <SkeletonCredentialList />
              ) : filteredCredentials.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <FileText size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No credentials found</p>
                  <p className="text-sm mt-1">Issue your first credential to see it here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCredentials.map(cred => (
                    <div
                      key={cred.credentialId}
                      className={`p-4 rounded-lg border ${
                        cred.isRevoked
                          ? 'bg-red-900/10 border-red-900/30'
                          : 'bg-zinc-800 border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-white">{cred.credentialId}</p>
                            {cred.isRevoked && (
                              <span className="px-2 py-0.5 text-xs bg-red-900/50 text-red-400 rounded">
                                Revoked
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-400 mt-1">
                            Holder: {cred.holder}
                          </p>
                        </div>
                        {!cred.isRevoked && (
                          <button
                            onClick={() => {
                              setRevokeCredentialId(cred.credentialId);
                              setActiveTab('revoke');
                            }}
                            className="px-3 py-1.5 text-sm bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 transition-colors"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Register DID Tab */}
          {activeTab === 'register' && (
            <div>
              {hasDID ? (
                <div className="bg-green-900/20 border border-green-800 rounded-lg p-6 text-center">
                  <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
                  <h3 className="text-xl font-medium text-white mb-2">DID Already Registered</h3>
                  <p className="text-zinc-400">
                    Your issuer DID is already registered on the blockchain. You can start issuing credentials.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-blue-900/10 border border-blue-900/30 rounded-lg p-4 mb-6">
                    <h3 className="text-blue-400 font-medium flex items-center gap-2">
                      <UserPlus size={18} />
                      Register Issuer DID
                    </h3>
                    <p className="text-sm text-zinc-400 mt-1">
                      Register your Decentralized Identifier (DID) as an issuer to start issuing verifiable credentials.
                    </p>
                  </div>

                  <form onSubmit={handleRegisterDID} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        DID Identifier <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={didName}
                        onChange={(e) => setDidName(e.target.value)}
                        className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent font-mono text-sm placeholder-zinc-600"
                        placeholder="e.g., did:idverse:issuer123"
                        required
                      />
                      <p className="mt-1 text-xs text-zinc-500">
                        Your unique decentralized identifier
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Document URI (Optional)
                      </label>
                      <input
                        type="text"
                        value={docPointer}
                        onChange={(e) => setDocPointer(e.target.value)}
                        className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 text-white rounded-lg focus:ring-2 focus:ring-white focus:border-transparent font-mono text-sm placeholder-zinc-600"
                        placeholder="e.g., ipfs://QmYourDocumentHash or https://..."
                      />
                      <p className="mt-1 text-xs text-zinc-500">
                        Optional URI pointing to your DID document
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isRegistering}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-lg hover:bg-zinc-200 disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {isRegistering ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Registering...
                        </>
                      ) : (
                        <>
                          <UserPlus size={20} />
                          Register DID
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

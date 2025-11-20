import { useState } from 'react';
import { web3Service } from '../services/web3';
import { Send, Loader2 } from 'lucide-react';

export default function IssuerPage() {
  const [formData, setFormData] = useState({
    credentialId: '',
    holderAddress: '',
    credentialType: '',
    claims: '',
  });
  const [isIssuing, setIsIssuing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIssuing(true);
    setResult(null);

    try {
      const credentialData = {
        type: formData.credentialType,
        credentialSubject: {
          id: formData.holderAddress,
          ...JSON.parse(formData.claims || '{}'),
        },
        issuedAt: new Date().toISOString(),
      };

      const { hash } = await web3Service.issueCredential(
        formData.credentialId,
        credentialData,
        'ipfs://demo-cid-' + Date.now()
      );

      setResult({
        success: true,
        message: `Credential issued successfully! Transaction: ${hash}`,
      });

      // Reset form
      setFormData({
        credentialId: '',
        holderAddress: '',
        credentialType: '',
        claims: '',
      });
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || 'Failed to issue credential',
      });
    } finally {
      setIsIssuing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Issue Credential</h1>
        <p className="text-gray-600 mb-8">
          Create and issue a new verifiable credential on the blockchain
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credential ID
            </label>
            <input
              type="text"
              value={formData.credentialId}
              onChange={(e) => setFormData({ ...formData, credentialId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., degree_001"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Holder Address
            </label>
            <input
              type="text"
              value={formData.holderAddress}
              onChange={(e) => setFormData({ ...formData, holderAddress: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="0x..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credential Type
            </label>
            <input
              type="text"
              value={formData.credentialType}
              onChange={(e) => setFormData({ ...formData, credentialType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., UniversityDegree"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Claims (JSON)
            </label>
            <textarea
              value={formData.claims}
              onChange={(e) => setFormData({ ...formData, claims: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              rows={4}
              placeholder='{"degree": "BSc Computer Science", "gpa": "3.8"}'
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter credential claims as valid JSON
            </p>
          </div>

          <button
            type="submit"
            disabled={isIssuing}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isIssuing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Issuing Credential...
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
            className={`mt-6 p-4 rounded-lg ${
              result.success
                ? 'bg-green-100 border border-green-400 text-green-700'
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}
          >
            <p className="font-medium">{result.success ? 'Success!' : 'Error'}</p>
            <p className="text-sm mt-1 break-all">{result.message}</p>
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">💡 Example Credential</h3>
          <pre className="text-xs text-blue-800 overflow-x-auto">
{`Credential ID: degree_alice_001
Holder Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Credential Type: UniversityDegree
Claims: {"degree": "BSc Computer Science", "university": "Example University", "gpa": "3.8"}`}
          </pre>
        </div>
      </div>
    </div>
  );
}

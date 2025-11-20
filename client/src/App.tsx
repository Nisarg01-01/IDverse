import { useState } from 'react';
import { type WalletState } from './services/web3';
import WalletConnect from './components/WalletConnect';
import IssuerPage from './pages/IssuerPage';
import { Wallet, FileText, CheckCircle } from 'lucide-react';

function App() {
  const [wallet, setWallet] = useState<WalletState | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <FileText className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">IDverse</h1>
                <p className="text-sm text-gray-600">Decentralized Identity Management</p>
              </div>
            </div>

            {wallet?.isConnected && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Connected Wallet</p>
                  <p className="text-sm font-mono font-medium text-gray-900">
                    {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                  <CheckCircle size={16} />
                  <span className="text-sm font-medium">{wallet.balance} ETH</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {!wallet?.isConnected ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md w-full">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                  <Wallet className="text-white" size={40} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
                Welcome to IDverse
              </h2>
              <p className="text-gray-600 text-center mb-8">
                Connect your wallet to start issuing verifiable credentials on the blockchain
              </p>
              <WalletConnect onWalletConnected={setWallet} />
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="text-blue-600" size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Issue Credentials</h3>
                <p className="text-sm text-gray-600">
                  Create and issue verifiable credentials stored on-chain
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Verify Identity</h3>
                <p className="text-sm text-gray-600">
                  Instant verification of credentials without intermediaries
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Wallet className="text-purple-600" size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Self-Sovereign</h3>
                <p className="text-sm text-gray-600">
                  Full control over your identity data with blockchain security
                </p>
              </div>
            </div>
          </div>
        ) : (
          <IssuerPage />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-sm text-gray-600">
        <p>IDverse - Phase 1 Demo (70% Completion)</p>
        <p className="mt-1">Built with Ethereum, React, and TypeScript</p>
      </footer>
    </div>
  );
}

export default App;


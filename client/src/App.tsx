import { useState } from 'react';
import { type WalletState } from './services/web3';
import WalletConnect from './components/WalletConnect';
import IssuerPage from './pages/IssuerPage';
import VerifierPage from './pages/VerifierPage';
import HolderPage from './pages/HolderPage';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Wallet, FileText, CheckCircle } from 'lucide-react';

function AppContent() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [activeTab, setActiveTab] = useState<'issuer' | 'holder' | 'verifier'>('issuer');

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <FileText className="text-black" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">IDverse</h1>
                <p className="text-sm text-zinc-400">Decentralized Identity Management</p>
              </div>
            </div>

            {wallet?.isConnected && (
              <div className="flex items-center gap-4">
                {wallet.chainId !== 31337 && (
                  <div className="px-3 py-1 bg-red-900/30 text-red-400 rounded-full text-xs font-medium border border-red-900">
                    Wrong Network (Use Localhost)
                  </div>
                )}
                <div className="text-right">
                  <p className="text-xs text-zinc-500">Connected Wallet</p>
                  <p className="text-sm font-mono font-medium text-zinc-200">
                    {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-200 rounded-lg border border-zinc-700">
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
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl p-12 max-w-md w-full">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
                  <Wallet className="text-white" size={40} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-center text-white mb-4">
                Welcome to IDverse
              </h2>
              <p className="text-zinc-400 text-center mb-8">
                Connect your wallet to start issuing verifiable credentials on the blockchain
              </p>
              <WalletConnect onWalletConnected={setWallet} />
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center mb-4 border border-zinc-700">
                  <FileText className="text-white" size={24} />
                </div>
                <h3 className="font-semibold text-white mb-2">Issue Credentials</h3>
                <p className="text-sm text-zinc-400">
                  Create and issue verifiable credentials stored on-chain
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center mb-4 border border-zinc-700">
                  <CheckCircle className="text-white" size={24} />
                </div>
                <h3 className="font-semibold text-white mb-2">Verify Identity</h3>
                <p className="text-sm text-zinc-400">
                  Instant verification of credentials without intermediaries
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center mb-4 border border-zinc-700">
                  <Wallet className="text-white" size={24} />
                </div>
                <h3 className="font-semibold text-white mb-2">Self-Sovereign</h3>
                <p className="text-sm text-zinc-400">
                  Full control over your identity data with blockchain security
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-center mb-8">
              <div className="bg-zinc-900 rounded-lg p-1 inline-flex border border-zinc-800">
                <button
                  onClick={() => setActiveTab('issuer')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'issuer'
                      ? 'bg-white text-black'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  Issuer Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('holder')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'holder'
                      ? 'bg-white text-black'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  Holder Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('verifier')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'verifier'
                      ? 'bg-white text-black'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  Verifier Dashboard
                </button>
              </div>
            </div>

            {activeTab === 'issuer' && <IssuerPage />}
            {activeTab === 'holder' && <HolderPage />}
            {activeTab === 'verifier' && <VerifierPage />}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-sm text-zinc-600 border-t border-zinc-900">
        <p>IDverse - Production Ready</p>
        <p className="mt-1">Built with Ethereum, IPFS (Helia), React, and TypeScript</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
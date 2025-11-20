import { useState } from 'react';
import { web3Service, type WalletState } from '../services/web3';
import { Wallet } from 'lucide-react';

interface WalletConnectProps {
  onWalletConnected: (wallet: WalletState) => void;
}

export default function WalletConnect({ onWalletConnected }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const walletState = await web3Service.connectWallet();
      onWalletConnected(walletState);
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        <Wallet size={20} />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {error && (
        <div className="px-4 py-2 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <p className="text-sm text-gray-600 text-center max-w-md">
        Connect your MetaMask wallet to interact with IDverse contracts.
        Make sure you're on the local network (localhost:8545).
      </p>
    </div>
  );
}

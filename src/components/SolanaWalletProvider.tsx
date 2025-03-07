import React, { FC, ReactNode, useMemo, useEffect, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CoinbaseWalletAdapter,
  LedgerWalletAdapter,
  SolongWalletAdapter,
  CloverWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl, Connection } from '@solana/web3.js';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

// Ensure Buffer is available
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = require('buffer').Buffer;
}

// Import the styles for the wallet adapter
import '@solana/wallet-adapter-react-ui/styles.css';

// Import Theme for styling
import { Theme } from '../styles/theme';

interface SolanaWalletProviderProps {
  children: ReactNode;
  network?: WalletAdapterNetwork;
}

// Default styles for the wallet adapter modal
const walletModalStyles = {
  adapter: {
    width: '100%',
    padding: '16px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    marginBottom: '8px',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      borderColor: '#6366f1'
    }
  },
  container: {
    padding: '24px',
    borderRadius: '12px',
    maxWidth: '450px',
    width: '100%'
  }
};

// Function to detect the network from Phantom wallet
const detectPhantomNetwork = async (): Promise<WalletAdapterNetwork> => {
  if (typeof window === 'undefined' || !window.solana || !window.solana.isPhantom) {
    console.log('Phantom wallet not detected, defaulting to mainnet');
    return WalletAdapterNetwork.Mainnet;
  }

  try {
    // Check if we can access the Phantom wallet's network information
    if (window.solana && window.solana.isPhantom) {
      // Try to get the current RPC endpoint from Phantom
      // This is a more reliable way to detect the network
      const endpoint = window.solana.publicKey ? await window.solana._network : null;
      
      console.log('Detected Phantom endpoint:', endpoint);
      
      // Check if the endpoint contains network identifiers
      if (endpoint) {
        if (endpoint.includes('devnet')) {
          console.log('Detected Devnet from endpoint');
          return WalletAdapterNetwork.Devnet;
        } else if (endpoint.includes('testnet')) {
          console.log('Detected Testnet from endpoint');
          return WalletAdapterNetwork.Testnet;
        } else if (endpoint.includes('mainnet')) {
          console.log('Detected Mainnet from endpoint');
          return WalletAdapterNetwork.Mainnet;
        }
      }
      
      // If we can't determine from the endpoint, try to use the connection property
      if (window.solana.connection && window.solana.connection._rpcEndpoint) {
        const rpcEndpoint = window.solana.connection._rpcEndpoint;
        console.log('Detected RPC endpoint from connection:', rpcEndpoint);
        
        if (rpcEndpoint.includes('devnet')) {
          console.log('Detected Devnet from connection');
          return WalletAdapterNetwork.Devnet;
        } else if (rpcEndpoint.includes('testnet')) {
          console.log('Detected Testnet from connection');
          return WalletAdapterNetwork.Testnet;
        } else if (rpcEndpoint.includes('mainnet')) {
          console.log('Detected Mainnet from connection');
          return WalletAdapterNetwork.Mainnet;
        }
      }
    }
    
    // If we can't determine the network, default to devnet
    // This is a safer default for development
    console.log('Could not determine network, defaulting to devnet');
    return WalletAdapterNetwork.Devnet;
  } catch (error) {
    console.error('Error detecting Phantom network:', error);
    // Default to devnet on error
    return WalletAdapterNetwork.Devnet;
  }
};

export const SolanaWalletProvider: FC<SolanaWalletProviderProps> = ({ 
  children,
  network: initialNetwork = WalletAdapterNetwork.Devnet // Default to devnet for development
}) => {
  const [network, setNetwork] = useState<WalletAdapterNetwork>(initialNetwork);
  const [initialized, setInitialized] = useState(false);
  
  // Detect the network from Phantom wallet
  useEffect(() => {
    const detectNetwork = async () => {
      try {
        const detectedNetwork = await detectPhantomNetwork();
        setNetwork(detectedNetwork);
        console.log('Using Solana network:', detectedNetwork);
      } catch (error) {
        console.error('Error in network detection:', error);
        // Keep using the current network on error
      }
    };
    
    detectNetwork();
  }, []);
  
  // You can also provide a custom RPC endpoint
  const endpoint = useMemo(() => {
    console.log('Using Solana endpoint for network:', network);
    return clusterApiUrl(network);
  }, [network]);

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new LedgerWalletAdapter(),
      new SolongWalletAdapter(),
      new CloverWalletAdapter(),
      new TorusWalletAdapter(),
    ],
    []
  );

  useEffect(() => {
    console.log('SolanaWalletProvider mounted');
    console.log('Available wallets:', wallets.map(w => w.name));
    
    // Initialize each wallet adapter
    wallets.forEach(wallet => {
      if (wallet.readyState === 'NotDetected') {
        console.log(`Wallet ${wallet.name} not detected`);
      } else {
        console.log(`Wallet ${wallet.name} is ${wallet.readyState}`);
      }
    });
    
    setInitialized(true);
    
    return () => {
      console.log('SolanaWalletProvider unmounted');
    };
  }, [wallets]);

  const handleWalletConnect = (publicKey: any) => {
    console.log('Wallet connected event:', publicKey?.toString());
    
    // Re-detect network when wallet connects
    detectPhantomNetwork().then(detectedNetwork => {
      if (detectedNetwork !== network) {
        console.log('Network changed after wallet connection:', detectedNetwork);
        setNetwork(detectedNetwork);
      }
    }).catch(error => {
      console.error('Error detecting network after connection:', error);
    });
  };

  const handleWalletDisconnect = () => {
    console.log('Wallet disconnected event');
  };

  const handleWalletError = (error: any) => {
    console.error('Wallet error event:', error);
  };

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect={true}
        onError={handleWalletError}
      >
        <WalletModalProvider 
          className="wallet-modal-provider" 
        >
          {children}
          {initialized && (
            <style dangerouslySetInnerHTML={{
              __html: `
              .wallet-adapter-modal {
                z-index: 1500 !important;
              }
              .wallet-adapter-modal-wrapper {
                background-color: #1a1b25 !important;
                border: 1px solid rgba(255, 255, 255, 0.12) !important;
                border-radius: 12px !important;
                max-width: 450px !important;
                width: 100% !important;
              }
              .wallet-adapter-modal-title {
                color: white !important;
                font-size: 18px !important;
                font-weight: 600 !important;
                margin-bottom: 16px !important;
              }
              .wallet-adapter-modal-button-close {
                background-color: transparent !important;
              }
              .wallet-adapter-button {
                background-color: #6366f1 !important;
                border-radius: 8px !important;
                height: 48px !important;
                transition: all 0.2s !important;
              }
              .wallet-adapter-button:hover {
                background-color: #4f46e5 !important;
              }
              .wallet-adapter-modal-list {
                margin: 0 0 4px !important;
              }
              .wallet-adapter-modal-list li {
                margin: 0 0 8px !important;
              }
              .wallet-adapter-modal-list-more {
                color: #6366f1 !important;
                margin-top: 8px !important;
              }
              .wallet-adapter-dropdown-list {
                background-color: #1a1b25 !important;
              }
              .wallet-adapter-dropdown-list-item {
                border-color: rgba(255, 255, 255, 0.12) !important;
              }
              .wallet-adapter-modal-list .wallet-adapter-button {
                font-weight: 500 !important;
              }
            `}} />
          )}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default SolanaWalletProvider; 
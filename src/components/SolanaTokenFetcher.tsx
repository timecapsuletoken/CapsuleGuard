import React, { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { TokenDetails } from './TokenFetcher';

// Ensure Buffer is available
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = require('buffer').Buffer;
}

export interface SolanaTokenDetails {
  name: string;
  symbol: string;
  address: string;
  mint: string;
  decimals: number;
  balance: number;
}

interface SolanaTokenFetcherProps {
  onTokensFetched: (tokens: TokenDetails[]) => void;
}

export const SolanaTokenFetcher: React.FC<SolanaTokenFetcherProps> = ({ onTokensFetched }) => {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      if (!publicKey || !connected) {
        console.log('Solana wallet not connected, skipping token fetch');
        onTokensFetched([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log('Fetching Solana tokens for wallet:', publicKey.toString());
        
        // Add SOL balance first
        const solanaTokens: SolanaTokenDetails[] = [];
        try {
          const solBalance = await connection.getBalance(publicKey);
          console.log('SOL balance:', solBalance / LAMPORTS_PER_SOL);
          
          solanaTokens.push({
            name: 'Solana',
            symbol: 'SOL',
            address: 'native',
            mint: 'native',
            decimals: 9,
            balance: solBalance / LAMPORTS_PER_SOL // Convert lamports to SOL
          });
        } catch (err) {
          console.error('Error fetching SOL balance:', err);
        }
        
        // Fetch all token accounts owned by the wallet
        try {
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            publicKey,
            { programId: TOKEN_PROGRAM_ID }
          );

          console.log('Found token accounts:', tokenAccounts.value.length);
          
          // Process token accounts to get token details
          for (const tokenAccount of tokenAccounts.value) {
            try {
              const accountData = tokenAccount.account.data.parsed.info;
              const mint = accountData.mint;
              const balance = accountData.tokenAmount.uiAmount;
              
              // Skip tokens with zero balance
              if (balance === 0) continue;
              
              console.log('Processing token:', mint, 'with balance:', balance);
              
              // Get token metadata (this is simplified, in a real app you'd fetch from a token registry)
              const tokenSymbol = mint.substring(0, 4); // Placeholder
              const tokenName = `Solana Token ${tokenSymbol}`; // Placeholder
              
              solanaTokens.push({
                name: tokenName,
                symbol: tokenSymbol,
                address: tokenAccount.pubkey.toString(),
                mint: mint,
                decimals: accountData.tokenAmount.decimals,
                balance: balance
              });
            } catch (tokenErr) {
              console.error('Error processing token account:', tokenErr);
            }
          }
        } catch (tokenAccountsErr) {
          console.error('Error fetching token accounts:', tokenAccountsErr);
        }
        
        // Convert SolanaTokenDetails to TokenDetails
        const tokens: TokenDetails[] = solanaTokens.map(token => ({
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          balance: token.balance.toString(),
          decimals: token.decimals,
          blockchain: 'solana'
        }));
        
        console.log('Sending Solana tokens to parent:', tokens.length);
        onTokensFetched(tokens);
      } catch (error) {
        console.error('Error fetching Solana tokens:', error);
        setError('Failed to fetch Solana tokens');
        onTokensFetched([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokens();
  }, [connection, publicKey, connected, onTokensFetched]);

  if (error) {
    console.error('SolanaTokenFetcher error:', error);
  }

  return null; // This component doesn't render anything
};

export default SolanaTokenFetcher; 
import React, { useEffect, useState } from 'react';
import { Eip1193Provider, ethers } from 'ethers';
import axios from "axios";
import { useWallet } from '../App';
import SolanaTokenFetcher from './SolanaTokenFetcher';

export type TokenDetails = {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals?: number;
  blockchain?: 'eth' | 'solana'; // Add blockchain type
};

export const TokenFetcher: React.FC<{
  address: string;
  onTokensFetched: (tokens: TokenDetails[]) => void;
  isConnected: boolean;
}> = ({ address, onTokensFetched, isConnected }) => {
  const [lastFetchedAddress, setLastFetchedAddress] = useState<string | null>(null);
  const { isSolanaConnected, solanaAddress } = useWallet();
  const [ethTokens, setEthTokens] = useState<TokenDetails[]>([]);
  const [solanaTokens, setSolanaTokens] = useState<TokenDetails[]>([]);

  // Handle Solana tokens
  const handleSolanaTokensFetched = (tokens: TokenDetails[]) => {
    setSolanaTokens(tokens);
    // Combine ETH and Solana tokens and pass to the parent component
    onTokensFetched([...ethTokens, ...tokens]);
  };

  useEffect(() => {
    if (isConnected && address && address !== lastFetchedAddress) {
      fetchEthereumTokens().then(tokens => {
        setEthTokens(tokens);
        onTokensFetched([...tokens, ...solanaTokens]);
        setLastFetchedAddress(address);
      });
    }
  }, [isConnected, address]);

  const isSpamToken = (token: TokenDetails): boolean => {
    const spamPatterns = [
      /http/i, // Contains "http" (e.g., URLs)
      /\.com|\.org|\.net/i, // Contains ".com", ".org", ".net", etc.
      /^[!$]/, // Starts with "!" or "$"
      /free|airdrop|rare|spin/i, // Contains suspicious words
    ];
    return spamPatterns.some((pattern) => pattern.test(token.name) || pattern.test(token.symbol));
  };

  const API_KEY = "DXPIM9WJQ5K5S7W5ENCBZEBDUD1GEGEK7M"; // Replace with your actual API key
  const BASE_URL = "https://api.bscscan.com/api";

  const fetchEthereumTokens = async (): Promise<TokenDetails[]> => {
    const fetchedTokens: TokenDetails[] = [];

    try {
      // 1. Fetch Native Token Balance
      const provider = new ethers.BrowserProvider(window.ethereum as unknown as Eip1193Provider);
      const nativeBalance = await provider.getBalance(address);
      const nativeSymbol = (await provider.getNetwork()).name.toUpperCase(); // e.g., "BNB"
      fetchedTokens.push({
        address: "native",
        symbol: nativeSymbol,
        name: `${nativeSymbol} (Native Token)`,
        balance: ethers.formatUnits(nativeBalance, 18),
        blockchain: 'eth'
      });

      // 2. Fetch ERC20 Token Balances Using BscScan API
      const response = await axios.get(BASE_URL, {
        params: {
          module: "account",
          action: "tokentx",
          address: address,
          startblock: 0,
          endblock: 99999999,
          page: 1,
          offset: 10, // Reduced to minimize API usage
          sort: "desc",
          apikey: API_KEY,
        },
      });

      if (response.data.status !== "1" || !response.data.result) {
        console.warn("No token transactions found.");
        return fetchedTokens;
      }

      const tokenTransactions = response.data.result;

      // Aggregate token balances
      const tokenBalances: Record<string, bigint> = {};
      for (const tx of tokenTransactions) {
        const tokenAddress = tx.contractAddress.toLowerCase();
        const decimals = parseInt(tx.tokenDecimal, 10) || 18; // Default to 18 decimals if not provided
        const value = ethers.parseUnits(tx.value, decimals);

        // Track balances (add for incoming, subtract for outgoing)
        if (tx.to.toLowerCase() === address.toLowerCase()) {
          tokenBalances[tokenAddress] = (tokenBalances[tokenAddress] || 0n) + value;
        } else if (tx.from.toLowerCase() === address.toLowerCase()) {
          tokenBalances[tokenAddress] = (tokenBalances[tokenAddress] || 0n) - value;
        }
      }

      // Fetch token details and format balances
      for (const [tokenAddress, balance] of Object.entries(tokenBalances)) {
        if (balance > 0n) {
          try {
            const contract = new ethers.Contract(tokenAddress, [
              "function symbol() view returns (string)",
              "function name() view returns (string)",
              "function decimals() view returns (uint8)",
            ], provider);

            const symbol = await contract.symbol();
            const name = await contract.name();
            const decimals = await contract.decimals();

            if (!isSpamToken({ address: tokenAddress, symbol, name, balance: "", decimals: 0 })) {
              fetchedTokens.push({
                address: tokenAddress,
                symbol,
                name,
                balance: ethers.formatUnits(balance, decimals),
                decimals,
                blockchain: 'eth'
              });
            }
          } catch (error) {
            console.warn(`Failed to fetch token details for ${tokenAddress}:`, error);
          }
        }
      }

      return fetchedTokens;
    } catch (error) {
      console.error("Error fetching Ethereum tokens:", error);
      return fetchedTokens;
    }
  };

  return (
    <>
      {isSolanaConnected && (
        <SolanaTokenFetcher onTokensFetched={handleSolanaTokensFetched} />
      )}
    </>
  );
};

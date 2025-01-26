import React, { useEffect, useState } from 'react';
import { Eip1193Provider, ethers } from 'ethers';
import axios from "axios";

export type TokenDetails = {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals?: number; // Add optional decimals property
};

export const TokenFetcher: React.FC<{
  address: string;
  onTokensFetched: (tokens: TokenDetails[]) => void;
  isConnected: boolean;
}> = ({ address, onTokensFetched, isConnected }) => {
  const [lastFetchedAddress, setLastFetchedAddress] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address && address !== lastFetchedAddress) {
      fetchAssets();
      setLastFetchedAddress(address);
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

  const fetchAssets = async () => {
    try {
      const fetchedTokens: TokenDetails[] = [];

      // 1. Fetch Native Token Balance
      const provider = new ethers.BrowserProvider(window.ethereum as unknown as Eip1193Provider);
      const nativeBalance = await provider.getBalance(address);
      const nativeSymbol = (await provider.getNetwork()).name.toUpperCase(); // e.g., "BNB"
      fetchedTokens.push({
        address: "native",
        symbol: nativeSymbol,
        name: `${nativeSymbol} (Native Token)`,
        balance: ethers.formatUnits(nativeBalance, 18),
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
        onTokensFetched(fetchedTokens);
        return;
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
            ], provider);

            const symbol = await contract.symbol();
            const name = await contract.name();

            if (!isSpamToken({ address: tokenAddress, symbol, name, balance: "", decimals: 0 })) {
              fetchedTokens.push({
                address: tokenAddress,
                symbol,
                name,
                balance: ethers.formatUnits(balance, 18),
              });
            }
          } catch (error) {
            console.warn(`Failed to fetch token details for ${tokenAddress}:`, error);
          }
        }
      }

      onTokensFetched(fetchedTokens);
    } catch (error) {
      console.error("Error fetching wallet assets:", error);
      onTokensFetched([]);
    }
  };

  return null; // This component doesn't render anything, it's just a logic wrapper
};

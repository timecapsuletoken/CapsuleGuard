import React, { useEffect } from 'react';
import { Eip1193Provider, ethers } from 'ethers';

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
  useEffect(() => {
    if (isConnected && address) {
      fetchAssets();
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

  const isSpamByBalance = (balance: bigint, decimals: number): boolean => {
    const formattedBalance = Number(ethers.formatUnits(balance, decimals));
    return formattedBalance > 1_000_000; // Ignore tokens with more than 1 million units
  };  

  const fetchAssets = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as unknown as Eip1193Provider);
      const erc20Abi = [
        'function balanceOf(address owner) view returns (uint256)',
        'function symbol() view returns (string)',
        'function name() view returns (string)',
        'function decimals() view returns (uint8)',
      ];
  
      const fetchedTokens: TokenDetails[] = [];
  
      // 1. Fetch Native Token Balance
      const nativeBalance = await provider.getBalance(address);
      const nativeSymbol = (await provider.getNetwork()).name.toUpperCase(); // Use network name as native token symbol (e.g., "BNB", "ETH")
      fetchedTokens.push({
        address: 'native',
        symbol: nativeSymbol,
        name: `${nativeSymbol} (Native Token)`,
        balance: ethers.formatUnits(nativeBalance, 18), // Native tokens generally use 18 decimals
      });
  
      // 2. Fetch ERC20 Token Balances via Transfer Logs
      const transferTopic = ethers.id('Transfer(address,address,uint256)');
      const logs = await provider.getLogs({
        fromBlock: 'earliest',
        toBlock: 'latest',
        topics: [transferTopic, null, ethers.zeroPadValue(address, 32)],
      });
  
      const tokenAddresses = Array.from(new Set(logs.map((log) => log.address)));
  
      for (const contractAddress of tokenAddresses) {
        try {
          const contract = new ethers.Contract(contractAddress, erc20Abi, provider);
  
          const balance = await contract.balanceOf(address);
          if (balance > 0n) {
            const symbol = await contract.symbol();
            const name = await contract.name();
            const decimals = await contract.decimals();
  
            if (!isSpamToken({ address: contractAddress, symbol, name, balance: '', decimals }) &&
                !isSpamByBalance(balance, decimals)) {
              fetchedTokens.push({
                address: contractAddress,
                symbol,
                name,
                balance: ethers.formatUnits(balance, decimals),
              });
            } else {
              console.warn(`Filtered spam token: ${name} (${symbol})`);
            }
          }
        } catch (error) {
          console.warn(`Skipping invalid token contract: ${contractAddress}`);
          console.error("Error", error);
        }
      }
  
      onTokensFetched(fetchedTokens);
    } catch (error) {
      console.error('Error fetching assets:', error);
      onTokensFetched([]);
    }
  };  

  return null; // This component doesn't render anything, it's just a logic wrapper
};

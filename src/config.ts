// src/config.ts
export const PROJECT_ID = import.meta.env.VITE_PROJECT_ID;
export const TCA_TOKEN_ADDRESS = import.meta.env.VITE_TCA_TOKEN_ADDRESS;
export const CONTRACT_ADDRESSES: { [key: number]: string } = {
    1: "NoDeployedContractYet", // Ethereum Mainnet
    56: "NoDeployedContractYet", // BNB Smart Chain
    97: "0xE35f0E90d7e1206B8cc4fc20C665e9F17f42ef7c", // BNB Testnet
    42161: "NoDeployedContractYet", // Arbitrum
    421614: "0xe835Ae8Db895A4D3586b4183cDC65d0E79f3E056", // Arbitrum Testnet
    25: "NoDeployedContractYet", // Cronos
    338: "NoDeployedContractYet", // Cronos Testnet
    10: "NoDeployedContractYet", // Optimism
    11155420: "0x3Ec9C603b4381f8C8Ea7C9e85BAc8C0FdEac3fD4", // Optimism Testnet
    137: "NoDeployedContractYet", // Polygon  
    2442: "0x3Ec9C603b4381f8C8Ea7C9e85BAc8C0FdEac3fD4", // Polygon Testnet
    43114: "NoDeployedContractYet", // Avalanche
    8453: "NoDeployedContractYet", // Base 
    84532: "0xCc9Fc27D8f44BFB691C412f6326fC20dB6263800", // Base Sepolia Testnet
    59144: "NoDeployedContractYet", // Linea
};  

export const PAIR_ADDRESS = import.meta.env.VITE_PAIR_ADDRESS;

// Solana contract addresses
export const SOLANA_CONTRACT_ADDRESSES = {
  mainnet: "SolanaMainnetContractAddress",
  devnet: "SolanaDevnetContractAddress",
  testnet: "SolanaTestnetContractAddress",
};

// Solana network configuration
export const SOLANA_NETWORKS = {
  mainnet: {
    name: "Mainnet",
    endpoint: "https://api.mainnet-beta.solana.com",
    explorerUrl: "https://explorer.solana.com",
  },
  devnet: {
    name: "Devnet",
    endpoint: "https://api.devnet.solana.com",
    explorerUrl: "https://explorer.solana.com/?cluster=devnet",
  },
  testnet: {
    name: "Testnet",
    endpoint: "https://api.testnet.solana.com",
    explorerUrl: "https://explorer.solana.com/?cluster=testnet",
  },
};

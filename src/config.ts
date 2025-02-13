// src/config.ts
export const PROJECT_ID = import.meta.env.VITE_PROJECT_ID;
export const TCA_TOKEN_ADDRESS = import.meta.env.VITE_TCA_TOKEN_ADDRESS;
export const CONTRACT_ADDRESSES: { [key: number]: string } = {
    1: "0xEthereumContractAddress", // Ethereum Mainnet
    56: "0xBscContractAddress", // BNB Smart Chain
    97: "0x3861d5328dc3557ea96d167f8ca22c78f2110dcd", // BNB Testnet
    42161: "0xArbitrumContractAddress", // Arbitrum
    421614: "0xe835Ae8Db895A4D3586b4183cDC65d0E79f3E056", // Arbitrum Testnet
    25: "0xCronosContractAddress", // Cronos
    338: "0xCronosTestContractAddress", // Cronos Testnet
    10: "0xOptimismContractAddress", // Optimism
    11155420: "0x3Ec9C603b4381f8C8Ea7C9e85BAc8C0FdEac3fD4", // Optimism Testnet
    137: "0xPolygonContractAddress", // Polygon  
    2442: "0x3Ec9C603b4381f8C8Ea7C9e85BAc8C0FdEac3fD4", // Polygon Testnet
    43114: "0xAvalancheContractAddress", // Avalanche
    8453: "0xBaseContractAddress", // Base
    59144: "0xLineaContractAddress", // Linea
  };  

export const PAIR_ADDRESS = import.meta.env.VITE_PAIR_ADDRESS;

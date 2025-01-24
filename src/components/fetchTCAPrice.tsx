import { Eip1193Provider, ethers } from "ethers";
import { TCA_TOKEN_ADDRESS, PAIR_ADDRESS } from "../config";

// Addresses
const PAIR_CONTRACT_ADDRESS = PAIR_ADDRESS; // Token-BNB pair address
const TCA_ADDRESS = TCA_TOKEN_ADDRESS; // Your token address
const TCA_DECIMALS = 18; // Decimals for your token

// PancakeSwap Pair ABI (Minimal for getReserves)
const PAIR_ABI = [
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() view returns (address)",
];

export const fetchTCAPrice = async (): Promise<number | null> => {
  try {
    // Ensure MetaMask or compatible provider is available
    if (!window.ethereum) {
      throw new Error("No Ethereum provider found. Please install MetaMask.");
    }

    // Connect to a provider
    const provider = new ethers.BrowserProvider(window.ethereum as unknown as Eip1193Provider);
    
    const pairContract = new ethers.Contract(PAIR_CONTRACT_ADDRESS, PAIR_ABI, provider);

    // Fetch reserves
    const [reserve0, reserve1] = await pairContract.getReserves();

    // Identify token0
    const token0 = await pairContract.token0();

    // Determine TCA reserve and BNB reserve
    const tcaReserve =
      token0.toLowerCase() === TCA_ADDRESS.toLowerCase() ? reserve0 : reserve1;
    const bnbReserve =
      token0.toLowerCase() === TCA_ADDRESS.toLowerCase() ? reserve1 : reserve0;

    // Ensure valid reserves
    if (!tcaReserve || !bnbReserve) {
      throw new Error("Invalid reserves fetched from the pair contract.");
    }

    // Fetch BNB price in USD
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd"
    );

    if (!response.ok) {
      throw new Error("Failed to fetch BNB price from Coingecko.");
    }

    const data = await response.json();
    const bnbPriceUSD = data?.binancecoin?.usd;

    if (!bnbPriceUSD) {
      throw new Error("BNB price in USD is unavailable.");
    }

    // Calculate TCA price in USD
    const tcaPriceUSD =
      (bnbPriceUSD * Number(ethers.formatUnits(bnbReserve, TCA_DECIMALS))) /
      Number(ethers.formatUnits(tcaReserve, TCA_DECIMALS));

    return parseFloat(tcaPriceUSD.toFixed(6)); // Return the price with 6 decimals
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching TCA price:", error.message);
    } else {
      console.error("Error fetching TCA price:", error);
    }
    return null;
  }
};

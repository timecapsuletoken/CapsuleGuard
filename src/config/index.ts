import { PublicKey, Cluster } from '@solana/web3.js';

// Updated Program ID from the newly deployed contract that supports multiple locks per wallet
export const PROGRAM_ID = new PublicKey('CPmuun5rANNdQhsfHHm8xKQQuePjrTw37u9fzVbJZxTq');
// Network is now detected from the wallet
export const COMMITMENT = 'processed';

// USDC devnet mint address (you may need to update this)
export const USDC_MINT = new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr');

// Fee amount in USDC (with 6 decimals)
export const LOCK_FEE = 5_000_000; // $5 USDC 

// Original contract addresses
export const CONTRACT_ADDRESSES = {
  // Keep existing contract addresses
}; 
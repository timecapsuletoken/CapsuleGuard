import { Connection, PublicKey } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';

export async function getTokenDecimals(connection: Connection, mintAddress: string): Promise<number> {
  try {
    const mintPubkey = new PublicKey(mintAddress);
    const mintInfo = await getMint(connection, mintPubkey);
    return mintInfo.decimals;
  } catch (error) {
    console.error('Error fetching token decimals:', error);
    throw new Error('Invalid token mint address or unable to fetch token information');
  }
}

export function validatePublicKey(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
} 
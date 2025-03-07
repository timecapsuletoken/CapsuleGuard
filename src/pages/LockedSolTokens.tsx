import React, { useEffect, useState, useRef, useContext } from "react";
import { useWallet } from "../App"; // Import wallet context
import { RouterContext } from "../App";
import { useConnection } from '@solana/wallet-adapter-react';
import {
  Box,
  Stack,
  Divider,
  Typography,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Link,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert as MuiAlert,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from "@mui/material";
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import Grid from '@mui/material/Grid2';
import { styled } from '@mui/material/styles';
import { Theme } from "../styles/theme"; // Adjust the path as necessary
import { Connection, PublicKey, Transaction, TransactionInstruction, ComputeBudgetProgram, LAMPORTS_PER_SOL, clusterApiUrl, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PROGRAM_ID, COMMITMENT } from "../config/index";
import { motion } from "framer-motion";
import { notify } from "../utils/toast";
import bs58 from 'bs58';
import { getAssociatedTokenAddress, getMint, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import axios from 'axios';

import Lottie from 'lottie-react';
import KeyIcon from '@mui/icons-material/Key';
import LinkIcon from '@mui/icons-material/Link';
import SafetyCheckIcon from '@mui/icons-material/SafetyCheck';
import InfoIcon from '@mui/icons-material/Info';
import animationData from '../assets/images/animations/notfound.json';
import SolanaLogo from '../assets/images/walletproviders/solana.png';

// Import Solana-related dependencies
import { findProgramAddressSync } from '@project-serum/anchor/dist/cjs/utils/pubkey';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.background.default} !important`, // Add vertical divider
    '&:last-child': {
      borderRight: 'none', // Remove border from the last cell
    },
    color: theme.palette.text.primary,
    textAlign: 'center',
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
    textAlign: 'center',
    color: theme.palette.text.primary,
    borderRight: `1px solid ${theme.palette.background.paper} !important`, // Add vertical divider
    '&:last-child': {
      borderRight: 'none', // Remove border from the last cell
    },
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.background.default,
    border: `solid 1px ${theme.palette.background.paper}`,
    color: theme.palette.primary.dark,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
})); 

// TokenLockInfo account layout
interface TokenLockInfo {
  locker: PublicKey;
  tokenMint: PublicKey;
  lockedAmount: bigint;
  unlockTime: bigint;
  creationTime: bigint;
  seed: bigint;
}

type LockedSolToken = {
  lockAccount: PublicKey;
  lockerAddress: string; 
  tokenAddress: string;
  lockedAmount: string;
  unlockTime: string;
  unlockTimeRaw: bigint;
  isUnlocked: boolean;
  seed: bigint;
  isSPL: boolean;  // Flag to indicate if this is an SPL token
  tokenName?: string; // Optional token name for display
  tokenSymbol?: string; // Optional token symbol for display
  decimals?: number; // Optional decimals for the token
  logoURI?: string; // Optional logo URI for the token
};

// Helper function to format numbers in a human-readable format
const formatNumberHumanReadable = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0';
  
  // Format based on magnitude
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)} Billion`;
  } else if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)} Million`;
  } else if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)} Thousand`;
  } else {
    // For smaller numbers, use 2 decimal places if there are decimals
    return num % 1 === 0 ? num.toString() : num.toFixed(2);
  }
};

const LockedSolTokens: React.FC = () => {
  const { solanaAddress, isSolanaConnected, solanaNetwork } = useWallet(); // Access wallet context
  const { connection } = useConnection(); // Get connection from wallet adapter
  const [lockedTokens, setLockedTokens] = useState<LockedSolToken[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedToken, setSelectedToken] = useState<LockedSolToken | null>(null);
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const notificationShownRef = useRef(false); // Ref to prevent duplicate notifications
  const { navigate } = useContext(RouterContext);

  // Helper function to create instruction data for withdraw_native_tokens
  const createWithdrawNativeTokensInstructionData = (seed: bigint): Buffer => {
    // Discriminator for withdraw_native_tokens from IDL
    const discriminator = Buffer.from([122, 208, 11, 35, 0, 223, 125, 59]);
    
    // Create buffer for seed (u64 = 8 bytes)
    const seedBuffer = Buffer.alloc(8);
    seedBuffer.writeBigUInt64LE(seed, 0);
    
    // Combine all buffers
    return Buffer.concat([discriminator, seedBuffer]);
  };

  // Add a function to create instruction data for withdraw_tokens (SPL)
  const createWithdrawTokensInstructionData = (seed: bigint): Buffer => {
    // Discriminator for withdraw_tokens from IDL
    const discriminator = Buffer.from([2, 4, 225, 61, 19, 182, 106, 170]);
    
    // Create buffer for seed (u64 = 8 bytes)
    const seedBuffer = Buffer.alloc(8);
    seedBuffer.writeBigUInt64LE(seed, 0);
    
    // Combine all buffers
    return Buffer.concat([discriminator, seedBuffer]);
  };

  // Function to fetch token metadata from Solana token list
  const fetchTokenMetadata = async (tokenAddress: string): Promise<{ name: string, symbol: string, logoURI?: string } | null> => {
    try {
      // Try to fetch from Jupiter token list (one of the most comprehensive)
      const response = await axios.get('https://token.jup.ag/all');
      const tokenList = response.data;
      
      // Find the token in the list
      const tokenInfo = tokenList.find((token: any) => token.address === tokenAddress);
      
      if (tokenInfo) {
        return {
          name: tokenInfo.name,
          symbol: tokenInfo.symbol,
          logoURI: tokenInfo.logoURI
        };
      }
      
      // If not found in Jupiter, try Solana token list
      const solanaResponse = await axios.get('https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json');
      const solanaTokenList = solanaResponse.data.tokens;
      
      const solanaTokenInfo = solanaTokenList.find((token: any) => token.address === tokenAddress);
      
      if (solanaTokenInfo) {
        return {
          name: solanaTokenInfo.name,
          symbol: solanaTokenInfo.symbol,
          logoURI: solanaTokenInfo.logoURI
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      return null;
    }
  };

  // Fetch locked tokens
  const fetchLockedTokens = async () => {
    if (!solanaAddress) {
      return;
    }
      
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create a connection if one doesn't exist
      const conn = connection || new Connection(clusterApiUrl(solanaNetwork as WalletAdapterNetwork), COMMITMENT);
      
      // Get all accounts owned by the program
      console.log('Fetching accounts for program:', PROGRAM_ID.toString());
      const programAccounts = await conn.getProgramAccounts(PROGRAM_ID, {
        filters: [
          {
            memcmp: {
              offset: 0, // Discriminator offset
              bytes: bs58.encode(Buffer.from([169, 155, 132, 240, 3, 21, 173, 54])) // TokenLockInfo discriminator
            }
          }
        ]
      });
      
      console.log(`Found ${programAccounts.length} program accounts`);
      
      // Filter accounts that belong to this wallet
      const walletPubkey = new PublicKey(solanaAddress);
      const defaultPubkey = new PublicKey('11111111111111111111111111111111'); // For native SOL
      const foundTokens: LockedSolToken[] = [];
      
      // Cache for token metadata to avoid duplicate fetches
      const tokenMetadataCache: Record<string, { name: string, symbol: string, decimals: number, logoURI?: string }> = {};
      
      for (const account of programAccounts) {
        try {
          // Skip the 8-byte discriminator
          const dataBuffer = account.account.data.slice(8);
          
          // Parse the TokenLockInfo struct
          // locker: Pubkey (32 bytes)
          // tokenMint: Pubkey (32 bytes)
          // lockedAmount: u64 (8 bytes)
          // unlockTime: u64 (8 bytes)
          // creationTime: u64 (8 bytes)
          // seed: u64 (8 bytes)
          
          const lockerPubkey = new PublicKey(dataBuffer.slice(0, 32));
          const tokenMintPubkey = new PublicKey(dataBuffer.slice(32, 64));
          const lockedAmountBigInt = dataBuffer.readBigUInt64LE(64);
          const unlockTimeBigInt = dataBuffer.readBigUInt64LE(72);
          const creationTimeBigInt = dataBuffer.readBigUInt64LE(80);
          const seedBigInt = dataBuffer.readBigUInt64LE(88);
          
          // Check if this account belongs to our wallet
          if (lockerPubkey.equals(walletPubkey) && lockedAmountBigInt > BigInt(0)) {
            
            console.log('Found lock account:', account.pubkey.toString());
            console.log('Locker:', lockerPubkey.toString());
            console.log('Token Mint:', tokenMintPubkey.toString());
            console.log('Locked Amount:', lockedAmountBigInt.toString());
            console.log('Unlock Time:', unlockTimeBigInt.toString());
            console.log('Creation Time:', creationTimeBigInt.toString());
            console.log('Seed:', seedBigInt.toString());
            
            // Convert unlock time from seconds to milliseconds for Date
            const unlockTimeDate = new Date(Number(unlockTimeBigInt) * 1000);
            
            // Check if it's a native SOL token or SPL token
            const isSPL = !tokenMintPubkey.equals(defaultPubkey);
            
            let lockedAmount: string;
            let tokenName = isSPL ? '' : 'SOL';
            let tokenSymbol = isSPL ? '' : 'SOL';
            let decimals = isSPL ? 0 : 9; // Default to 9 for SOL, will be updated for SPL tokens
            let logoURI: string | undefined = isSPL ? undefined : SolanaLogo;
            
            if (isSPL) {
              // For SPL tokens, try to get the token's metadata
              const tokenMintString = tokenMintPubkey.toString();
              
              // Check if we already have metadata for this token
              if (tokenMetadataCache[tokenMintString]) {
                const cachedMetadata = tokenMetadataCache[tokenMintString];
                tokenName = cachedMetadata.name;
                tokenSymbol = cachedMetadata.symbol;
                decimals = cachedMetadata.decimals;
                logoURI = cachedMetadata.logoURI;
                lockedAmount = (Number(lockedAmountBigInt) / Math.pow(10, decimals)).toString();
              } else {
                try {
                  // Fetch token mint info for decimals
                  const mintInfo = await getMint(conn, tokenMintPubkey);
                  decimals = mintInfo.decimals;
                  
                  // Try to get token metadata
                  const metadata = await fetchTokenMetadata(tokenMintString);
                  
                  if (metadata) {
                    tokenName = metadata.name;
                    tokenSymbol = metadata.symbol;
                    logoURI = metadata.logoURI;
                    
                    // Store in cache
                    tokenMetadataCache[tokenMintString] = {
                      name: tokenName,
                      symbol: tokenSymbol,
                      decimals: decimals,
                      logoURI: logoURI
                    };
                  } else {
                    // If metadata not found, use shortened address
                    tokenName = `${tokenMintString.slice(0, 4)}...${tokenMintString.slice(-4)}`;
                    tokenSymbol = `${tokenMintString.slice(0, 4)}...${tokenMintString.slice(-4)}`;
                  }
                  
                  // Convert locked amount based on token decimals
                  lockedAmount = (Number(lockedAmountBigInt) / Math.pow(10, decimals)).toString();
                } catch (error) {
                  console.error('Error fetching token info:', error);
                  // Fallback to default values
                  tokenName = `Unknown Token`;
                  tokenSymbol = `${tokenMintString.slice(0, 4)}...${tokenMintString.slice(-4)}`;
                  lockedAmount = lockedAmountBigInt.toString();
                }
              }
            } else {
              // For native SOL, convert from lamports
              lockedAmount = (Number(lockedAmountBigInt) / LAMPORTS_PER_SOL).toString();
              tokenSymbol = 'SOL';
            }
            
            // Check if the lock period has ended
            const now = new Date();
            const currentTimestamp = Math.floor(now.getTime() / 1000);
            const canWithdraw = currentTimestamp >= Number(unlockTimeBigInt);
            
            const token: LockedSolToken = {
              lockAccount: account.pubkey,
              lockerAddress: lockerPubkey.toString(),
              tokenAddress: tokenMintPubkey.toString(),
              lockedAmount: lockedAmount,
              unlockTime: unlockTimeDate.toLocaleString(),
              unlockTimeRaw: unlockTimeBigInt,
              isUnlocked: canWithdraw,
              seed: seedBigInt,
              isSPL: isSPL,
              tokenName: tokenName,
              tokenSymbol: tokenSymbol,
              decimals: decimals,
              logoURI: logoURI
            };
            
            foundTokens.push(token);
          }
        } catch (parseError) {
          console.error('Error parsing account data:', parseError);
          // Skip this account and continue with others
        }
      }
      
      if (foundTokens.length > 0) {
        console.log(`Found ${foundTokens.length} locked tokens`);
        setLockedTokens(foundTokens);
      } else {
        console.log('No locked tokens found');
        setLockedTokens([]);
      }
      
    } catch (error) {
      console.error("Error fetching locked Solana tokens:", error);
      setError("Failed to fetch locked Solana tokens. Please try again.");
      setTimeout(() => {
        notify.warning('Failed to fetch locked Solana tokens', {
          autoClose: 3000,
        });
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };  

  // Handle withdrawing tokens
  const handleWithdraw = async (token: LockedSolToken) => {
    if (!solanaAddress) {
      setError('Wallet not connected');
      return;
    }

    setError(null);
    setSuccess(null);
    
    try {
      setWithdrawing(token.tokenAddress);
      
      // Check if the lock period has ended
      if (!token.isUnlocked && !debugMode) {
        setError('Lock period has not ended yet. Please wait until the unlock time.');
        setTimeout(() => {
          notify.warning('Lock period has not ended yet', {
            autoClose: 3000,
          });
        }, 100);
        setWithdrawing(null);
        return;
      }

      console.log(`Withdrawing ${token.isSPL ? 'SPL' : 'SOL'} tokens from lock account:`, token.lockAccount.toString());
      console.log('Using seed:', token.seed.toString());
      
      // Create a connection if one doesn't exist
      const conn = connection || new Connection(clusterApiUrl(solanaNetwork as WalletAdapterNetwork), COMMITMENT);
      
      // For native SOL, we use Pubkey.default() as the token mint
      const defaultPubkey = new PublicKey('11111111111111111111111111111111');
      
      // Add compute budget instruction to increase compute units
      const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
        units: 400000
      });
      
      // Create transaction
      const tx = new Transaction();
      
      // Add priority fee to ensure transaction goes through
      const priorityFee = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 1_000_000 // 0.001 SOL per compute unit
      });
      
      tx.add(priorityFee);
      tx.add(modifyComputeUnits);
      
      if (token.isSPL) {
        // Handle SPL token withdrawal
        const tokenMintPubkey = new PublicKey(token.tokenAddress);
        const walletPublicKey = new PublicKey(solanaAddress);
        
        // Get user's token account
        const userTokenAccount = await getAssociatedTokenAddress(
          tokenMintPubkey,
          walletPublicKey
        );
        
        // Get lock token account
        const lockTokenAccount = await getAssociatedTokenAddress(
          tokenMintPubkey,
          token.lockAccount,
          true // allowOwnerOffCurve = true for PDAs
        );
        
        // Create instruction data
        const instructionData = createWithdrawTokensInstructionData(token.seed);
        
        // Create the instruction with accounts exactly matching the contract's WithdrawTokens context
        const withdrawTokensInstruction = new TransactionInstruction({
          programId: PROGRAM_ID,
          keys: [
            { pubkey: walletPublicKey, isSigner: true, isWritable: true }, // locker
            { pubkey: token.lockAccount, isSigner: false, isWritable: true }, // lock_account
            { pubkey: userTokenAccount, isSigner: false, isWritable: true }, // token_account
            { pubkey: lockTokenAccount, isSigner: false, isWritable: true }, // lock_token_account
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token_program
            { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // associated_token_program
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
          ],
          data: instructionData,
        });
        
        tx.add(withdrawTokensInstruction);
      } else {
        // Handle native SOL withdrawal
        // Create instruction data
        const instructionData = createWithdrawNativeTokensInstructionData(token.seed);
        
        // Create the instruction with accounts exactly matching the contract's WithdrawNativeTokens context
        const withdrawNativeTokensInstruction = new TransactionInstruction({
          programId: PROGRAM_ID,
          keys: [
            { pubkey: new PublicKey(solanaAddress), isSigner: true, isWritable: true }, // locker
            { pubkey: token.lockAccount, isSigner: false, isWritable: true }, // lockAccount
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // systemProgram
          ],
          data: instructionData,
        });
        
        tx.add(withdrawNativeTokensInstruction);
      }
      
      // Set recent blockhash and fee payer
      tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
      tx.feePayer = new PublicKey(solanaAddress);
      
      // Check if Phantom wallet is available
      if (!window.solana) {
        throw new Error('Phantom wallet is not available');
      }
      
      // Sign and send the transaction using Phantom wallet
      const signedTransaction = await window.solana.signAndSendTransaction(tx);
      
      // Store the transaction signature for later use
      const txSignature = signedTransaction.signature;
      console.log('Transaction sent with signature:', txSignature);
      
      try {
        // First, try to get the transaction status directly
        const status = await conn.getSignatureStatus(txSignature);
        console.log('Initial transaction status:', status);
        
        // If the transaction is already confirmed, we don't need to wait
        if (status && status.value && status.value.confirmationStatus === 'confirmed') {
          console.log('Transaction already confirmed:', txSignature);
          handleTransactionSuccess(token, txSignature);
          return;
        }
        
        // Wait for confirmation with a longer timeout
        await conn.confirmTransaction({
          signature: txSignature,
          blockhash: tx.recentBlockhash,
          lastValidBlockHeight: (await conn.getLatestBlockhash()).lastValidBlockHeight
        }, 'confirmed');
        
        console.log('Transaction confirmed:', txSignature);
        handleTransactionSuccess(token, txSignature);
      } catch (confirmError: any) {
        console.warn('Transaction confirmation error:', confirmError);
        
        // Check if it's a timeout or blockheight exceeded error
        if (confirmError.message && 
            (confirmError.message.includes('was not confirmed') || 
             confirmError.message.includes('block height exceeded') ||
             confirmError.name === 'TransactionExpiredBlockheightExceededError')) {
          
          // The transaction might have succeeded but confirmation failed
          console.log('Transaction may have succeeded but confirmation failed');
          
          // Try to check the transaction status again
          try {
            const retryStatus = await conn.getSignatureStatus(txSignature);
            console.log('Retry transaction status:', retryStatus);
            
            if (retryStatus && retryStatus.value && retryStatus.value.confirmationStatus) {
              // Transaction was actually confirmed!
              console.log('Transaction was confirmed after all:', txSignature);
              handleTransactionSuccess(token, txSignature);
              return;
            }
          } catch (statusError) {
            console.error('Error checking transaction status:', statusError);
          }
          
          // Show a special notification with the transaction signature
          notify.info(
            <div>
              Transaction sent but confirmation failed. It may have succeeded.
              <br />
              <a 
                href={`https://explorer.solana.com/tx/${txSignature}?cluster=${solanaNetwork === 'mainnet-beta' ? 'mainnet' : solanaNetwork}`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#3498db', textDecoration: 'underline' }}
              >
                Check status on Solana Explorer
              </a>
            </div>,
            { autoClose: 10000 }
          );
          
          // Set a special success/warning message
          setSuccess(`Transaction sent with signature: ${txSignature}. Please check Solana Explorer for confirmation status.`);
          
          // Refresh the locked tokens list after a delay to see if the withdrawal was processed
          setTimeout(() => {
            fetchLockedTokens();
          }, 5000);
        } else {
          // It's some other confirmation error
          throw confirmError;
        }
      }
    } catch (error: any) {
      console.error("Error withdrawing tokens:", error);
      setError(error.message || "Failed to withdraw tokens");
      setTimeout(() => {
        notify.error(error.message || "Failed to withdraw tokens", {
          autoClose: 3000,
        });
      }, 100);
    } finally {
      setWithdrawing(null);
    }
  };

  // Helper function to handle successful transactions
  const handleTransactionSuccess = (token: LockedSolToken, signature: string) => {
    // Create a shortened signature for display
    const shortSignature = `${signature.slice(0, 8)}...${signature.slice(-8)}`;
    
    // Set success message with full signature for the UI
    setSuccess(`${token.isSPL ? 'SPL' : 'SOL'} withdrawn successfully! Transaction signature: ${signature}`);
    
    // Show a transaction notification with clickable link
    setTimeout(() => {
      notify.transaction(`${token.isSPL ? 'SPL' : 'SOL'} withdrawn successfully!`, signature, solanaNetwork, {
        autoClose: 5000,
      });
    }, 100);
    
    // Update the UI to reflect the withdrawal
    setLockedTokens(prevTokens => prevTokens.filter(t => !t.lockAccount.equals(token.lockAccount)));
    
    // Refresh the locked tokens list
    setTimeout(() => {
      fetchLockedTokens();
    }, 2000);
  };

  // Calculate time remaining
  const getTimeRemaining = (token: LockedSolToken): string => {
    const now = new Date();
    const unlockTime = new Date(Number(token.unlockTimeRaw) * 1000);
    const timeRemaining = unlockTime.getTime() - now.getTime();
    
    if (timeRemaining <= 0) return 'Lock period has ended';
    
    // Calculate days, hours, minutes
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days}d ${hours}h ${minutes}m remaining`;
  };

  // Show token details dialog
  const showDetails = (token: LockedSolToken) => {
    setSelectedToken(token);
    setShowDetailsDialog(true);
  };

  useEffect(() => {
    if (isSolanaConnected) {
      fetchLockedTokens();
    }
  }, [isSolanaConnected, solanaAddress]);

  // Check if wallet is connected
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isSolanaConnected && !notificationShownRef.current) {
        setTimeout(() => {
          notify.warning('You must Connect a Solana wallet first', {
            autoClose: 3000,
          });
        }, 100);
        notificationShownRef.current = true;
        navigate('/');
      }
    }, 2000);

    return () => clearTimeout(timer); // Cleanup the timer on unmount
  }, [isSolanaConnected, navigate]);

  // Return early if not connected
  if (!isSolanaConnected) {
    return null; // Render nothing if not connected
  }

  return (
    <Box sx={{ padding: 3, width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <Box sx={{ flexShrink: 0, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Locked Solana Tokens
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Network: {solanaNetwork}
          </Typography>
        </Box>

        {/* Body */}
        <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'stretch' }}>
          {isLoading ? (
            <Box
              className="TestCircularProgress"
              sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}
            >
              <CircularProgress />
            </Box>
          ) : lockedTokens.length === 0 ? (
            <Box sx={{ width: '100%' }}>
              <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
                <Grid display="flex" justifyContent="center" alignItems="center" size={12}>
                  <Chip label="No locked Solana tokens found" variant="outlined" />
                </Grid>
                <Divider orientation="vertical" flexItem />
                <Grid display="flex" justifyContent="center" alignItems="center" size={12}>
                  <Lottie animationData={animationData} loop={true} style={{ width: '50%' }}/>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <StyledTableRow>
                    <StyledTableCell>Network</StyledTableCell>
                    <StyledTableCell>Token</StyledTableCell>
                    <StyledTableCell>Locked Amount</StyledTableCell>
                    <StyledTableCell>Unlock Time</StyledTableCell>
                    <StyledTableCell>Status</StyledTableCell>
                    <StyledTableCell>Actions</StyledTableCell>
                  </StyledTableRow>
                </TableHead>
                <TableBody>
                  {lockedTokens.map((token, index) => (
                    <StyledTableRow key={index}>
                      <StyledTableCell sx={{ justifyItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar src={SolanaLogo} sx={{ width: 24, height: 24, mr: 1 }} />
                          Solana
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {token.isSPL ? (
                            <Link
                              href={`https://explorer.solana.com/address/${token.tokenAddress}?cluster=${solanaNetwork === 'mainnet-beta' ? 'mainnet' : solanaNetwork}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ display: 'flex', alignItems: 'center' }}
                            >
                              <Avatar 
                                src={token.logoURI} 
                                sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main' }}
                              >
                                {token.tokenSymbol?.charAt(0) || 'T'}
                              </Avatar>
                              {token.tokenName || token.tokenSymbol || token.tokenAddress.slice(0, 4) + '...' + token.tokenAddress.slice(-4)}
                            </Link>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar src={SolanaLogo} sx={{ width: 24, height: 24, mr: 1 }} />
                              SOL
                            </Box>
                          )}
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell>{formatNumberHumanReadable(token.lockedAmount)}</StyledTableCell>
                      <StyledTableCell>{token.unlockTime}</StyledTableCell>
                      <StyledTableCell>
                        <Chip
                          label={token.isUnlocked ? "Unlocked" : "Locked"}
                          color={token.isUnlocked ? "success" : "warning"}
                          size="small"
                        />
                      </StyledTableCell>
                      <StyledTableCell>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => handleWithdraw(token)}
                          disabled={!token.isUnlocked && !debugMode || withdrawing === token.tokenAddress}
                        >
                          {withdrawing === token.tokenAddress ? (
                            <CircularProgress size={24} color="inherit" />
                          ) : (
                            "Withdraw"
                          )}
                        </Button>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* Details Dialog */}
        <Dialog
          open={showDetailsDialog}
          onClose={() => setShowDetailsDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar 
                src={selectedToken?.isSPL ? selectedToken?.logoURI : SolanaLogo} 
                sx={{ width: 32, height: 32, mr: 2 }}
              >
                {selectedToken?.isSPL ? selectedToken?.tokenSymbol?.charAt(0) || 'T' : 'S'}
              </Avatar>
              {selectedToken?.isSPL ? 
                `${selectedToken?.tokenName || selectedToken?.tokenSymbol || 'SPL Token'} Lock Details` : 
                'SOL Lock Details'}
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedToken && (
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Token Type" 
                    secondary={selectedToken.isSPL ? 'SPL Token' : 'Native SOL'} 
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText 
                    primary="Token" 
                    secondary={
                      selectedToken.isSPL ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Link 
                            href={`https://explorer.solana.com/address/${selectedToken.tokenAddress}?cluster=${solanaNetwork === 'mainnet-beta' ? 'mainnet' : solanaNetwork}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ display: 'flex', alignItems: 'center' }}
                          >
                            {selectedToken.tokenName || selectedToken.tokenSymbol || selectedToken.tokenAddress}
                          </Link>
                          {selectedToken.tokenSymbol && selectedToken.tokenSymbol !== selectedToken.tokenName && (
                            <Chip 
                              label={selectedToken.tokenSymbol} 
                              size="small" 
                              color="primary" 
                              sx={{ ml: 1 }} 
                            />
                          )}
                        </Box>
                      ) : 'SOL (Native)'
                    } 
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText 
                    primary="Lock Account" 
                    secondary={
                      <Link 
                        href={`https://explorer.solana.com/address/${selectedToken.lockAccount.toString()}?cluster=${solanaNetwork === 'mainnet-beta' ? 'mainnet' : solanaNetwork}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {selectedToken.lockAccount.toString()}
                      </Link>
                    } 
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText 
                    primary="Locked Amount" 
                    secondary={`${formatNumberHumanReadable(selectedToken.lockedAmount)} ${selectedToken.isSPL ? selectedToken.tokenSymbol : 'SOL'}`} 
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText primary="Unlock Time" secondary={selectedToken.unlockTime} />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText primary="Time Remaining" secondary={getTimeRemaining(selectedToken)} />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText primary="Status" secondary={selectedToken.isUnlocked ? "Unlocked - Ready to withdraw" : "Locked"} />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText primary="Seed" secondary={selectedToken.seed.toString()} />
                </ListItem>
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
            {selectedToken && selectedToken.isUnlocked && (
              <Button 
                onClick={() => {
                  handleWithdraw(selectedToken);
                  setShowDetailsDialog(false);
                }}
                color="primary"
                variant="contained"
                disabled={withdrawing === selectedToken.tokenAddress}
              >
                {withdrawing === selectedToken.tokenAddress ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Withdraw"
                )}
              </Button>
            )}
          </DialogActions>
        </Dialog>
    </Box>
  );
};

export default LockedSolTokens; 
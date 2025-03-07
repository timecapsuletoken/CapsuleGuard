import React, { useState, useContext, useEffect } from 'react';
import { RouterContext } from "../App";
import { useWallet } from "../App";
import { 
  PROGRAM_ID, 
  USDC_MINT, 
  LOCK_FEE,
  COMMITMENT
} from "../config/index";
import {
  Box,
  Typography,
  MobileStepper,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Button,
  Container,
  CircularProgress,
  Divider,
  Chip,
  Alert,
  Link,
  MenuItem,
} from '@mui/material';
import { useTheme } from "@mui/material/styles";
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import dayjs, { Dayjs } from 'dayjs';
import { motion } from "framer-motion";
import { notify } from "../utils/toast";

// Import Solana-related dependencies
import { Connection, PublicKey, SystemProgram, Transaction, ComputeBudgetProgram, LAMPORTS_PER_SOL, TransactionInstruction, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { getAssociatedTokenAddress, getMint, getAccount, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@project-serum/anchor';
import { findProgramAddressSync } from '@project-serum/anchor/dist/cjs/utils/pubkey';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';
import { useConnection } from '@solana/wallet-adapter-react';

// Import Solana-related logos and assets
import SolanaLogo from '../assets/images/walletproviders/solana.png';
import { Theme } from "../styles/theme";

const steps = [
  { label: "Select Token" },
  { label: "Add Amount to Lock" },
  { label: "Select Unlock Date & Time" },
  { label: "Lock Tokens" },
  { label: "Success!" },
];

interface LockDetails {
  tokenType: 'SOL' | 'SPL'; // Type of token to lock
  tokenAddress: string;     // For SPL tokens, the mint address
  amount: string;
  lockDate: Dayjs | null;
}

const LockSolTokensPage: React.FC = () => {
  const theme = useTheme();
  const { solanaAddress, isSolanaConnected, solanaNetwork } = useWallet();
  const { connection } = useConnection(); // Get connection from wallet adapter
  const { navigate } = useContext(RouterContext);
  const notificationShownRef = React.useRef(false); // Ref to track if notification has been shown
  const now = dayjs(); // Current date as a Dayjs object
  const [activeStep, setActiveStep] = useState(0);
  const maxSteps = steps.length;
  const [locking, setLocking] = useState(false);
  const [lockDetails, setLockDetails] = useState<LockDetails>({
    tokenType: 'SOL',
    tokenAddress: '',
    amount: '',
    lockDate: dayjs(), // Set initial date to now
  });
  const [configExists, setConfigExists] = useState<boolean>(true); // Assume true initially
  const [usdcAccountExists, setUsdcAccountExists] = useState<boolean>(true); // Assume true initially
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<string | null>(null);
  const [tokenDecimals, setTokenDecimals] = useState<number>(9); // Default to SOL decimals
  const [tokenName, setTokenName] = useState<string>('SOL');
  const [isValidToken, setIsValidToken] = useState<boolean>(true);

  // Use an effect to show the notification
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isSolanaConnected && !notificationShownRef.current) {
        setTimeout(() => {
          notify.warning('You must Connect a Solana wallet first', {
            autoClose: 3000,
          });
        }, 100);
        notificationShownRef.current = true; 
        navigate("/dashboard");
      }
    }, 1000); // 1-second delay

    // Reset the ref when connected
    if (isSolanaConnected) {
      notificationShownRef.current = false;
      clearTimeout(timer); // Clear the timer if the wallet connects
      
      // Check if config and USDC account exist
      checkSolanaAccounts();
    }

    return () => clearTimeout(timer); // Cleanup the timer on unmount
  }, [isSolanaConnected, navigate]);

  // Check if config and USDC account exist
  useEffect(() => {
    if (isSolanaConnected && solanaAddress) {
      checkSolanaAccounts();
    }
  }, [isSolanaConnected, solanaAddress]);

  // Add function to fetch token info when SPL token address changes
  useEffect(() => {
    if (lockDetails.tokenType === 'SPL' && lockDetails.tokenAddress && isSolanaConnected) {
      fetchTokenInfo(lockDetails.tokenAddress);
    } else if (lockDetails.tokenType === 'SOL') {
      // Reset to SOL defaults
      setTokenName('SOL');
      setTokenDecimals(9);
      fetchSolBalance();
    }
  }, [lockDetails.tokenType, lockDetails.tokenAddress, isSolanaConnected]);

  // Fetch SOL balance
  const fetchSolBalance = async () => {
    if (!solanaAddress || !connection) return;
    
    try {
      const balance = await connection.getBalance(new PublicKey(solanaAddress));
      const solBalance = (balance / LAMPORTS_PER_SOL).toFixed(4);
      setTokenBalance(solBalance);
    } catch (error) {
      console.error('Error fetching SOL balance:', error);
      setTokenBalance(null);
    }
  };

  // Fetch token info for SPL tokens
  const fetchTokenInfo = async (tokenAddress: string) => {
    if (!connection || !tokenAddress) return;
    
    try {
      setIsLoading(true);
      setIsValidToken(false);
      
      // Validate the token address
      let mintPubkey: PublicKey;
      try {
        mintPubkey = new PublicKey(tokenAddress);
      } catch (error) {
        console.error('Invalid token address:', error);
        setTokenName('Unknown');
        setTokenBalance(null);
        setIsValidToken(false);
        setIsLoading(false);
        return;
      }
      
      // Fetch token mint info
      try {
        const mintInfo = await getMint(connection, mintPubkey);
        setTokenDecimals(mintInfo.decimals);
        setIsValidToken(true);
        
        // Try to get token metadata for name
        try {
          // This is a simplified approach - in a real app you might want to use token metadata
          setTokenName(mintPubkey.toString().slice(0, 4) + '...' + mintPubkey.toString().slice(-4));
        } catch (error) {
          console.error('Error fetching token metadata:', error);
          setTokenName(mintPubkey.toString().slice(0, 4) + '...' + mintPubkey.toString().slice(-4));
        }
        
        // Fetch user's token balance
        if (solanaAddress) {
          const tokenAccount = await getAssociatedTokenAddress(mintPubkey, new PublicKey(solanaAddress));
          try {
            const tokenAccountInfo = await getAccount(connection, tokenAccount);
            const balance = Number(tokenAccountInfo.amount) / Math.pow(10, mintInfo.decimals);
            setTokenBalance(balance.toFixed(4));
          } catch (error) {
            console.error('Error fetching token account:', error);
            setTokenBalance('0');
          }
        }
      } catch (error) {
        console.error('Error fetching token info:', error);
        setTokenName('Invalid Token');
        setTokenBalance(null);
        setIsValidToken(false);
      }
    } catch (error) {
      console.error('Error in fetchTokenInfo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSolanaAccounts = async () => {
    if (!solanaAddress) return;

    try {
      console.log('Checking Solana accounts on network:', solanaNetwork);
      
      // Create a connection if one doesn't exist
      const conn = connection || new Connection(clusterApiUrl(solanaNetwork as WalletAdapterNetwork), COMMITMENT);
      
      // Log the connection endpoint for debugging
      console.log('Using connection endpoint:', conn.rpcEndpoint);
      
      // Find the owner config PDA
      const [configPDA] = findProgramAddressSync(
        [Buffer.from('OwnerConfig')],
        PROGRAM_ID
      );

      // Check if config account exists
      const configAccount = await conn.getAccountInfo(configPDA);
      setConfigExists(configAccount !== null);

      if (configAccount !== null) {
        // If config exists, check if USDC account exists
        const usdcMintPubkey = USDC_MINT;
        const programUsdcAccount = await getAssociatedTokenAddress(
          usdcMintPubkey,
          configPDA,
          true // allowOwnerOffCurve
        );

        const usdcAccount = await conn.getAccountInfo(programUsdcAccount);
        setUsdcAccountExists(usdcAccount !== null);
      }
    } catch (error) {
      console.error('Error checking Solana accounts:', error);
      setError('Error checking Solana accounts. Please try again.');
    }
  };

  // Helper function to create instruction data for lock_native_tokens
  const createLockNativeTokensInstructionData = (amount: number | bigint, unlockTime: number | bigint, seed: number | bigint): Buffer => {
    // Discriminator for lock_native_tokens from IDL
    const discriminator = Buffer.from([97, 53, 201, 3, 28, 12, 25, 249]);
    
    // Create buffer for amount (u64 = 8 bytes)
    const amountBuffer = Buffer.alloc(8);
    amountBuffer.writeBigUInt64LE(BigInt(amount), 0);
    
    // Create buffer for unlock_time (u64 = 8 bytes)
    const unlockTimeBuffer = Buffer.alloc(8);
    unlockTimeBuffer.writeBigUInt64LE(BigInt(unlockTime), 0);
    
    // Create buffer for seed (u64 = 8 bytes)
    const seedBuffer = Buffer.alloc(8);
    seedBuffer.writeBigUInt64LE(BigInt(seed), 0);
    
    // Combine all buffers
    return Buffer.concat([discriminator, amountBuffer, unlockTimeBuffer, seedBuffer]);
  };

  // Helper function to create instruction data for lock_tokens (SPL)
  const createLockTokensInstructionData = (amount: number | bigint, unlockTime: number | bigint, seed: number | bigint): Buffer => {
    // Discriminator for lock_tokens from IDL
    const discriminator = Buffer.from([136, 11, 32, 232, 161, 117, 54, 211]);
    
    // Create buffer for amount (u64 = 8 bytes)
    const amountBuffer = Buffer.alloc(8);
    amountBuffer.writeBigUInt64LE(BigInt(amount), 0);
    
    // Create buffer for unlock_time (u64 = 8 bytes)
    const unlockTimeBuffer = Buffer.alloc(8);
    unlockTimeBuffer.writeBigUInt64LE(BigInt(unlockTime), 0);
    
    // Create buffer for seed (u64 = 8 bytes)
    const seedBuffer = Buffer.alloc(8);
    seedBuffer.writeBigUInt64LE(BigInt(seed), 0);
    
    // Combine all buffers
    return Buffer.concat([discriminator, amountBuffer, unlockTimeBuffer, seedBuffer]);
  };

  // Return early if not connected
  if (!isSolanaConnected) {
    return null; // Render nothing if not connected
  }
  
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'tokenAddress') {
      // Check if the value is 'SOL' (case insensitive)
      if (value.toUpperCase() === 'SOL') {
        setLockDetails({
          ...lockDetails,
          tokenType: 'SOL',
          tokenAddress: 'SOL'
        });
        setTokenName('SOL');
        setTokenDecimals(9);
        fetchSolBalance();
        setIsValidToken(true);
      } else {
        // Assume it's an SPL token address
        setLockDetails({
          ...lockDetails,
          tokenType: 'SPL',
          tokenAddress: value
        });
        
        // Validate the token address if it's long enough
        if (value.length >= 32) {
          fetchTokenInfo(value);
        } else {
          setIsValidToken(false);
          setTokenName('Unknown');
          setTokenBalance(null);
        }
      }
    } else {
      // For other fields, just update normally
      setLockDetails({ ...lockDetails, [name]: value });
    }
  };

  const handleNext = async () => {
    if (activeStep === maxSteps - 1) {
      return;
    }

    // Validate inputs based on current step
    if (activeStep === 0) {
      // Token selection step
      if (!lockDetails.tokenAddress) {
        setTimeout(() => {
          notify.warning('Please enter SOL or a valid SPL token address', {
            autoClose: 3000,
          });
        }, 100);
        return;
      }
      
      if (!isValidToken) {
        setTimeout(() => {
          notify.warning('Please provide a valid token', {
            autoClose: 3000,
          });
        }, 100);
        return;
      }
    }
    
    if (activeStep === 1) {
      // Amount step
      if (!lockDetails.amount || lockDetails.amount.trim() === '') {
        setTimeout(() => {
          notify.warning('Please provide a valid amount', {
            autoClose: 3000,
          });
        }, 100);
        return;
      }
      
      // Check if amount is valid number
      const amount = parseFloat(lockDetails.amount);
      if (isNaN(amount) || amount <= 0) {
        setTimeout(() => {
          notify.warning('Amount must be greater than zero', {
            autoClose: 3000,
          });
        }, 100);
        return;
      }
      
      // Check if user has enough balance
      if (tokenBalance !== null) {
        const balance = parseFloat(tokenBalance);
        if (amount > balance) {
          setTimeout(() => {
            notify.warning(`Insufficient ${tokenName} balance`, {
              autoClose: 3000,
            });
          }, 100);
          return;
        }
      }
    }

    const now = dayjs();
    if (activeStep === 2 && (!lockDetails.lockDate || lockDetails.lockDate.isBefore(now))) {
      setTimeout(() => {
        notify.warning('The lock date must be in the future', {
          autoClose: 3000,
        });
      }, 100);
      return;
    }

    if (activeStep === 3) {
      // Lock tokens
      try {
        setIsLoading(true);
        if (lockDetails.tokenType === 'SOL' || lockDetails.tokenAddress.toUpperCase() === 'SOL') {
          await handleLockNativeTokens();
        } else {
          await handleLockSplTokens();
        }
      } catch (error) {
        console.error('Error in token locking:', error);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Function to lock native SOL tokens
  const handleLockNativeTokens = async () => {
    if (!solanaAddress) {
      setError('Wallet not connected');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Locking SOL tokens on network:', solanaNetwork);
      
      // Create a connection if one doesn't exist
      const conn = connection || new Connection(clusterApiUrl(solanaNetwork as WalletAdapterNetwork), COMMITMENT);
      
      // Log the connection endpoint for debugging
      console.log('Using connection endpoint:', conn.rpcEndpoint);
      
      // Validate inputs
      if (!lockDetails.amount || parseFloat(lockDetails.amount) <= 0) {
        setTimeout(() => {
          notify.warning('Amount must be greater than zero', {
            autoClose: 3000,
          });
        }, 100);
        return;
      }

      if (!lockDetails.lockDate || lockDetails.lockDate.isBefore(now)) {
        setTimeout(() => {
          notify.warning('Unlock time must be in the future', {
            autoClose: 3000,
          });
        }, 100);
        return;
      }

      // Check if contract is initialized
      if (!configExists || !usdcAccountExists) {
        setTimeout(() => {
          notify.error('Contract is not fully initialized. Please contact support.', {
            autoClose: 5000,
          });
        }, 100);
        return;
      }

      // Convert Solana address string to PublicKey
      const walletPublicKey = new PublicKey(solanaAddress);
      
      // For native SOL, we use Pubkey.default() as the token mint
      const defaultPubkey = new PublicKey('11111111111111111111111111111111');
      
      // Generate a random seed for the lock account
      const seed = Math.floor(Date.now() / 1000); // Current timestamp as seed
      console.log('Using seed for lock account:', seed);
      
      // Calculate PDA for lock account - this must match the seeds in the contract
      const [lockAccount, lockAccountBump] = findProgramAddressSync(
        [
          Buffer.from('TokenLockInfo'),
          walletPublicKey.toBuffer(),
          defaultPubkey.toBuffer(),
          Buffer.from(new BN(seed).toArray('le', 8))
        ],
        PROGRAM_ID
      );
      
      console.log('Generated lock account address:', lockAccount.toString());
      
      setLocking(true);
      
      // Get user's USDC account for paying the fee
      const userUsdcAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        walletPublicKey
      );
      
      // Calculate PDA for config account
      const [configPDA] = findProgramAddressSync(
        [Buffer.from("OwnerConfig")],
        PROGRAM_ID
      );
      
      // Get the program's USDC account - this is an ATA with the config PDA as the owner
      const programUsdcAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        configPDA,
        true // allowOwnerOffCurve = true for PDAs
      );
      
      // Convert amount to lamports
      const amountFloat = parseFloat(lockDetails.amount);
      const amountLamports = amountFloat * LAMPORTS_PER_SOL;
      
      // Ensure the amount doesn't exceed the maximum value for a 64-bit unsigned integer
      const MAX_UINT64 = BigInt("18446744073709551615"); // 2^64 - 1
      let amountBigInt = BigInt(Math.floor(amountLamports));
      
      if (amountBigInt > MAX_UINT64) {
        console.warn(`Amount exceeds maximum value for u64. Capping at max value.`);
        amountBigInt = MAX_UINT64;
        
        // Show warning to user
        setTimeout(() => {
          notify.warning('Amount exceeds maximum allowed value. Capping at maximum.', {
            autoClose: 5000,
          });
        }, 100);
      }
      
      // Convert unlock time to seconds
      const unlockTimeSeconds = BigInt(Math.floor(lockDetails.lockDate.valueOf() / 1000));
      
      console.log('Locking SOL with parameters:');
      console.log('- Amount:', amountBigInt.toString(), 'lamports');
      console.log('- Unlock Time:', unlockTimeSeconds.toString());
      console.log('- Seed:', seed);
      console.log('- Lock Account:', lockAccount.toString());
      console.log('- Program USDC Account:', programUsdcAccount.toString());
      
      // Add compute budget instruction to increase compute units
      const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
        units: 400000
      });
      
      // Create instruction data
      const instructionData = createLockNativeTokensInstructionData(
        amountBigInt,
        unlockTimeSeconds,
        seed
      );
      
      // Create the instruction
      const lockNativeTokensInstruction = new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: walletPublicKey, isSigner: true, isWritable: true }, // locker
          { pubkey: userUsdcAccount, isSigner: false, isWritable: true }, // usdcAccount
          { pubkey: lockAccount, isSigner: false, isWritable: true }, // lockAccount
          { pubkey: programUsdcAccount, isSigner: false, isWritable: true }, // programUsdcAccount
          { pubkey: configPDA, isSigner: false, isWritable: true }, // config
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // tokenProgram
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // systemProgram
          { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }, // rent
        ],
        data: instructionData,
      });
      
      // Create transaction
      const tx = new Transaction();
      tx.add(modifyComputeUnits);
      tx.add(lockNativeTokensInstruction);
      
      // Set recent blockhash and fee payer
      tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
      tx.feePayer = walletPublicKey;
      
      console.log('Transaction created with instructions:', tx.instructions.length);
      console.log('Transaction recent blockhash:', tx.recentBlockhash);
      
      // Sign and send the transaction using Phantom wallet
      try {
        // Check if Phantom wallet is available
        if (!window.solana) {
          throw new Error('Phantom wallet is not available');
        }
        
        console.log('Sending transaction to Phantom wallet for signing...');
        
        // Use the signAndSendTransaction method from Phantom wallet
        const signedTransaction = await window.solana.signAndSendTransaction(tx);
        console.log('Transaction sent with signature:', signedTransaction.signature);
        
        // Store the transaction signature for later use
        const txSignature = signedTransaction.signature;
        
        try {
          // First, try to get the transaction status directly
          const status = await conn.getSignatureStatus(txSignature);
          console.log('Initial transaction status:', status);
          
          // If the transaction is already confirmed, we don't need to wait
          if (status && status.value && status.value.confirmationStatus === 'confirmed') {
            console.log('Transaction already confirmed:', txSignature);
            handleTransactionSuccess(txSignature);
            return;
          }
          
          // Wait for confirmation with a longer timeout
          console.log('Waiting for transaction confirmation...');
          await conn.confirmTransaction({
            signature: txSignature,
            blockhash: tx.recentBlockhash,
            lastValidBlockHeight: (await conn.getLatestBlockhash()).lastValidBlockHeight
          }, 'confirmed');
          
          console.log('Transaction confirmed:', txSignature);
          handleTransactionSuccess(txSignature);
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
                handleTransactionSuccess(txSignature);
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
            
            // Move to success step anyway since the transaction was sent
            setActiveStep(3);
          } else {
            // It's some other confirmation error
            throw confirmError;
          }
        }
      } catch (signError: any) {
        console.error('Error signing transaction:', signError);
        
        // Log more details about the error
        if (signError.logs) {
          console.error('Transaction logs:', signError.logs);
        }
        
        // Check if it's a simulation error
        if (signError.message && signError.message.includes('Transaction simulation failed')) {
          console.error('Transaction simulation failed. This might be due to:');
          console.error('1. Insufficient funds for transaction fee');
          console.error('2. Program error in the contract');
          console.error('3. Account already in use');
        }
        
        throw new Error(`Failed to sign transaction: ${signError.message}`);
      }
    } catch (error: any) {
      console.error('Error locking SOL tokens:', error);
      setError(error.message || 'An error occurred while locking SOL');
      setTimeout(() => {
        notify.error(error.message || 'An error occurred while locking SOL', {
          autoClose: 5000,
        });
      }, 100);
    } finally {
      setLocking(false);
      setIsLoading(false);
    }
  };

  // Helper function to handle successful transactions
  const handleTransactionSuccess = (signature: string) => {
    setSuccess(`${lockDetails.tokenType === 'SOL' ? 'SOL' : 'SPL token'} locked successfully! Transaction signature: ${signature}`);
    
    // Use transaction notification with clickable link
    setTimeout(() => {
      notify.transaction(`${lockDetails.tokenType === 'SOL' ? 'SOL' : 'SPL token'} locked successfully!`, signature, solanaNetwork, {
        autoClose: 5000,
      });
    }, 100);
    
    // Move to success step
    setActiveStep(4);
    
    // Clear form
    setLockDetails({
      tokenType: 'SOL',
      tokenAddress: '',
      amount: '',
      lockDate: dayjs(),
    });
  };

  // Function to handle locking SPL tokens
  const handleLockSplTokens = async () => {
    if (!solanaAddress) {
      setError('Wallet not connected');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Locking SPL tokens on network:', solanaNetwork);
      
      // Create a connection if one doesn't exist
      const conn = connection || new Connection(clusterApiUrl(solanaNetwork as WalletAdapterNetwork), COMMITMENT);
      
      // Log the connection endpoint for debugging
      console.log('Using connection endpoint:', conn.rpcEndpoint);
      
      // Validate inputs
      if (!lockDetails.amount || parseFloat(lockDetails.amount) <= 0) {
        setTimeout(() => {
          notify.warning('Amount must be greater than zero', {
            autoClose: 3000,
          });
        }, 100);
        return;
      }

      if (!lockDetails.lockDate || lockDetails.lockDate.isBefore(now)) {
        setTimeout(() => {
          notify.warning('Unlock time must be in the future', {
            autoClose: 3000,
          });
        }, 100);
        return;
      }

      if (!lockDetails.tokenAddress || !isValidToken) {
        setTimeout(() => {
          notify.warning('Please provide a valid token address', {
            autoClose: 3000,
          });
        }, 100);
        return;
      }

      // Check if contract is initialized
      if (!configExists || !usdcAccountExists) {
        setTimeout(() => {
          notify.error('Contract is not fully initialized. Please contact support.', {
            autoClose: 5000,
          });
        }, 100);
        return;
      }

      // Convert Solana address string to PublicKey
      const walletPublicKey = new PublicKey(solanaAddress);
      
      // Convert token address to PublicKey
      const tokenMintPubkey = new PublicKey(lockDetails.tokenAddress);
      
      // Get user's token account
      const userTokenAccount = await getAssociatedTokenAddress(
        tokenMintPubkey,
        walletPublicKey
      );
      
      // Generate a random seed for the lock account
      const seed = Math.floor(Date.now() / 1000); // Current timestamp as seed
      console.log('Using seed for lock account:', seed);
      
      // Calculate PDA for lock account - this must match the seeds in the contract
      const [lockAccount, lockAccountBump] = findProgramAddressSync(
        [
          Buffer.from('TokenLockInfo'),
          walletPublicKey.toBuffer(),
          tokenMintPubkey.toBuffer(),
          Buffer.from(new BN(seed).toArray('le', 8))
        ],
        PROGRAM_ID
      );
      
      console.log('Generated lock account address:', lockAccount.toString());
      
      // Calculate PDA for lock token account
      const lockTokenAccount = await getAssociatedTokenAddress(
        tokenMintPubkey,
        lockAccount,
        true // allowOwnerOffCurve = true for PDAs
      );
      
      console.log('Generated lock token account address:', lockTokenAccount.toString());
      
      setLocking(true);
      
      // Get user's USDC account for paying the fee
      const userUsdcAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        walletPublicKey
      );
      
      // Calculate PDA for config account
      const [configPDA] = findProgramAddressSync(
        [Buffer.from("OwnerConfig")],
        PROGRAM_ID
      );
      
      // Get the program's USDC account - this is an ATA with the config PDA as the owner
      const programUsdcAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        configPDA,
        true // allowOwnerOffCurve = true for PDAs
      );
      
      // Convert amount to token units based on decimals - use string to avoid precision issues with large numbers
      const amountFloat = parseFloat(lockDetails.amount);
      const amountString = (amountFloat * Math.pow(10, tokenDecimals)).toString();
      
      // Ensure the amount doesn't exceed the maximum value for a 64-bit unsigned integer
      const MAX_UINT64 = BigInt("18446744073709551615"); // 2^64 - 1
      let amountBigInt = BigInt(amountString.split('.')[0]); // Remove any decimal part
      
      if (amountBigInt > MAX_UINT64) {
        console.warn(`Amount exceeds maximum value for u64. Capping at max value.`);
        amountBigInt = MAX_UINT64;
        
        // Show warning to user
        setTimeout(() => {
          notify.warning('Amount exceeds maximum allowed value. Capping at maximum.', {
            autoClose: 5000,
          });
        }, 100);
      }
      
      // Convert unlock time to seconds
      const unlockTimeSeconds = BigInt(Math.floor(lockDetails.lockDate.valueOf() / 1000));
      
      console.log('Locking SPL tokens with parameters:');
      console.log('- Token:', tokenMintPubkey.toString());
      console.log('- Amount:', amountBigInt.toString(), 'units');
      console.log('- Unlock Time:', unlockTimeSeconds.toString());
      console.log('- Seed:', seed);
      console.log('- Lock Account:', lockAccount.toString());
      console.log('- Lock Token Account:', lockTokenAccount.toString());
      console.log('- Program USDC Account:', programUsdcAccount.toString());
      
      // Add compute budget instruction to increase compute units
      const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
        units: 400000
      });
      
      // Create instruction data
      const instructionData = createLockTokensInstructionData(
        amountBigInt,
        unlockTimeSeconds,
        seed
      );
      
      // Create the instruction
      const lockTokensInstruction = new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: walletPublicKey, isSigner: true, isWritable: true }, // locker
          { pubkey: userTokenAccount, isSigner: false, isWritable: true }, // token_account
          { pubkey: userUsdcAccount, isSigner: false, isWritable: true }, // usdc_account
          { pubkey: lockAccount, isSigner: false, isWritable: true }, // lock_account
          { pubkey: lockTokenAccount, isSigner: false, isWritable: true }, // lock_token_account
          { pubkey: tokenMintPubkey, isSigner: false, isWritable: false }, // mint
          { pubkey: programUsdcAccount, isSigner: false, isWritable: true }, // program_usdc_account
          { pubkey: configPDA, isSigner: false, isWritable: true }, // config
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token_program
          { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // associated_token_program
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
          { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }, // rent
        ],
        data: instructionData,
      });
      
      // Create transaction
      const tx = new Transaction();
      tx.add(modifyComputeUnits);
      tx.add(lockTokensInstruction);
      
      // Set recent blockhash and fee payer
      tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
      tx.feePayer = walletPublicKey;
      
      console.log('Transaction created with instructions:', tx.instructions.length);
      console.log('Transaction recent blockhash:', tx.recentBlockhash);
      
      // Sign and send the transaction using Phantom wallet
      try {
        // Check if Phantom wallet is available
        if (!window.solana) {
          throw new Error('Phantom wallet is not available');
        }
        
        console.log('Sending transaction to Phantom wallet for signing...');
        
        // Use the signAndSendTransaction method from Phantom wallet
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
            handleTransactionSuccess(txSignature);
            return;
          }
          
          // Wait for confirmation with a longer timeout
          console.log('Waiting for transaction confirmation...');
          await conn.confirmTransaction({
            signature: txSignature,
            blockhash: tx.recentBlockhash,
            lastValidBlockHeight: (await conn.getLatestBlockhash()).lastValidBlockHeight
          }, 'confirmed');
          
          console.log('Transaction confirmed:', txSignature);
          handleTransactionSuccess(txSignature);
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
                handleTransactionSuccess(txSignature);
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
            
            // Move to success step anyway since the transaction was sent
            setActiveStep(4);
          } else {
            // It's some other confirmation error
            throw confirmError;
          }
        }
      } catch (signError: any) {
        console.error('Error signing transaction:', signError);
        
        // Log more details about the error
        if (signError.logs) {
          console.error('Transaction logs:', signError.logs);
        }
        
        // Check if it's a simulation error
        if (signError.message && signError.message.includes('Transaction simulation failed')) {
          console.error('Transaction simulation failed. This might be due to:');
          console.error('1. Insufficient funds for transaction fee');
          console.error('2. Program error in the contract');
          console.error('3. Account already in use');
        }
        
        throw new Error(`Failed to sign transaction: ${signError.message}`);
      }
    } catch (error: any) {
      console.error('Error locking SPL tokens:', error);
      setError(error.message || 'An error occurred while locking tokens');
      setTimeout(() => {
        notify.error(error.message || 'An error occurred while locking tokens', {
          autoClose: 5000,
        });
      }, 100);
    } finally {
      setLocking(false);
      setIsLoading(false);
    }
  };

  const floatingVariants = {
    float: {
      y: [5, -40, 0], // Moves up and down
      rotate: [0, 180, 360], // Smoothly rotates
      transition: {
        duration: 10, // Slower animation
        repeat: Infinity, // Loops forever
        ease: "easeInOut",
      },
    },
  };
  
  const shakeVariants = {
    shake: {
      x: [0, -8, 8, -6, 6, -4, 4, 0], // Gradual horizontal shake
      transition: {
        duration: 4, // Adjust duration for faster or slower shake
        repeat: Infinity, // Repeat indefinitely
        ease: "easeInOut",
      },
    },
  };  
  
  // Use Solana-related floating shapes
  const floatingShapes = [
    { src: SolanaLogo, alt: "Solana", top: "5%", left: "10%" },
    { src: SolanaLogo, alt: "Solana", top: "20%", left: "55%" },
    { src: SolanaLogo, alt: "Solana", top: "15%", left: "30%" },
    { src: SolanaLogo, alt: "Solana", top: "50%", left: "15%" },
    { src: SolanaLogo, alt: "Solana", top: "8%", left: "85%" },
    { src: SolanaLogo, alt: "Solana", top: "85%", left: "85%" },
    { src: SolanaLogo, alt: "Solana", top: "50%", left: "70%" },
    { src: SolanaLogo, alt: "Solana", top: "70%", left: "40%" },
    { src: SolanaLogo, alt: "Solana", top: "85%", left: "5%" },
  ];  
  
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container sx={{ 
          margin: '0 !important',
          padding: '0 !important', 
          maxWidth: { xs: '100%', sm: '100%', lg: '100%'  }, 
          width: '100%',
          height: '100%', 
        }}
      >
      <Box
        sx={{
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: 'column',
          height: "100%",
          backgroundColor: theme.palette.background.paper,
          zIndex: 10,
          overflow: 'hidden',
        }}
      >
          {/* Blurred Background */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1,
              background: 'rgba(255, 255, 255, 0.1)', // Adjust opacity for the blur
              backdropFilter: 'blur(4px)', // Blur effect
            }}
          />
          {/* Floating Shapes */}
          <Box>
            {floatingShapes.map((shape, index) => (
              <motion.div
                key={index}
                variants={floatingVariants} // Floating up and down + rotation
                animate="float"
                style={{
                  position: "absolute",
                  top: shape.top,
                  left: shape.left,
                  width: "5vw",
                  height: "auto",
                }}
              >
                <motion.img
                  src={shape.src}
                  alt={shape.alt}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  variants={shakeVariants} 
                  animate="shake"
                />
              </motion.div>
            ))}
          </Box>
          <Box 
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'stretch',
              zIndex: 10,
            }}
          >
            <Typography variant="h4" align="center" gutterBottom>
              Lock Solana Tokens | Wallet: {solanaAddress?.slice(0, 6)}...{solanaAddress?.slice(-4)}
            </Typography>
            <Paper
              square
              elevation={0}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: '10px',
                height: 50,
                pl: 2,
                backgroundColor: theme.palette.text.secondary,
                color: theme.palette.primary.contrastText
              }}
            >
              <Typography>{steps[activeStep].label}</Typography>
            </Paper>

            {!configExists && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Contract is not initialized. Please contact support.
              </Alert>
            )}

            {configExists && !usdcAccountExists && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                USDC account is not initialized. Please contact support.
              </Alert>
            )}

            <Box sx={{ p: 3, textAlign: 'center !important' }}>
              {activeStep === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Typography variant="h6" gutterBottom>
                    Enter token to lock
                  </Typography>
                  <TextField
                    fullWidth
                    label="Token Address or 'SOL'"
                    name="tokenAddress"
                    value={lockDetails.tokenAddress}
                    onChange={handleInputChange}
                    margin="normal"
                    placeholder="Enter SOL or a token address"
                    helperText={
                      lockDetails.tokenAddress ? 
                        isValidToken ? 
                          `Token: ${tokenName}${tokenBalance ? ` - Balance: ${tokenBalance}` : ''}` : 
                          'Invalid token address' : 
                        'Type SOL to lock Solana, or enter an SPL token address'
                    }
                    error={lockDetails.tokenAddress !== '' && !isValidToken}
                  />
                </motion.div>
              )}
              {activeStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Typography variant="h6" gutterBottom>
                    Enter amount to lock
                  </Typography>
                  <TextField
                    fullWidth
                    label={`Amount (${tokenName})`}
                    name="amount"
                    type="number"
                    value={lockDetails.amount}
                    onChange={handleInputChange}
                    margin="normal"
                    InputProps={{
                      endAdornment: (
                        <Button 
                          variant="text" 
                          size="small"
                          onClick={() => {
                            if (tokenBalance) {
                              setLockDetails({
                                ...lockDetails,
                                amount: tokenBalance
                              });
                            }
                          }}
                          disabled={!tokenBalance}
                        >
                          MAX
                        </Button>
                      ),
                    }}
                    helperText={tokenBalance ? `Available: ${tokenBalance} ${tokenName}` : 'Enter amount to lock'}
                  />
                </motion.div>
              )}
              {activeStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Typography variant="h6" gutterBottom>
                    Select when tokens should unlock
                  </Typography>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateTimePicker
                      label="Unlock Date and Time"
                      value={lockDetails.lockDate}
                      onChange={(newValue) => {
                        setLockDetails({ ...lockDetails, lockDate: newValue });
                      }}
                      minDateTime={dayjs()}
                      sx={{ width: '100%', mt: 2 }}
                    />
                  </LocalizationProvider>
                </motion.div>
              )}
              {activeStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Typography variant="h6" gutterBottom>
                    Review and confirm
                  </Typography>
                  <List>
                    <ListItem style={{ textAlign: 'center' }}>
                      <ListItemText
                        primary="Token Type"
                        secondary={lockDetails.tokenType}
                      />
                    </ListItem>
                    <Divider />
                    {lockDetails.tokenType === 'SPL' && (
                      <>
                        <ListItem style={{ textAlign: 'center' }}>
                          <ListItemText
                            primary="Token Address"
                            secondary={lockDetails.tokenAddress}
                          />
                        </ListItem>
                        <Divider />
                      </>
                    )}
                    <ListItem style={{ textAlign: 'center' }}>
                      <ListItemText
                        primary="Amount"
                        secondary={`${lockDetails.amount} ${tokenName}`}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem style={{ textAlign: 'center' }}>
                      <ListItemText
                        primary="Unlock Date"
                        secondary={lockDetails.lockDate?.format('MMMM D, YYYY h:mm A')}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem style={{ textAlign: 'center' }}>
                      <ListItemText
                        primary="Fee"
                        secondary={`${LOCK_FEE / 1_000_000} USDC`}
                      />
                    </ListItem>
                  </List>
                </motion.div>
              )}
              {activeStep === 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Tokens Locked Successfully!
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      Your {tokenName} has been locked until {lockDetails.lockDate?.format('MMMM D, YYYY h:mm A')}
                    </Typography>
                    {success && (
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Transaction:{' '}
                        <Link 
                          href={`https://explorer.solana.com/tx/${success.split('Transaction signature: ')[1]}?cluster=${solanaNetwork === 'mainnet-beta' ? 'mainnet' : solanaNetwork}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          sx={{ cursor: 'pointer' }}
                        >
                          View on Explorer
                        </Link>
                      </Typography>
                    )}
                    <Button
                      variant="contained"
                      onClick={() => navigate('/lockedsol')}
                      sx={{ mt: 2 }}
                    >
                      View Locked Tokens
                    </Button>
                  </Box>
                </motion.div>
              )}
            </Box>
            <MobileStepper
              variant="text"
              steps={maxSteps}
              position="static"
              activeStep={activeStep}
              sx={{
                backgroundColor: theme.palette.text.secondary,
                color: theme.palette.primary.contrastText,
                borderRadius: '10px',
              }}
              nextButton={
                <Button
                  size="small"
                  onClick={handleNext}
                  disabled={
                    activeStep === maxSteps - 1 ||
                    locking ||
                    isLoading
                  }
                  sx={{
                    color: theme.palette.primary.light, // Custom text color
                    "&:hover": {
                      color: theme.palette.primary.contrastText, // Custom text color
                    },
                    "&:disabled": {
                      backgroundColor: "#e0e0e0", // Disabled state color
                    },
                  }}                
                >
                  {activeStep === 2 ? (
                    locking ? (
                      <>
                        Locking... <CircularProgress size={16} sx={{ ml: 1 }} />
                      </>
                    ) : (
                      'Lock SOL'
                    )
                  ) : (
                    'Next'
                  )}
                  {theme.direction === "rtl" ? (
                    <KeyboardArrowLeftIcon />
                  ) : (
                    <KeyboardArrowRightIcon />
                  )}
                </Button>
              }
              backButton={
                <Button
                  size="small"
                  onClick={handleBack}
                  disabled={activeStep === 0 || locking || isLoading}
                  sx={{
                    color: theme.palette.primary.light, // Custom text color
                    "&:hover": {
                      color: theme.palette.primary.contrastText, // Custom text color
                    },
                    "&:disabled": {
                      //backgroundColor: "#e0e0e0", // Disabled state color
                    },
                  }}  
                >
                  {theme.direction === "rtl" ? (
                    <KeyboardArrowRightIcon />
                  ) : (
                    <KeyboardArrowLeftIcon />
                  )}
                  Back
                </Button>
              }
            />
          </Box>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default LockSolTokensPage; 
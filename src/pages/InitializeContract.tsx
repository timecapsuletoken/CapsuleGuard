import React, { FC, useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { web3 } from '@project-serum/anchor';
import { PROGRAM_ID, USDC_MINT } from '../config/index';
import { findProgramAddressSync } from '@project-serum/anchor/dist/cjs/utils/pubkey';
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { useWallet } from "../App";
import { useNotifications } from '@toolpad/core/useNotifications';

import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Chip,
  Stack,
  useTheme,
  Card,
  CardContent,
  Grid,
  Link
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SettingsIcon from '@mui/icons-material/Settings';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

// Interface for the config data
interface ConfigData {
  owner: string;
  usdcMint: string;
  collectedFees: number;
}

const InitializeContract: FC = () => {
  const theme = useTheme();
  const { connection } = useConnection();
  const { solanaAddress, isSolanaConnected } = useWallet();
  const notifications = useNotifications();
  
  const [usdcMint, setUsdcMint] = useState<string>(USDC_MINT.toString());
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [configExists, setConfigExists] = useState<boolean>(false);
  const [usdcAccountExists, setUsdcAccountExists] = useState<boolean>(false);
  const [configPDA, setConfigPDA] = useState<PublicKey | null>(null);
  const [programUsdcAccount, setProgramUsdcAccount] = useState<PublicKey | null>(null);
  const [configData, setConfigData] = useState<ConfigData | null>(null);
  const [isFetchingData, setIsFetchingData] = useState<boolean>(false);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);

  // Check if accounts already exist
  useEffect(() => {
    const checkAccounts = async () => {
      if (!solanaAddress) return;

      try {
        setIsFetchingData(true);
        // Find the owner config PDA
        const [configPDAAddress] = findProgramAddressSync(
          [Buffer.from('OwnerConfig')],
          PROGRAM_ID
        );
        setConfigPDA(configPDAAddress);

        // Check if config account exists
        const configAccount = await connection.getAccountInfo(configPDAAddress);
        setConfigExists(configAccount !== null);

        if (configAccount !== null) {
          // Parse the config data
          try {
            // Skip the 8-byte discriminator
            const dataBuffer = configAccount.data.slice(8);
            
            // Parse the OwnerConfig struct
            // owner: Pubkey (32 bytes)
            // usdc_mint: Pubkey (32 bytes)
            // collected_fees: u64 (8 bytes)
            
            const ownerPubkey = new PublicKey(dataBuffer.slice(0, 32));
            const usdcMintPubkey = new PublicKey(dataBuffer.slice(32, 64));
            const collectedFeesBigInt = dataBuffer.readBigUInt64LE(64);
            
            setConfigData({
              owner: ownerPubkey.toString(),
              usdcMint: usdcMintPubkey.toString(),
              collectedFees: Number(collectedFeesBigInt)
            });
            
            // Update the USDC mint input field
            setUsdcMint(usdcMintPubkey.toString());
            
            // If config exists, check if USDC account exists
            const programUsdcAccountAddress = await getAssociatedTokenAddress(
              usdcMintPubkey,
              configPDAAddress,
              true // allowOwnerOffCurve
            );
            
            setProgramUsdcAccount(programUsdcAccountAddress);
            
            const usdcAccount = await connection.getAccountInfo(programUsdcAccountAddress);
            setUsdcAccountExists(usdcAccount !== null);
            
            // If USDC account exists, fetch its balance
            if (usdcAccount !== null) {
              try {
                // Get token account balance
                const tokenAccountInfo = await connection.getTokenAccountBalance(programUsdcAccountAddress);
                if (tokenAccountInfo && tokenAccountInfo.value) {
                  // USDC has 6 decimals
                  setUsdcBalance(Number(tokenAccountInfo.value.amount) / 1_000_000);
                }
              } catch (err) {
                console.error('Error fetching USDC balance:', err);
              }
            }
          } catch (parseError) {
            console.error('Error parsing config data:', parseError);
          }
        }
      } catch (err) {
        console.error('Error checking accounts:', err);
      } finally {
        setIsFetchingData(false);
      }
    };

    checkAccounts();
  }, [solanaAddress, connection, usdcMint]);

  const validatePublicKey = (key: string): boolean => {
    try {
      new PublicKey(key);
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleInitializeConfig = async () => {
    if (!solanaAddress) {
      setError('Please connect your wallet');
      notifications.show('Please connect your wallet', {
        severity: 'warning',
        autoHideDuration: 3000,
      });
      return;
    }

    if (!validatePublicKey(usdcMint)) {
      setError('Invalid USDC mint address');
      notifications.show('Invalid USDC mint address', {
        severity: 'error',
        autoHideDuration: 3000,
      });
      return;
    }

    setIsInitializing(true);
    setStatus('Initializing config...');
    setError('');

    try {
      // Find the owner config PDA
      const [configPDAAddress] = findProgramAddressSync(
        [Buffer.from('OwnerConfig')],
        PROGRAM_ID
      );
      setConfigPDA(configPDAAddress);

      // Check if config account already exists
      const configAccount = await connection.getAccountInfo(configPDAAddress);
      
      if (configAccount !== null) {
        setConfigExists(true);
        setStatus('Config already initialized. Proceeding to initialize USDC account...');
        await handleInitializeUsdcAccount(configPDAAddress);
        return;
      }

      // Create initialize_config instruction
      const initializeConfigIx = {
        programId: PROGRAM_ID,
        keys: [
          { pubkey: new PublicKey(solanaAddress), isSigner: true, isWritable: true },
          { pubkey: configPDAAddress, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: web3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        ],
        data: createInitializeConfigData(new PublicKey(usdcMint)),
      };

      // Create transaction
      const tx = new Transaction().add({
        ...initializeConfigIx,
      });
      
      // Set recent blockhash and fee payer
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = new PublicKey(solanaAddress);

      // Check if Phantom wallet is available
      if (!window.solana) {
        throw new Error('Phantom wallet is not available');
      }
      
      // Sign and send the transaction using Phantom wallet
      const signedTransaction = await window.solana.signAndSendTransaction(tx);
      console.log('Transaction sent with signature:', signedTransaction.signature);
      
      // Wait for confirmation
      await connection.confirmTransaction(signedTransaction.signature, 'confirmed');
      
      setConfigExists(true);
      setStatus(`Config initialized! Transaction signature: ${signedTransaction.signature}`);
      
      notifications.show('Config initialized successfully!', {
        severity: 'success',
        autoHideDuration: 5000,
      });
      
      // After initializing config, initialize the USDC account
      await handleInitializeUsdcAccount(configPDAAddress);
      
      // Refresh the config data
      const updatedConfigAccount = await connection.getAccountInfo(configPDAAddress);
      if (updatedConfigAccount) {
        try {
          // Skip the 8-byte discriminator
          const dataBuffer = updatedConfigAccount.data.slice(8);
          
          const ownerPubkey = new PublicKey(dataBuffer.slice(0, 32));
          const usdcMintPubkey = new PublicKey(dataBuffer.slice(32, 64));
          const collectedFeesBigInt = dataBuffer.readBigUInt64LE(64);
          
          setConfigData({
            owner: ownerPubkey.toString(),
            usdcMint: usdcMintPubkey.toString(),
            collectedFees: Number(collectedFeesBigInt)
          });
        } catch (parseError) {
          console.error('Error parsing updated config data:', parseError);
        }
      }
    } catch (err) {
      console.error('Error initializing config:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Error initializing config: ${errorMessage}`);
      
      notifications.show(`Error initializing config: ${errorMessage}`, {
        severity: 'error',
        autoHideDuration: 5000,
      });
      
      setIsInitializing(false);
    }
  };

  const handleInitializeUsdcAccount = async (configPDAAddress?: PublicKey) => {
    if (!solanaAddress) {
      setError('Please connect your wallet');
      return;
    }

    setStatus('Initializing USDC account...');

    try {
      // If configPDA is not provided, use the stored one or find it
      if (!configPDAAddress) {
        if (configPDA) {
          configPDAAddress = configPDA;
        } else {
          [configPDAAddress] = findProgramAddressSync(
            [Buffer.from('OwnerConfig')],
            PROGRAM_ID
          );
          setConfigPDA(configPDAAddress);
        }
      }

      // Get the program's USDC account address
      const usdcMintPubkey = new PublicKey(usdcMint);
      const programUsdcAccount = await getAssociatedTokenAddress(
        usdcMintPubkey,
        configPDAAddress,
        true // allowOwnerOffCurve
      );
      
      setProgramUsdcAccount(programUsdcAccount);

      // Check if USDC account already exists
      const usdcAccount = await connection.getAccountInfo(programUsdcAccount);
      
      if (usdcAccount !== null) {
        setUsdcAccountExists(true);
        setStatus('USDC account already initialized. Setup complete!');
        setIsInitializing(false);
        
        notifications.show('USDC account already initialized. Setup complete!', {
          severity: 'success',
          autoHideDuration: 5000,
        });
        
        // Fetch USDC balance
        try {
          const tokenAccountInfo = await connection.getTokenAccountBalance(programUsdcAccount);
          if (tokenAccountInfo && tokenAccountInfo.value) {
            setUsdcBalance(Number(tokenAccountInfo.value.amount) / 1_000_000);
          }
        } catch (balanceErr) {
          console.error('Error fetching USDC balance:', balanceErr);
        }
        
        return;
      }

      // Create initialize_usdc_account instruction
      const initializeUsdcAccountIx = {
        programId: PROGRAM_ID,
        keys: [
          { pubkey: new PublicKey(solanaAddress), isSigner: true, isWritable: true },
          { pubkey: configPDAAddress, isSigner: false, isWritable: true },
          { pubkey: programUsdcAccount, isSigner: false, isWritable: true },
          { pubkey: usdcMintPubkey, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: web3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        ],
        data: createInitializeUsdcAccountData(),
      };

      // Create transaction
      const tx = new Transaction().add({
        ...initializeUsdcAccountIx,
      });
      
      // Set recent blockhash and fee payer
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = new PublicKey(solanaAddress);

      // Check if Phantom wallet is available
      if (!window.solana) {
        throw new Error('Phantom wallet is not available');
      }
      
      // Sign and send the transaction using Phantom wallet
      const signedTransaction = await window.solana.signAndSendTransaction(tx);
      console.log('Transaction sent with signature:', signedTransaction.signature);
      
      // Wait for confirmation
      await connection.confirmTransaction(signedTransaction.signature, 'confirmed');
      
      setUsdcAccountExists(true);
      setStatus(`USDC account initialized! Transaction signature: ${signedTransaction.signature}`);
      
      notifications.show('USDC account initialized successfully!', {
        severity: 'success',
        autoHideDuration: 5000,
      });
      
      // Fetch USDC balance (should be 0 for a new account)
      try {
        const tokenAccountInfo = await connection.getTokenAccountBalance(programUsdcAccount);
        if (tokenAccountInfo && tokenAccountInfo.value) {
          setUsdcBalance(Number(tokenAccountInfo.value.amount) / 1_000_000);
        }
      } catch (balanceErr) {
        console.error('Error fetching USDC balance:', balanceErr);
      }
    } catch (err) {
      console.error('Error initializing USDC account:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Error initializing USDC account: ${errorMessage}`);
      
      notifications.show(`Error initializing USDC account: ${errorMessage}`, {
        severity: 'error',
        autoHideDuration: 5000,
      });
    } finally {
      setIsInitializing(false);
    }
  };

  // Helper function to create initialize_config instruction data
  const createInitializeConfigData = (usdcMintPubkey: PublicKey): Buffer => {
    // Discriminator for initialize_config from IDL
    const discriminator = Buffer.from([208, 127, 21, 1, 194, 190, 196, 70]);
    
    // Pubkey is 32 bytes
    const pubkeyBuffer = usdcMintPubkey.toBuffer();
    
    // Combine discriminator and pubkey
    return Buffer.concat([discriminator, pubkeyBuffer]);
  };

  // Helper function to create initialize_usdc_account instruction data
  const createInitializeUsdcAccountData = (): Buffer => {
    // Discriminator for initialize_usdc_account from IDL
    return Buffer.from([103, 20, 54, 81, 255, 20, 113, 205]);
  };

  // Function to refresh the data
  const refreshData = async () => {
    if (!configPDA) return;
    
    setIsFetchingData(true);
    try {
      // Fetch config account data
      const configAccount = await connection.getAccountInfo(configPDA);
      setConfigExists(configAccount !== null);
      
      if (configAccount !== null) {
        // Parse the config data
        try {
          // Skip the 8-byte discriminator
          const dataBuffer = configAccount.data.slice(8);
          
          const ownerPubkey = new PublicKey(dataBuffer.slice(0, 32));
          const usdcMintPubkey = new PublicKey(dataBuffer.slice(32, 64));
          const collectedFeesBigInt = dataBuffer.readBigUInt64LE(64);
          
          setConfigData({
            owner: ownerPubkey.toString(),
            usdcMint: usdcMintPubkey.toString(),
            collectedFees: Number(collectedFeesBigInt)
          });
          
          // If USDC account exists, fetch its balance
          if (programUsdcAccount) {
            try {
              // Get token account balance
              const tokenAccountInfo = await connection.getTokenAccountBalance(programUsdcAccount);
              if (tokenAccountInfo && tokenAccountInfo.value) {
                setUsdcBalance(Number(tokenAccountInfo.value.amount) / 1_000_000);
              }
            } catch (err) {
              console.error('Error fetching USDC balance:', err);
            }
          }
        } catch (parseError) {
          console.error('Error parsing config data:', parseError);
        }
      }
      
      notifications.show('Data refreshed successfully', {
        severity: 'success',
        autoHideDuration: 3000,
      });
    } catch (err) {
      console.error('Error refreshing data:', err);
      notifications.show('Error refreshing data', {
        severity: 'error',
        autoHideDuration: 3000,
      });
    } finally {
      setIsFetchingData(false);
    }
  };

  // Function to copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        notifications.show('Copied to clipboard!', {
          severity: 'success',
          autoHideDuration: 2000,
        });
      },
      (err) => {
        console.error('Could not copy text: ', err);
        notifications.show('Failed to copy to clipboard', {
          severity: 'error',
          autoHideDuration: 3000,
        });
      }
    );
  };

  // Function to format address for display
  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <Box sx={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: 4,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    }}>
      <Paper 
        elevation={3} 
        sx={{ 
          padding: 4, 
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <SettingsIcon sx={{ fontSize: 28, mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Initialize Token Locker Contract
          </Typography>
        </Box>
        
        <Typography variant="body1" sx={{ mb: 3 }}>
          This page allows you to initialize the Token Locker contract that supports multiple locks per wallet.
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        {configExists && usdcAccountExists ? (
          <>
            <Alert 
              severity="success" 
              sx={{ mb: 3, borderRadius: 2 }}
              icon={<CheckCircleIcon fontSize="inherit" />}
            >
              Contract is already fully initialized and ready to use!
            </Alert>
            
            <Box sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                onClick={refreshData}
                disabled={isFetchingData}
                startIcon={isFetchingData ? <CircularProgress size={20} /> : <RefreshIcon />}
                sx={{ borderRadius: 2 }}
              >
                {isFetchingData ? 'Refreshing...' : 'Refresh Data'}
              </Button>
            </Box>
            
            {configData && (
              <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Contract Configuration
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Owner
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                          {formatAddress(configData.owner)}
                        </Typography>
                        <Button 
                          size="small" 
                          onClick={() => copyToClipboard(configData.owner)}
                          sx={{ minWidth: 'auto', ml: 1 }}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </Button>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {configData.owner === solanaAddress ? '(Your wallet)' : ''}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        USDC Mint
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                          {formatAddress(configData.usdcMint)}
                        </Typography>
                        <Button 
                          size="small" 
                          onClick={() => copyToClipboard(configData.usdcMint)}
                          sx={{ minWidth: 'auto', ml: 1 }}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </Button>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Collected Fees
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <Typography variant="body2">
                        {configData.collectedFees / 1_000_000} USDC
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Program ID
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                          {formatAddress(PROGRAM_ID.toString())}
                        </Typography>
                        <Button 
                          size="small" 
                          onClick={() => copyToClipboard(PROGRAM_ID.toString())}
                          sx={{ minWidth: 'auto', ml: 1 }}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </Button>
                      </Box>
                    </Grid>
                    
                    {programUsdcAccount && (
                      <>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Program USDC Account
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={8}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                              {formatAddress(programUsdcAccount.toString())}
                            </Typography>
                            <Button 
                              size="small" 
                              onClick={() => copyToClipboard(programUsdcAccount.toString())}
                              sx={{ minWidth: 'auto', ml: 1 }}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </Button>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={4}>
                          <Typography variant="subtitle2" color="text.secondary">
                            USDC Balance
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={8}>
                          <Typography variant="body2">
                            {usdcBalance !== null ? `${usdcBalance} USDC` : 'Loading...'}
                          </Typography>
                        </Grid>
                      </>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            )}
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              You can view the contract on{' '}
              <Link 
                href={`https://explorer.solana.com/address/${PROGRAM_ID.toString()}?cluster=devnet`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Solana Explorer
              </Link>
            </Typography>
          </>
        ) : (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 1 }}>
                USDC Mint Address
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                value={usdcMint}
                onChange={(e) => setUsdcMint(e.target.value)}
                disabled={isInitializing}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Chip 
                  icon={configExists ? <CheckCircleIcon /> : <ErrorIcon />} 
                  label="Config Initialized" 
                  color={configExists ? "success" : "default"}
                  variant="outlined"
                />
                <Chip 
                  icon={usdcAccountExists ? <CheckCircleIcon /> : <ErrorIcon />} 
                  label="USDC Account Initialized" 
                  color={usdcAccountExists ? "success" : "default"}
                  variant="outlined"
                />
              </Stack>
            </Box>

            <Button
              variant="contained"
              fullWidth
              onClick={handleInitializeConfig}
              disabled={!isSolanaConnected || isInitializing || (configExists && usdcAccountExists)}
              sx={{ 
                py: 1.5, 
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem'
              }}
              startIcon={isInitializing ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isInitializing 
                ? 'Initializing...' 
                : configExists 
                  ? 'Initialize USDC Account' 
                  : 'Initialize Contract'
              }
            </Button>
          </>
        )}

        {status && (
          <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
            {status}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>
    </Box>
  );
};

export default InitializeContract; 
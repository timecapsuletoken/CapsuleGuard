import React, { useState, useEffect } from 'react';
import { useWallet } from "../App";
import { useConnection } from '@solana/wallet-adapter-react';
import { 
  PROGRAM_ID, 
  USDC_MINT, 
  COMMITMENT
} from "../config/index";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
  Chip,
  Link,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { getAssociatedTokenAddress, getMint, getAccount } from '@solana/spl-token';
import { notify } from "../utils/toast";
import bs58 from 'bs58';

// Define interfaces for the data we'll display
interface ConfigData {
  owner: string;
  usdcMint: string;
  collectedFees: string;
}

interface TokenLockInfo {
  lockAccount: string;
  locker: string;
  tokenMint: string;
  lockedAmount: string;
  unlockTime: string;
  creationTime: string;
  seed: string;
  isSPL: boolean;
}

interface ContractStats {
  totalLocks: number;
  totalSOLLocked: number;
  totalSPLLocked: number;
  totalFeesCollected: string;
  activeUsers: number;
}

const AdminDashboard: React.FC = () => {
  const { solanaAddress, isSolanaConnected, solanaNetwork } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [configData, setConfigData] = useState<ConfigData | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [lockAccounts, setLockAccounts] = useState<TokenLockInfo[]>([]);
  const [stats, setStats] = useState<ContractStats>({
    totalLocks: 0,
    totalSOLLocked: 0,
    totalSPLLocked: 0,
    totalFeesCollected: '0',
    activeUsers: 0
  });
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Fetch data when component mounts
  useEffect(() => {
    if (isSolanaConnected) {
      fetchContractData();
    }
  }, [isSolanaConnected, solanaNetwork]);

  // Function to fetch all contract data
  const fetchContractData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const conn = connection || new Connection(clusterApiUrl(solanaNetwork as WalletAdapterNetwork), COMMITMENT);
      
      // 1. Fetch config account data
      await fetchConfigData(conn);
      
      // 2. Fetch all lock accounts
      await fetchLockAccounts(conn);
      
    } catch (error) {
      console.error('Error fetching contract data:', error);
      setError('Failed to fetch contract data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch config account data
  const fetchConfigData = async (conn: Connection) => {
    try {
      // Calculate PDA for config account
      const [configPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("OwnerConfig")],
        PROGRAM_ID
      );
      
      console.log('Config PDA:', configPDA.toString());
      
      // Get config account info
      const configAccountInfo = await conn.getAccountInfo(configPDA);
      
      if (!configAccountInfo) {
        console.log('Config account not found');
        return;
      }
      
      // Parse config data (skip 8-byte discriminator)
      const dataBuffer = configAccountInfo.data.slice(8);
      
      // Parse the OwnerConfig struct
      // owner: Pubkey (32 bytes)
      // usdc_mint: Pubkey (32 bytes)
      // collected_fees: u64 (8 bytes)
      
      const ownerPubkey = new PublicKey(dataBuffer.slice(0, 32));
      const usdcMintPubkey = new PublicKey(dataBuffer.slice(32, 64));
      const collectedFeesBigInt = dataBuffer.readBigUInt64LE(64);
      
      // Convert collected fees to USDC (6 decimals)
      const collectedFeesUsdc = Number(collectedFeesBigInt) / 1_000_000;
      
      setConfigData({
        owner: ownerPubkey.toString(),
        usdcMint: usdcMintPubkey.toString(),
        collectedFees: collectedFeesUsdc.toString()
      });
      
      // Get the program's USDC account
      const programUsdcAccount = await getAssociatedTokenAddress(
        usdcMintPubkey,
        configPDA,
        true // allowOwnerOffCurve = true for PDAs
      );
      
      try {
        // Get USDC account info
        const usdcAccountInfo = await getAccount(conn, programUsdcAccount);
        const usdcBalanceAmount = Number(usdcAccountInfo.amount) / 1_000_000; // USDC has 6 decimals
        setUsdcBalance(usdcBalanceAmount.toString());
      } catch (error) {
        console.error('Error fetching USDC account:', error);
        setUsdcBalance('0');
      }
      
    } catch (error) {
      console.error('Error fetching config data:', error);
    }
  };

  // Fetch all lock accounts
  const fetchLockAccounts = async (conn: Connection) => {
    try {
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
      
      console.log(`Found ${programAccounts.length} lock accounts`);
      
      const defaultPubkey = new PublicKey('11111111111111111111111111111111'); // For native SOL
      const lockInfos: TokenLockInfo[] = [];
      const uniqueUsers = new Set<string>();
      let totalSOLLocked = 0;
      let totalSPLLocked = 0;
      
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
          
          // Add user to unique users set
          uniqueUsers.add(lockerPubkey.toString());
          
          // Check if it's a native SOL token or SPL token
          const isSPL = !tokenMintPubkey.equals(defaultPubkey);
          
          let lockedAmount: string;
          
          if (isSPL) {
            // For SPL tokens, increment counter
            totalSPLLocked++;
            // Just use the raw amount for now
            lockedAmount = lockedAmountBigInt.toString();
          } else {
            // For native SOL, convert from lamports and add to total
            const solAmount = Number(lockedAmountBigInt) / 1_000_000_000;
            totalSOLLocked += solAmount;
            lockedAmount = solAmount.toString();
          }
          
          // Convert timestamps to dates
          const unlockTimeDate = new Date(Number(unlockTimeBigInt) * 1000);
          const creationTimeDate = new Date(Number(creationTimeBigInt) * 1000);
          
          lockInfos.push({
            lockAccount: account.pubkey.toString(),
            locker: lockerPubkey.toString(),
            tokenMint: tokenMintPubkey.toString(),
            lockedAmount: lockedAmount,
            unlockTime: unlockTimeDate.toLocaleString(),
            creationTime: creationTimeDate.toLocaleString(),
            seed: seedBigInt.toString(),
            isSPL: isSPL
          });
        } catch (error) {
          console.error('Error parsing account data:', error);
        }
      }
      
      // Update state with lock accounts and stats
      setLockAccounts(lockInfos);
      setStats({
        totalLocks: lockInfos.length,
        totalSOLLocked: totalSOLLocked,
        totalSPLLocked: totalSPLLocked,
        totalFeesCollected: configData?.collectedFees || '0',
        activeUsers: uniqueUsers.size
      });
      
    } catch (error) {
      console.error('Error fetching lock accounts:', error);
    }
  };

  // Function to refresh data
  const refreshData = async () => {
    setRefreshing(true);
    await fetchContractData();
    setRefreshing(false);
  };

  // Check if user is the contract owner
  const isOwner = configData?.owner === solanaAddress;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Admin Dashboard</Typography>
        <Button 
          variant="contained" 
          onClick={refreshData}
          disabled={refreshing}
          startIcon={refreshing ? <CircularProgress size={20} /> : null}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </Box>
      
      {!isSolanaConnected && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please connect your Solana wallet to access the admin dashboard.
        </Alert>
      )}
      
      {isSolanaConnected && !isOwner && configData && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You are not the contract owner. Some features may be restricted.
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Contract Stats */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Contract Statistics</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={2}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">Total Locks</Typography>
                      <Typography variant="h4">{stats.totalLocks}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">Total SOL Locked</Typography>
                      <Typography variant="h4">{stats.totalSOLLocked.toFixed(4)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">SPL Token Locks</Typography>
                      <Typography variant="h4">{stats.totalSPLLocked}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">Fees Collected (USDC)</Typography>
                      <Typography variant="h4">{parseFloat(stats.totalFeesCollected).toFixed(2)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">Active Users</Typography>
                      <Typography variant="h4">{stats.activeUsers}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Contract Configuration */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Contract Configuration</Typography>
              {configData ? (
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Program ID" 
                      secondary={
                        <Link 
                          href={`https://explorer.solana.com/address/${PROGRAM_ID.toString()}?cluster=${solanaNetwork === 'mainnet-beta' ? 'mainnet' : solanaNetwork}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {PROGRAM_ID.toString()}
                        </Link>
                      } 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Owner" 
                      secondary={
                        <Link 
                          href={`https://explorer.solana.com/address/${configData.owner}?cluster=${solanaNetwork === 'mainnet-beta' ? 'mainnet' : solanaNetwork}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {configData.owner}
                        </Link>
                      } 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="USDC Mint" 
                      secondary={
                        <Link 
                          href={`https://explorer.solana.com/address/${configData.usdcMint}?cluster=${solanaNetwork === 'mainnet-beta' ? 'mainnet' : solanaNetwork}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {configData.usdcMint}
                        </Link>
                      } 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Collected Fees" 
                      secondary={`${configData.collectedFees} USDC`} 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="USDC Balance" 
                      secondary={usdcBalance ? `${usdcBalance} USDC` : 'Loading...'} 
                    />
                  </ListItem>
                </List>
              ) : (
                <Typography>Contract not initialized or data not available.</Typography>
              )}
            </Paper>
          </Grid>
          
          {/* Recent Locks */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Recent Locks</Typography>
              {lockAccounts.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell>Unlock Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lockAccounts.slice(0, 5).map((lock, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Chip 
                              label={lock.isSPL ? "SPL" : "SOL"} 
                              color={lock.isSPL ? "primary" : "success"} 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>{lock.lockedAmount}</TableCell>
                          <TableCell>{new Date(lock.creationTime).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(lock.unlockTime).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography>No locks found.</Typography>
              )}
            </Paper>
          </Grid>
          
          {/* All Locks */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>All Locks</Typography>
              {lockAccounts.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Lock Account</TableCell>
                        <TableCell>Locker</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Token</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell>Unlock Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lockAccounts.map((lock, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Link 
                              href={`https://explorer.solana.com/address/${lock.lockAccount}?cluster=${solanaNetwork === 'mainnet-beta' ? 'mainnet' : solanaNetwork}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ fontSize: '0.8rem' }}
                            >
                              {lock.lockAccount.slice(0, 4)}...{lock.lockAccount.slice(-4)}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link 
                              href={`https://explorer.solana.com/address/${lock.locker}?cluster=${solanaNetwork === 'mainnet-beta' ? 'mainnet' : solanaNetwork}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ fontSize: '0.8rem' }}
                            >
                              {lock.locker.slice(0, 4)}...{lock.locker.slice(-4)}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={lock.isSPL ? "SPL" : "SOL"} 
                              color={lock.isSPL ? "primary" : "success"} 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                            {lock.isSPL ? (
                              <Link 
                                href={`https://explorer.solana.com/address/${lock.tokenMint}?cluster=${solanaNetwork === 'mainnet-beta' ? 'mainnet' : solanaNetwork}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ fontSize: '0.8rem' }}
                              >
                                {lock.tokenMint.slice(0, 4)}...{lock.tokenMint.slice(-4)}
                              </Link>
                            ) : (
                              "SOL"
                            )}
                          </TableCell>
                          <TableCell>{lock.lockedAmount}</TableCell>
                          <TableCell>{new Date(lock.creationTime).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(lock.unlockTime).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography>No locks found.</Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default AdminDashboard; 
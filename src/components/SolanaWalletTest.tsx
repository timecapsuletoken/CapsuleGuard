import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Box, Typography, Button, CircularProgress, Paper, Alert } from '@mui/material';

// Ensure Buffer is available
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = require('buffer').Buffer;
}

const SolanaWalletTest: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    if (!publicKey) {
      setError('Wallet not connected');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching balance for wallet:', publicKey.toString());
      const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
      const balance = await connection.getBalance(publicKey);
      console.log('Raw balance:', balance);
      setBalance(balance / LAMPORTS_PER_SOL);
      console.log('Formatted balance:', balance / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Failed to fetch balance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
      console.log('Wallet connected, fetching balance');
      fetchBalance();
    } else {
      console.log('Wallet not connected');
      setBalance(null);
    }
  }, [connected, publicKey]);

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2, maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Solana Wallet Test
      </Typography>
      
      {!connected ? (
        <Alert severity="info" sx={{ my: 2 }}>
          Please connect your Solana wallet to test the integration.
        </Alert>
      ) : (
        <>
          <Box sx={{ my: 2 }}>
            <Typography variant="subtitle1">
              Connected Wallet:
            </Typography>
            <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
              {publicKey?.toString() || 'Unknown'}
            </Typography>
          </Box>
          
          <Box sx={{ my: 2 }}>
            <Typography variant="subtitle1">
              SOL Balance:
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} />
                <Typography variant="body1">Loading...</Typography>
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ my: 1 }}>
                {error}
              </Alert>
            ) : (
              <Typography variant="body1">
                {balance !== null ? `${balance.toFixed(4)} SOL` : 'Unknown'}
              </Typography>
            )}
          </Box>
          
          <Button 
            variant="contained" 
            onClick={fetchBalance} 
            disabled={loading}
            sx={{ mt: 2 }}
          >
            Refresh Balance
          </Button>
        </>
      )}
    </Paper>
  );
};

export default SolanaWalletTest; 
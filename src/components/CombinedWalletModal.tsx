import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Box, 
  Typography, 
  Grid,
  CircularProgress
} from '@mui/material';
import { Theme } from '../styles/theme';
import { useWeb3Modal } from 'web3modal-web3js/react';
import { useWallet } from '../App';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

// Ensure Buffer is available
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = require('buffer').Buffer;
}

// Import wallet icons
import PhantomIcon from '../assets/images/walletproviders/phantom.png';
import SolflareIcon from '../assets/images/walletproviders/solflare.png';
import SolanaIcon from '../assets/images/walletproviders/solana.png';
import EthereumIcon from '../assets/images/walletproviders/ethereum.png';

interface CombinedWalletModalProps {
  open: boolean;
  onClose: () => void;
}

const CombinedWalletModal: React.FC<CombinedWalletModalProps> = ({ open, onClose }) => {
  const [connecting, setConnecting] = useState(false);
  const { open: openWeb3Modal } = useWeb3Modal();
  const { isConnected, isSolanaConnected } = useWallet();
  const solanaWallet = useSolanaWallet();
  const { visible: solanaModalVisible, setVisible: setSolanaModalVisible } = useWalletModal();

  // Close modal if connected
  useEffect(() => {
    if (isConnected || isSolanaConnected) {
      console.log('Wallet connected, closing modal');
      onClose();
      setConnecting(false);
    }
  }, [isConnected, isSolanaConnected, onClose]);

  // Monitor Solana wallet modal visibility
  useEffect(() => {
    console.log('Solana wallet modal visibility:', solanaModalVisible);
    
    // If the Solana modal is closed and we were connecting, check if we're connected
    if (!solanaModalVisible && connecting) {
      if (solanaWallet.connected) {
        console.log('Solana wallet connected after modal closed');
        setConnecting(false);
      } else {
        console.log('Solana modal closed but wallet not connected');
        // Wait a moment to see if connection completes
        setTimeout(() => {
          if (!solanaWallet.connected && !solanaWallet.connecting) {
            console.log('Connection not established after delay');
            setConnecting(false);
          }
        }, 1000);
      }
    }
  }, [solanaModalVisible, solanaWallet, connecting]);

  const handleEthWalletConnect = () => {
    console.log('Opening Ethereum wallet modal');
    setConnecting(true);
    
    // First close this modal
    onClose();
    
    // Then open the Web3Modal after a short delay
    setTimeout(() => {
      console.log('Opening Web3Modal');
      openWeb3Modal();
    }, 300);
  };

  const handleSolanaWalletConnect = () => {
    console.log('Opening Solana wallet modal');
    setConnecting(true);
    
    // First close this modal
    onClose();
    
    // Then open the Solana wallet modal after a short delay
    setTimeout(() => {
      console.log('Opening Solana wallet modal');
      setSolanaModalVisible(true);
    }, 300);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 2,
          width: '100%',
          maxWidth: 450,
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
        Connect Wallet
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        {connecting ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
            <CircularProgress size={40} />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Connecting to wallet...
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2, textAlign: 'center' }}>
                Select Blockchain
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Box 
                sx={{ 
                  p: 2, 
                  border: '1px solid rgba(255, 255, 255, 0.12)', 
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: Theme.palette.primary.main,
                    backgroundColor: 'rgba(0, 0, 0, 0.05)'
                  }
                }}
                onClick={handleEthWalletConnect}
              >
                <img src={EthereumIcon} alt="Ethereum" style={{ width: 48, height: 48, marginBottom: 8 }} />
                <Typography variant="body1">ETH EVMs</Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box 
                sx={{ 
                  p: 2, 
                  border: '1px solid rgba(255, 255, 255, 0.12)', 
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: Theme.palette.primary.main,
                    backgroundColor: 'rgba(0, 0, 0, 0.05)'
                  }
                }}
                onClick={handleSolanaWalletConnect}
              >
                <img src={SolanaIcon} alt="Solana" style={{ width: 48, height: 48, marginBottom: 8 }} />
                <Typography variant="body1">Solana</Typography>
              </Box>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CombinedWalletModal; 
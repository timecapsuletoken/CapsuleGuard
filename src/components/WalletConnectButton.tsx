import React, { useState, useEffect } from 'react';
import { Button, Menu, MenuItem, Box, Typography, Avatar, Badge, Stack } from '@mui/material';
import { useWallet } from '../App';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import CombinedWalletModal from './CombinedWalletModal';
import { Theme } from '../styles/theme';
import { styled } from '@mui/material/styles';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { SiSolana, SiEthereum } from "react-icons/si";
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWeb3Modal } from 'web3modal-web3js/react';
import EthereumIcon from '../assets/images/walletproviders/ethereum.png';

const SmallAvatar = styled(Avatar)(({ theme }) => ({
  width: 22,
  height: 22,
  border: `2px solid ${theme.palette.primary.main}`,
}));

// Ensure Buffer is available
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = require('buffer').Buffer;
}

const WalletConnectButton: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const { 
    address, 
    isConnected, 
    solanaAddress, 
    isSolanaConnected,
    disconnectWallet,
    disconnectSolanaWallet
  } = useWallet();
  const solanaWallet = useSolanaWallet();
  const { visible: solanaModalVisible, setVisible: setSolanaModalVisible } = useWalletModal();
  const web3Modal = useWeb3Modal();

  // Monitor wallet modal visibility
  useEffect(() => {
    console.log('Wallet modal states:', { 
      combinedModalOpen: modalOpen,
      solanaModalVisible
    });
    
    // If Solana modal is open, ensure our combined modal is closed
    if (solanaModalVisible) {
      setModalOpen(false);
    }
  }, [modalOpen, solanaModalVisible]);

  const handleOpenModal = () => {
    console.log('Opening wallet connect modal');
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    console.log('Closing wallet connect modal');
    setModalOpen(false);
  };

  const handleDisconnect = () => {
    console.log('Disconnecting wallet');
    if (isConnected) {
      disconnectWallet();
      web3Modal.open();
    }
    if (isSolanaConnected) {
      disconnectSolanaWallet();
    }
  };

  const formatAddress = (addr: string | undefined) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <>
      {isConnected || isSolanaConnected ? (
        <Button
          variant="outlined"
          onClick={handleDisconnect}
          sx={{
            borderRadius: 2,
            borderColor: Theme.palette.primary.main,
            color: Theme.palette.primary.main,
            textTransform: 'none',
            px: 2,
            py: 1,
            my: 1,
            '&:hover': {
              borderColor: Theme.palette.primary.dark,
              backgroundColor: 'rgba(99, 102, 241, 0.08)',
            },
          }}
        >
          {isConnected && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>

              <Stack direction="row" spacing={2}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <SmallAvatar>
                      <SiEthereum style={{ color: Theme.palette.primary.dark }} />
                    </SmallAvatar>
                  }
                >
                  <Avatar alt="Network" src={EthereumIcon} />
                </Badge>
              </Stack>

              {/* <Avatar 
                sx={{ 
                  width: 20, 
                  height: 20, 
                  mr: 1,
                  backgroundColor: 'transparent'
                }} 
              >
                <SiEthereum style={{ color: Theme.palette.primary.dark }} />
              </Avatar> */}
              <Typography variant="body2">{formatAddress(address)}</Typography>
            </Box>
          )}
          {isSolanaConnected && !isConnected && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 20, 
                  height: 20, 
                  mr: 1,
                  backgroundColor: 'transparent'
                }} 
              >
                <SiSolana style={{ color: Theme.palette.primary.dark }} />
              </Avatar>
              <Typography variant="body2">{formatAddress(solanaAddress)}</Typography>
            </Box>
          )}
        </Button>
      ) : (
        <Button
          variant="contained"
          onClick={handleOpenModal}
          sx={{
            borderRadius: 2,
            backgroundColor: Theme.palette.primary.main,
            color: '#fff',
            textTransform: 'none',
            px: 2,
            py: 1,
            my: 1,
            '&:hover': {
              backgroundColor: Theme.palette.primary.dark,
            },
          }}
        >
          <AccountBalanceWalletIcon sx={{ mr: 1, fontSize: 20 }} />
          <Typography variant="body2">Connect Wallet</Typography>
        </Button>
      )}

      <CombinedWalletModal open={modalOpen} onClose={handleCloseModal} />
    </>
  );
};

export default WalletConnectButton; 
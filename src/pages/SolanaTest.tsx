import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import SolanaWalletTest from '../components/SolanaWalletTest';

const SolanaTest: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Solana Wallet Integration Test
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
          This page allows you to test the Solana wallet integration.
        </Typography>
        
        <SolanaWalletTest />
      </Box>
    </Container>
  );
};

export default SolanaTest; 
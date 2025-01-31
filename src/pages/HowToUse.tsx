import * as React from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
} from '@mui/material';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';

import WalletIcon from '@mui/icons-material/Wallet';
import LanIcon from '@mui/icons-material/Lan';
import LockIcon from '@mui/icons-material/Lock';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import VisibilityIcon from '@mui/icons-material/Visibility';

const HowToUse: React.FC = () => {
  return (
    <Container sx={{ mt: 5, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" color="primary" gutterBottom sx={{ fontSize: { xs: '1.8rem', sm: '2.2rem' } }}>
          How to Use CapsuleGuard
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          Follow these simple steps to securely lock your tokens and liquidity.
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
        <Timeline position="alternate">
          {/* Step 1: Connect Wallet */}
          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot color="primary">
                <WalletIcon />
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="h6">Connect Your Wallet</Typography>
              <Typography variant="body2" color="textSecondary">
                Use MetaMask, Coinbase Wallet, or other supported wallets to connect to CapsuleGuard.
              </Typography>
            </TimelineContent>
          </TimelineItem>

          {/* Step 2: Select Network */}
          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot color="secondary">
                <LanIcon />
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="h6">Select Blockchain Network</Typography>
              <Typography variant="body2" color="textSecondary">
                Choose from Ethereum, BNB Smart Chain, Polygon, Arbitrum, and other supported networks.
              </Typography>
            </TimelineContent>
          </TimelineItem>

          {/* Step 3: Enter Locking Details */}
          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot color="primary">
                <LockIcon />
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="h6">Enter Locking Details</Typography>
              <Typography variant="body2" color="textSecondary">
                Provide the token address, amount, and select the unlock time for your locked assets.
              </Typography>
            </TimelineContent>
          </TimelineItem>

          {/* Step 4: Approve & Lock Tokens */}
          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot color="secondary">
                <DoneAllIcon />
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="h6">Approve & Lock Tokens</Typography>
              <Typography variant="body2" color="textSecondary">
                Approve token spending, confirm the transaction, and secure your assets on the blockchain.
              </Typography>
            </TimelineContent>
          </TimelineItem>

          {/* Step 5: Manage Locked Tokens */}
          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot color="primary">
                <VisibilityIcon />
              </TimelineDot>
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="h6">Manage Locked Tokens</Typography>
              <Typography variant="body2" color="textSecondary">
                Track, view, and withdraw your locked assets once they reach the unlock period.
              </Typography>
            </TimelineContent>
          </TimelineItem>
        </Timeline>
      </Paper>
    </Container>
  );
};

export default HowToUse;
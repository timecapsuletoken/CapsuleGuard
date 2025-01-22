import React from 'react';
import { Box, Typography, Container, Grid, Paper, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import CodeIcon from '@mui/icons-material/Code';
import SecurityIcon from '@mui/icons-material/Security';

const LearnMore: React.FC = () => {
  return (
    <Container sx={{ mt: 5 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" color="primary" gutterBottom>
          Learn More About CapsuleGuard
        </Typography>
        <Typography variant="h6" color="textSecondary">
          Your ultimate solution for blockchain security and token management.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* About the dApp */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              What is CapsuleGuard?
            </Typography>
            <Typography>
              CapsuleGuard is a decentralized application (dApp) designed to provide a secure and efficient way to manage
              token locking on various blockchain networks. 
              
              It allows users to lock tokens or liquidity for a set
              duration, ensuring transparency and trust for token holders and projects alike.
              <br />
              CapsuleGuard supports multiple blockchain networks, providing flexibility and scalability for both individual users and project teams.
            </Typography>
          </Paper>
        </Grid>

        {/* Key Features */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Key Features
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Secure token and liquidity locking" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <InfoIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Multi-chain support (Ethereum, BNB Smart Chain, Arbitrum, and more)" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CodeIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Easy-to-use interface with step-by-step guidance" />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* How it Works */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              How It Works
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="1. Connect your wallet: Use a supported wallet like MetaMask to connect to the dApp."
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="2. Select your network: Choose from supported blockchains such as Ethereum, BNB Smart Chain, or Arbitrum."
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="3. Lock tokens: Enter the token address, amount, and lock duration to secure your tokens."
                />
              </ListItem>
              <ListItem>
                <ListItemText primary="4. Approve and confirm: Approve the transaction in your wallet and confirm the locking process." />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Technologies Used */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Technologies Used
            </Typography>
            <Typography>
              CapsuleGuard leverages the latest blockchain and web technologies to ensure a seamless user experience:
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <CodeIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="React and Material-UI for a modern and responsive user interface" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Ethers.js and Web3Modal for blockchain interactions and wallet integration" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <InfoIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Framer Motion for smooth animations and user feedback" />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Additional Info */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Additional Information
            </Typography>
            <Typography>
              CapsuleGuard supports a wide range of tokens and chains, making it a versatile tool for developers, project
              owners, and investors. Our platform is continuously evolving to include new features and enhance security.
            </Typography>
            <Typography sx={{ mt: 2 }}>
              For any questions or support, please visit our{' '}
              <a href="/support" style={{ color: '#9e03f2', textDecoration: 'none' }}>
                Support Page
              </a>
              .
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default LearnMore;
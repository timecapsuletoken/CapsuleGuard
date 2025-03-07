import React from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CardContent,
  Divider,
} from '@mui/material';

import { useContext } from "react";
import { RouterContext } from "../App";
import WalletConnectButton from '../components/WalletConnectButton';
import { useTheme } from "@mui/material/styles";

import Slider from 'react-infinite-logo-slider';
import InfoIcon from '@mui/icons-material/Info';
import LanIcon from '@mui/icons-material/Lan';
import CodeIcon from '@mui/icons-material/Code';
import SecurityIcon from '@mui/icons-material/Security';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WalletIcon from '@mui/icons-material/Wallet';

import EthLogo from '../assets/images/walletproviders/ethereum.png';
import ArbLogo from '../assets/images/walletproviders/arbitrum.png';
import BNBLogo from '../assets/images/walletproviders/bnb.png';
import OpLogo from '../assets/images/walletproviders/optimism.png';
import PolLogo from '../assets/images/walletproviders/polygon.png';
import AvaxLogo from '../assets/images/walletproviders/Avax.png';
import coinbaseLogo from '../assets/images/walletproviders/coinbase.png';
import lineaLogo from '../assets/images/walletproviders/linea.png';
import CronosLogo from '../assets/images/walletproviders/cronos.png';

const LearnMore: React.FC = () => {
    const { navigate } = useContext(RouterContext);
    const theme = useTheme();
  
  return (
    <Container sx={{ mt: 5, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" color="primary" gutterBottom sx={{ fontSize: { xs: '1.8rem', sm: '2.2rem' } }}>
          Learn More About CapsuleGuard
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          Your ultimate solution for blockchain security and token management.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* About the dApp */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
            <CardContent>
              <Box sx={{ textAlign: 'center' }}>
                <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
                  What is
                </Typography>
                <Typography variant="h5" component="div">
                  CapsuleGuard
                </Typography>
                <Typography sx={{ color: 'text.secondary', my: 1.5 }} component="div"><Chip label="Token Locking dApp" /></Typography>
              </Box>
              <Divider sx={{ my: 2 }}/>
              <Typography variant="body1">
                CapsuleGuard is a cutting-edge decentralized application (dApp) designed to provide a secure and efficient platform for managing token and liquidity locking across multiple blockchain networks.
                <br />
                With CapsuleGuard, users can securely lock tokens or liquidity for a predefined duration, fostering trust and transparency among token holders and project investors.
                <br />
                The dApp offers:
                <ul>
                  <li>Multi-chain support for networks such as Ethereum, BNB Smart Chain, Polygon, Arbitrum, and Avalanche, ensuring flexibility for diverse use cases.</li>
                  <li>A user-friendly interface that guides users step-by-step, making the process seamless and accessible to everyone.</li>
                  <li>Real-time asset management with a transparent unlock mechanism, allowing projects to showcase accountability.</li>
                  <li>Integration with leading wallets like MetaMask and Coinbase Wallet for a secure and effortless user experience.</li>
                </ul>
                CapsuleGuard is the ideal solution for project teams and individuals seeking a reliable and scalable token-locking platform.
              </Typography>
            </CardContent>
          </Paper>
        </Grid>

        {/* Key Features */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Key Features
            </Typography>
            <Divider sx={{ my: 2 }}/>
            <List sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', flexDirection: 'column' }}>
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Token and Liquidity Locking"
                  secondary="Lock both tokens and liquidity securely on supported blockchain networks, ensuring transparency and trust among token holders and investors."
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <LanIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Multi-Chain Support"
                  secondary="The dApp supports multiple blockchain networks, including Ethereum, BNB Smart Chain, Polygon, Arbitrum, Avalanche, and more, providing flexibility for diverse projects."
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CodeIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="User-Friendly Interface"
                  secondary="Features a step-by-step guide to simplify the process of locking tokens or liquidity, with real-time feedback and notifications for an enhanced user experience."
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <AccessTimeIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Unlock Flexibility and Transparency"
                  secondary="View and manage locked assets directly from the dashboard. Tokens can only be withdrawn after the predefined unlock period, reinforcing trust and accountability."
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <WalletIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Seamless Wallet Integration"
                  secondary="Supports leading wallets like MetaMask and Coinbase Wallet, ensuring secure and effortless connectivity to your wallet for managing assets."
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* How it Works */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              How It Works
            </Typography>
            <Divider sx={{ my: 2 }}/>
            <List>
              <ListItem>
                <ListItemText primary="1. Connect your wallet: Use a supported wallet like MetaMask to connect to the dApp." />
              </ListItem>
              <ListItem>
                <ListItemText primary="2. Select your network: Choose from supported blockchains such as Ethereum, BNB Smart Chain, or Arbitrum." />
              </ListItem>
              <ListItem>
                <ListItemText primary="3. Lock tokens: Enter the token address, amount, and lock duration to secure your tokens." />
              </ListItem>
              <ListItem>
                <ListItemText primary="4. Approve and confirm: Approve the transaction in your wallet and confirm the locking process." />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Supported Networks */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: { xs: 2, sm: 3 }, 
              height: '100%', // Ensure the Paper takes full height
              display: 'flex', // Flexbox for alignment
              flexDirection: 'column',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Supported Networks
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box 
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between', // Space out elements
                alignItems: 'center', // Center horizontally
                height: '100%', // Ensure the Box takes full height
                overflow: 'hidden', // Prevent content overflow
                textAlign: 'center', // Center-align the text in Typography
              }}
            >
              <Typography>
                CapsuleGuard is compatible with a wide range of blockchain networks, ensuring flexibility and accessibility
                for your token and liquidity management needs.
                <br />
                <br />
                Explore our support for popular networks like Ethereum, BNB
                Smart Chain, Polygon, and more.
              </Typography>
              <Box 
                sx={{ 
                  mt: 'auto', // Push to the bottom
                  width: '100%', 
                  display: 'flex', 
                  justifyContent: 'center', 
                }}
              >
                <Slider
                  width="150px"
                  duration={30}
                  pauseOnHover={true}
                  blurBorders={false}
                >
                  <Slider.Slide>
                    <img src={EthLogo} width="80px" alt="Ethereum" />
                  </Slider.Slide>
                  <Slider.Slide>
                    <img src={BNBLogo} width="80px" alt="BNB" />
                  </Slider.Slide>
                  <Slider.Slide>
                    <img src={ArbLogo} width="80px" alt="Arbitrum" />
                  </Slider.Slide>
                  <Slider.Slide>
                    <img src={OpLogo} width="80px" alt="Optimism" />
                  </Slider.Slide>
                  <Slider.Slide>
                    <img src={CronosLogo} width="80px" alt="Cronos" />
                  </Slider.Slide>
                  <Slider.Slide>
                    <img src={PolLogo} width="80px" alt="Polygon" />
                  </Slider.Slide>
                  <Slider.Slide>
                    <img src={AvaxLogo} width="80px" alt="Avalanche" />
                  </Slider.Slide>
                  <Slider.Slide>
                    <img src={coinbaseLogo} width="80px" alt="Base" />
                  </Slider.Slide>
                  <Slider.Slide>
                    <img src={lineaLogo} width="80px" alt="Linea" />
                  </Slider.Slide>
                </Slider>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Technologies Used */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Technologies Behind CapsuleGuard
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography>
              CapsuleGuard utilizes advanced blockchain and web technologies to deliver a secure and seamless experience:
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Secure blockchain integration for trust and transparency" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CodeIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="User-friendly interface powered by React and Material-UI" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <InfoIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Wallet compatibility with MetaMask, Coinbase Wallet, and more" />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Use Cases */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Use Cases
            </Typography>
            <Divider sx={{ my: 2 }}/>
            <List>
              <ListItem>
                <ListItemText primary="1. Token Vesting: Projects can lock tokens for team members or advisors to ensure long-term commitment." />
              </ListItem>
              <ListItem>
                <ListItemText primary="2. Liquidity Locking: Secure liquidity for decentralized exchanges (DEXs) to build trust among investors." />
              </ListItem>
              <ListItem>
                <ListItemText primary="3. Crowdfunding: Lock funds raised during token sales to provide security to contributors." />
              </ListItem>
              <ListItem>
                <ListItemText primary="4. Community Rewards: Lock tokens for future community rewards or incentives." />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Frequently Asked Questions (FAQs) */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Frequently Asked Questions (FAQs)
            </Typography>
            <Divider sx={{ my: 2 }}/>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center', // Center vertically
                alignItems: 'center', // Center horizontally
                height: '100%', // Ensure it stretches to fill the parent container's height
              }}
            >
              {/* Accordion 1 */}
              <Accordion>
                <AccordionSummary expandIcon={<InfoIcon color="primary" />} aria-controls="faq1-content" id="faq1-header">
                  <Typography>How do I lock tokens?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>
                    Simply connect your wallet, select your network, and follow the step-by-step instructions to lock your tokens.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              {/* Accordion 2 */}
              <Accordion>
                <AccordionSummary expandIcon={<InfoIcon color="primary" />} aria-controls="faq2-content" id="faq2-header">
                  <Typography>Is CapsuleGuard secure?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>
                    Yes, CapsuleGuard uses audited smart contracts and follows best practices to ensure the safety of your assets.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              {/* Accordion 3 */}
              <Accordion>
                <AccordionSummary expandIcon={<InfoIcon color="primary" />} aria-controls="faq3-content" id="faq3-header">
                  <Typography>Which blockchains are supported?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>
                    We support Ethereum, BNB Smart Chain, Polygon, Arbitrum, and more, with additional networks coming soon.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              {/* Accordion 4 */}
              <Accordion>
                <AccordionSummary expandIcon={<InfoIcon color="primary" />} aria-controls="faq4-content" id="faq4-header">
                  <Typography>Can I unlock tokens early?</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>
                    No, once tokens are locked, they can only be accessed after the set duration to ensure trust and transparency.
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </Box>
          </Paper>
        </Grid>

        {/* Success Stories */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Success Stories
            </Typography>
            <Divider sx={{ my: 2 }}/>
            <Typography>
              <strong>TCA Tokens:</strong> The liquidity pool for TCA Tokens is successfully locked, providing investors with confidence and ensuring long-term stability for the project.
            </Typography>
            <Typography sx={{ mt: 2 }}>
              With CapsuleGuard, TCA Tokens secured their liquidity in a seamless and transparent manner, gaining trust among their community and partners.
            </Typography>
          </Paper>
        </Grid>

        {/* Additional Info */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Additional Information
            </Typography>
            <Divider sx={{ my: 2 }}/>
            <Typography>
              CapsuleGuard supports a wide range of tokens and chains, making it a versatile tool for developers, project
              owners, and investors. Our platform is continuously evolving to include new features and enhance security.
            </Typography>
            <Typography sx={{ mt: 2 }}>
              For any questions or support, please visit our{' '}
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://discord.com/channels/1231742452453478400/1231744999419281438"
                style={{ color: '#9e03f2', textDecoration: 'none' }}
              >
                Support Page
              </a>
              .
            </Typography>
          </Paper>
        </Grid>

        {/* Call to Action */}
        <Grid item xs={12} sx={{ mb: 4 }}>
          <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center', height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Ready to Lock?
            </Typography>
            <Divider sx={{ my: 2 }}/>
            <Typography sx={{ mb: 2 }}>
              Secure your tokens and liquidity today with CapsuleGuard!
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <button
                style={{
                  padding: '10px 20px',
                  backgroundColor: theme.palette.primary.dark,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
                onClick={() => navigate("/locker")}
                >
                Get Started Now
              </button>
              <Divider orientation="vertical" flexItem />
              <WalletConnectButton />
              <Divider orientation="vertical" flexItem />
              <button
                style={{
                  padding: '10px 20px',
                  backgroundColor: theme.palette.common.black,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
                onClick={() =>
                  window.location.href =
                    "https://pancakeswap.finance/swap?outputCurrency=0x31aab810b51f499340fc1e1b08716d2bc92c7a56&chainId=56"
                }
              >
                Buy TCA
              </button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default LearnMore;
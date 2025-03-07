import React from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Container,
} from '@mui/material';
import { useContext } from "react";
import { useWallet } from '@solana/wallet-adapter-react';
import { RouterContext } from "../App";
import ParticleAnimation from "../components/AnimatedBackground";

import { styled } from '@mui/system';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import GClogo from '../assets/images/logos/CapsuleGuard.svg';

const HeroContainer = styled(Box)(({ theme }) => ({
  background: theme.palette.background.default,
  color: theme.palette.common.white,
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
}));

const HeroContent = styled(Container)(() => ({
  zIndex: 1,
  textAlign: 'center',
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'column',
}));

const CapsuleGuardHero: React.FC = () => {
  const { navigate } = useContext(RouterContext);
  const { connected } = useWallet();

  return (
    <HeroContainer>
      {/* Animated Background */}
      <ParticleAnimation />

      {/* Main Content */}
      <HeroContent maxWidth="md">
        <Typography variant="h1" color="text.primary" sx={{ width: '40%', fontSize: '50px' }} gutterBottom>
          Welcome to <strong>Capsule Guard</strong>
        </Typography>
        <Box sx={{ width: '50%', height: 'auto', mb: '10px' }}>
          <img
            src={GClogo}
            alt="CapsuleGuard"
            style={{ width: '100%', height: 'auto' }}
          />
        </Box>
        <Typography variant="h6" sx={{ width: '50%' }} color="secondary.light" paragraph>
          Your ultimate solution for blockchain security and asset protection.
          Built for the future, secured for peace of mind.
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
          mt={3}
        >
          <Button
            variant="contained"
            size="large"
            color="primary"
            startIcon={<HealthAndSafetyIcon />}
            onClick={() => connected ? navigate("/sollocker") : navigate("/locker")}
          >
            Get Started
          </Button>
          <Button
            variant="outlined"
            size="large"
            color="secondary"
            startIcon={<RocketLaunchIcon />}
            onClick={() => navigate("/LearnMore")}
          >
            Learn More
          </Button>
        </Stack>
      </HeroContent>
    </HeroContainer>
  );
};

export default CapsuleGuardHero;

import React from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Container,
} from '@mui/material';
import { useContext } from "react";
import { RouterContext } from "../App";
import ParticleAnimation from "../components/AnimatedBackground";

import { styled, keyframes } from '@mui/system';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import LockClockIcon from '@mui/icons-material/LockClock';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import VpnLockIcon from '@mui/icons-material/VpnLock';
import EnhancedEncryptionIcon from '@mui/icons-material/EnhancedEncryption';
import SafetyCheckIcon from '@mui/icons-material/SafetyCheck';
import MailLockIcon from '@mui/icons-material/MailLock';
import GClogo from '../assets/images/logos/CapsuleGuard.svg';

// Flying Animation
const floatAnimation = keyframes`
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0);
  }
`;

const FloatingIcon = styled(Box)(({ theme }) => ({
  animation: `${floatAnimation} 2s infinite ease-in-out`,
  fontSize: '5rem',
  color: theme.palette.primary.main,
  position: 'absolute', // Ensure absolute positioning
}));

const HeroContainer = styled(Box)(({ theme }) => ({
  background: '#1c1c1c',
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

const FlyingIcons = styled(Box)(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%', // Ensure the icons have space to float
  pointerEvents: 'none',
}));

const CapsuleGuardHero: React.FC = () => {
  const { navigate } = useContext(RouterContext);

  return (
    <HeroContainer>
      {/* Animated Background */}
      <ParticleAnimation />

      {/* Flying Icons */}
      <FlyingIcons>
        <FloatingIcon style={{ left: '15%', top: '75%' }}>
          <LockClockIcon fontSize="inherit" />
        </FloatingIcon>
        <FloatingIcon style={{ left: '45%', top: '15%' }}>
          <SafetyCheckIcon fontSize="inherit" />
        </FloatingIcon>
        <FloatingIcon style={{ left: '80%', top: '75%' }}>
          <VpnLockIcon fontSize="inherit" />
        </FloatingIcon>
        <FloatingIcon style={{ left: '80%', top: '45%' }}>
          <EnhancedEncryptionIcon fontSize="inherit" />
        </FloatingIcon>
        <FloatingIcon style={{ left: '10%', top: '45%' }}>
          <MailLockIcon fontSize="inherit" />
        </FloatingIcon>
      </FlyingIcons>

      {/* Main Content */}
      <HeroContent maxWidth="md">
        <Typography variant="h1" color="text.primary" gutterBottom>
          Welcome to <strong>Capsule Guard</strong>
        </Typography>
        <Box sx={{ width: '50%', height: 'auto', mb: '10px' }}>
          <img
            src={GClogo}
            alt="CapsuleGuard"
            style={{ width: '100%', height: 'auto' }}
          />
        </Box>
        <Typography variant="h6" color="secondary.light" paragraph>
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
            onClick={() => navigate("/locker")}
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

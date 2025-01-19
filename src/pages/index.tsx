import React from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Container,
} from '@mui/material';
import { styled, keyframes } from '@mui/system';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import ShieldIcon from '@mui/icons-material/Shield';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';

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
}));

const HeroContainer = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgb(179 51 244 / 15%), rgb(112 0 169 / 15%))',
  color: theme.palette.common.white,
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
}));

const AnimatedBackground = styled(Box)(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0) 70%)',
  zIndex: 0,
  pointerEvents: 'none',
}));

const HeroContent = styled(Container)(() => ({
  zIndex: 1,
  textAlign: 'center',
}));

const FlyingIcons = styled(Box)(() => ({
  position: 'absolute',
  display: 'flex',
  justifyContent: 'space-around',
  width: '100%',
  pointerEvents: 'none',
}));

const CapsuleGuardHero: React.FC = () => {
  return (
    <HeroContainer>
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Flying Icons */}
      <FlyingIcons>
        <FloatingIcon style={{ left: '10%', top: '20%' }}>
          <RocketLaunchIcon fontSize="inherit" />
        </FloatingIcon>
        <FloatingIcon style={{ left: '50%', top: '30%' }}>
          <ShieldIcon fontSize="inherit" />
        </FloatingIcon>
        <FloatingIcon style={{ left: '80%', top: '15%' }}>
          <CloudQueueIcon fontSize="inherit" />
        </FloatingIcon>
      </FlyingIcons>

      {/* Main Content */}
      <HeroContent maxWidth="md">
        <Typography variant="h2" color="primary.main" gutterBottom>
          Welcome to <strong>Capsule Guard</strong>
        </Typography>
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
            startIcon={<ShieldIcon />}
          >
            Get Started
          </Button>
          <Button
            variant="outlined"
            size="large"
            color="secondary"
            startIcon={<RocketLaunchIcon />}
          >
            Learn More
          </Button>
        </Stack>
      </HeroContent>
    </HeroContainer>
  );
};

export default CapsuleGuardHero;

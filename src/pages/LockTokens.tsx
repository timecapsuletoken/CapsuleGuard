import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Stack,
  Container,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import LockIcon from '@mui/icons-material/Lock';
import dayjs, { Dayjs } from 'dayjs';
import { keyframes, styled } from '@mui/system';
import ShieldIcon from '@mui/icons-material/Shield';
import StarIcon from '@mui/icons-material/Star';

// Animation for floating icons
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
  animation: `${floatAnimation} 3s infinite ease-in-out`,
  fontSize: '4rem',
  color: theme.palette.primary.main,
  position: 'absolute',
}));

const AnimatedBackground = styled(Box)(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: `radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0) 70%)`,
  zIndex: -1,
}));

const LockTokenPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [lockDetails, setLockDetails] = useState<{
    tokenAddress: string;
    amount: string;
    lockDate: Dayjs | null;
  }>({
    tokenAddress: '',
    amount: '',
    lockDate: dayjs(), // Set initial date to the current day
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setLockDetails({ ...lockDetails, [e.target.name]: e.target.value });
  };

  const handleLock = () => {
    if (!lockDetails.tokenAddress || !lockDetails.amount || !lockDetails.lockDate) {
      alert('Please fill out all fields before proceeding.');
      return;
    }

    console.log('Locking Details:', lockDetails);
    alert('Token or Liquidity locked successfully!');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="md" sx={{ mt: 5, position: 'relative' }}>
        <AnimatedBackground />

        {/* Floating Icons */}
        <FloatingIcon sx={{ top: '10%', left: '5%' }}>
          <ShieldIcon fontSize="inherit" />
        </FloatingIcon>
        <FloatingIcon sx={{ top: '20%', right: '10%' }}>
          <StarIcon fontSize="inherit" />
        </FloatingIcon>
        <FloatingIcon sx={{ bottom: '-20%', left: '-30%' }}>
          <RocketLaunchIcon fontSize="inherit" />
        </FloatingIcon>

        <Typography variant="h4" align="center" gutterBottom>
          Lock Token or Liquidity
        </Typography>

        <Box>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            centered
            sx={{ marginBottom: 3 }}
          >
            <Tab label="Lock Token/Liquidity" icon={<LockIcon />} iconPosition="start" />
            <Tab label="View Locked" icon={<RocketLaunchIcon />} iconPosition="start" />
          </Tabs>

          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Lock Your Token or Liquidity
              </Typography>

              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Token or Liquidity Address"
                  name="tokenAddress"
                  value={lockDetails.tokenAddress}
                  onChange={handleInputChange}
                />

                <TextField
                  fullWidth
                  label="Amount to Lock"
                  name="amount"
                  type="number"
                  value={lockDetails.amount}
                  onChange={handleInputChange}
                />

                <DatePicker
                  label="Lock Until"
                  value={lockDetails.lockDate}
                  onChange={(newDate) =>
                    setLockDetails({ ...lockDetails, lockDate: newDate })
                  }
                  slotProps={{ textField: { fullWidth: true } }}
                />

                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleLock}
                >
                  Lock Now
                </Button>
              </Stack>
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Your Locked Tokens and Liquidity
              </Typography>
              <Typography>
                {/* Placeholder content - Replace with actual data fetching */}
                No locked tokens or liquidity found.
              </Typography>
            </Box>
          )}
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default LockTokenPage;

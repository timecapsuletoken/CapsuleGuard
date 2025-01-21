import { Eip1193Provider, ethers, parseUnits } from "ethers"; 
import React, { useState } from 'react';
import { CONTRACT_ADDRESS } from "../config";
import {
  Box,
  Typography,
  MobileStepper,
  Paper,
  TextField,
  Button,
  Container,
  CircularProgress,
} from '@mui/material';
import { useTheme } from "@mui/material/styles";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
//import LockIcon from '@mui/icons-material/Lock';
import dayjs, { Dayjs } from 'dayjs';
import { motion } from "framer-motion";
import { useNotifications } from '@toolpad/core/useNotifications';

import EthLogo from '../assets/images/walletproviders/ethereum.png';
import ArbLogo from '../assets/images/walletproviders/arbitrum.png';
import BNBLogo from '../assets/images/walletproviders/bnb.png';
import OpLogo from '../assets/images/walletproviders/optimism.png';
import PolLogo from '../assets/images/walletproviders/polygon.png';
import AvaxLogo from '../assets/images/walletproviders/Avax.png';
import coinbaseLogo from '../assets/images/walletproviders/coinbase.png';
import lineaLogo from '../assets/images/walletproviders/linea.png';
import CronosLogo from '../assets/images/walletproviders/cronos.png';

const steps = [
  { label: "Add Token or Liquidity Address" },
  { label: "Add Amount to Lock" },
  { label: "Select Unlock Date & Time" },
  { label: "Approve Token" },
  { label: "Lock Tokens" },
  { label: "Success!" },
];

interface LockDetails {
  tokenAddress: string;
  amount: string;
  lockDate: Dayjs | null;
}

const LockTokenPage: React.FC = () => {
  const theme = useTheme();
  const notifications = useNotifications();
  const now = dayjs(); // Current date as a Dayjs object
  const [activeStep, setActiveStep] = useState(0);
  const maxSteps = steps.length;
  const [approving, setApproving] = useState(false);
  const [locking, setLocking] = useState(false);
  const [lockDetails, setLockDetails] = useState<LockDetails>({
    tokenAddress: '',
    amount: '',
    lockDate: dayjs(), // Set initial date to the current day
  });  

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setLockDetails({ ...lockDetails, [e.target.name]: e.target.value });
  };

  const handleNext = async () => {

    // Declare and sanitize the inputs at the start of the function
    const sanitizedInputs: LockDetails = {
      tokenAddress: lockDetails.tokenAddress.trim(),
      amount: lockDetails.amount.trim(),
      lockDate: lockDetails.lockDate,
    };
  
    if (activeStep === 0 && (!lockDetails.tokenAddress || lockDetails.tokenAddress.trim() === '') || !ethers.isAddress(lockDetails.tokenAddress.trim()) || !sanitizedInputs) {
      notifications.show('Please provide a valid Token or Liquidity Address', {
        severity: 'warning',
        autoHideDuration: 3000,
      });
      return; // Stop progression to the next step
    }

    if (activeStep === 1 && (!lockDetails.amount || lockDetails.amount.trim() === '') || !sanitizedInputs) {
      notifications.show('Please provide a valid Amount', {
        severity: 'warning',
        autoHideDuration: 3000,
      });
      return; // Stop progression to the next step
    }

    if (activeStep === 2 && (!lockDetails.lockDate || lockDetails.lockDate.isBefore(now, 'day') || !lockDetails.lockDate.isAfter(now)) || !sanitizedInputs) {
      notifications.show('The lock date must be in the future', {
        severity: 'warning',
        autoHideDuration: 3000,
      });
      return; // Stop progression to the next step
    }
  
    if (activeStep === 3) {
      await handleApprove();
    } else if (activeStep === 4) {
      await handleLock();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleApprove = async () => {
    if (!lockDetails.tokenAddress || !lockDetails.amount) {
      notifications.show('Please complete all required fields!', {
        severity: 'warning',
        autoHideDuration: 3000,
      });
      return;
    }
    try {
      setApproving(true);
      const provider = new ethers.BrowserProvider(
        window.ethereum as unknown as Eip1193Provider
      );
      const signer = await provider.getSigner();
      const tokenABI = [
        "function approve(address spender, uint256 amount) external returns (bool)",
      ];
      const tokenContract = new ethers.Contract(
        lockDetails.tokenAddress,
        tokenABI,
        signer
      );
      const amountToApprove = parseUnits(lockDetails.amount, 18);
      const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, amountToApprove);
      await approveTx.wait();
      alert("Tokens approved successfully!");
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    } catch (error) {
      console.error("Error approving tokens:", error);
      alert("Failed to approve tokens.");
    } finally {
      setApproving(false);
    }
  };

  const handleLock = async () => {

    if (!lockDetails.tokenAddress || lockDetails.tokenAddress.trim() === '') {
      notifications.show('Please provide a valid Token or Liquidity Address!', {
        autoHideDuration: 3000,
      });
    }

    if (!lockDetails.tokenAddress || !lockDetails.amount || !lockDetails.lockDate) {
      notifications.show('Please complete all required fields!', {
        severity: 'warning',
        autoHideDuration: 3000,
      });
      return;
    }
    try {
      setLocking(true);
      const unlockTime = Math.floor(lockDetails.lockDate.valueOf() / 1000);
      const provider = new ethers.BrowserProvider(
        window.ethereum as unknown as Eip1193Provider
      );
      const signer = await provider.getSigner();
      const contractABI = [
        "function lockTokens(address tokenAddress, uint256 amount, uint256 unlockTime) external",
      ];
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
      const amountToLock = parseUnits(lockDetails.amount, 18);
      const lockTx = await contract.lockTokens(
        lockDetails.tokenAddress,
        amountToLock,
        unlockTime
      );
      await lockTx.wait();
      alert("Tokens locked successfully!");
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    } catch (error) {
      console.error("Error locking tokens:", error);
      alert("Failed to lock tokens.");
    } finally {
      setLocking(false);
    }
  };

  const floatingVariants = {
    float: {
      y: [5, -40, 0], // Moves up and down
      rotate: [0, 180, 360], // Smoothly rotates
      transition: {
        duration: 10, // Slower animation
        repeat: Infinity, // Loops forever
        ease: "easeInOut",
      },
    },
  };
  
  const wiggleVariants = {
    wiggle: {
      x: [0, 5, -5, 0], // Wiggles side-to-side
      y: [0, -5, 5, 0], // Wiggles up and down
      transition: {
        duration: 6, // Slower wiggle animation
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };
  
  const floatingShapes = [
    { src: EthLogo, alt: "Shape 1", top: "5%", left: "10%" },
    { src: BNBLogo, alt: "Shape 2", top: "20%", left: "55%" },
    { src: ArbLogo, alt: "Shape 3", top: "15%", left: "30%" },
    { src: CronosLogo, alt: "Shape 4", top: "50%", left: "15%" },
    { src: OpLogo, alt: "Shape 5", top: "8%", left: "85%" },
    { src: lineaLogo, alt: "Shape 5", top: "85%", left: "85%" },
    { src: PolLogo, alt: "Shape 5", top: "50%", left: "70%" },
    { src: AvaxLogo, alt: "Shape 5", top: "70%", left: "40%" },
    { src: coinbaseLogo, alt: "Shape 5", top: "85%", left: "5%" },
  ];  
  
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container sx={{ 
          margin: '0 !important',
          padding: '0 !important', 
          maxWidth: { xs: '100%', sm: '100%', lg: '100%'  }, 
          width: '100%',
          height: '100%', 
        }}
      >
      <Box
        sx={{
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: 'column',
          height: "100%",
          backgroundColor: theme.palette.background.paper,
          zIndex: 10,
          overflow: 'hidden',
        }}
      >

          {/* Blurred Background */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1,
              background: 'rgba(255, 255, 255, 0.1)', // Adjust opacity for the blur
              backdropFilter: 'blur(4px)', // Blur effect
            }}
          />

          {/* Floating Shapes */}
          <Box>
          {floatingShapes.map((shape, index) => (
            <motion.div
              key={index}
              initial="float"
              animate="float"
              variants={floatingVariants}
              style={{
                position: "absolute",
                top: shape.top,
                left: shape.left,
                width: '5vw',
                height: 'auto',
              }}
            >
              <motion.img
                src={shape.src}
                alt={shape.alt}
                style={{ width: "100%", height: "100%" }}
                variants={wiggleVariants}
                animate="wiggle"
              />
            </motion.div>
          ))}
          </Box>

          <Box 
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'stretch',
              zIndex: 10,
            }}
          >
            <Typography variant="h4" align="center" gutterBottom>
              Lock Token or Liquidity
            </Typography>
            <Paper
              square
              elevation={0}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: '10px',
                height: 50,
                pl: 2,
                backgroundColor: theme.palette.text.secondary,
                color: theme.palette.primary.contrastText,
              }}
            >
              <Typography>{steps[activeStep].label}</Typography>
            </Paper>

            <Box sx={{ p: 3 }}>
              {activeStep === 0 && (
                <TextField
                  fullWidth
                  label="Token or Liquidity Address"
                  name="tokenAddress"
                  value={lockDetails.tokenAddress}
                  onChange={handleInputChange}
                />
              )}
              {activeStep === 1 && (
                <TextField
                  fullWidth
                  label="Amount to Lock"
                  name="amount"
                  type="number"
                  value={lockDetails.amount}
                  onChange={handleInputChange}
                />
              )}
              {activeStep === 2 && (
                <DatePicker
                  label="Lock Until"
                  value={lockDetails.lockDate}
                  onChange={(newDate) =>
                    setLockDetails({ ...lockDetails, lockDate: newDate })
                  }
                  slotProps={{ textField: { fullWidth: true } }}
                />
              )}
              {activeStep === 3 && (
                <Box sx={{ textAlign: "center", my: 2 }}>
                  {approving ? (
                    <>
                      <CircularProgress />
                      <Typography sx={{ marginTop: 2 }}>Approving tokens, please wait...</Typography>
                    </>
                  ) : (
                    <Typography>Click "Next" to approve tokens.</Typography>
                  )}
                </Box>
              )}
              {activeStep === 4 && (
                <Box sx={{ textAlign: "center", marginTop: 3 }}>
                  {locking ? (
                    <>
                      <CircularProgress />
                      <Typography sx={{ marginTop: 2 }}>Locking tokens, please wait...</Typography>
                    </>
                  ) : (
                    <Typography>Click "Next" to lock your tokens.</Typography>
                  )}
                </Box>
              )}

              {activeStep === 5 && (
                <Typography variant="h6" color="success.main">
                  Token locked successfully!
                </Typography>
              )}
            </Box>
            <MobileStepper
              variant="text"
              steps={maxSteps}
              position="static"
              activeStep={activeStep}
              sx={{
                backgroundColor: theme.palette.text.secondary,
                color: theme.palette.primary.contrastText,
                borderRadius: '10px',
              }}
              nextButton={
                <Button
                  size="small"
                  onClick={handleNext}
                  disabled={
                    activeStep === maxSteps - 1 ||
                    (activeStep === 3 && approving) ||
                    (activeStep === 4 && locking)
                  }
                  sx={{
                    color: theme.palette.primary.light, // Custom text color
                    "&:hover": {
                      color: theme.palette.primary.contrastText, // Custom text color
                    },
                    "&:disabled": {
                      backgroundColor: "#e0e0e0", // Disabled state color
                    },
                  }}                
                >
                  {activeStep === 4 ? "Lock Tokens" : "Next"}
                  {theme.direction === "rtl" ? (
                    <KeyboardArrowLeftIcon />
                  ) : (
                    <KeyboardArrowRightIcon />
                  )}
                </Button>
              }
              backButton={
                <Button
                  size="small"
                  onClick={handleBack}
                  disabled={activeStep === 0}
                >
                  {theme.direction === "rtl" ? (
                    <KeyboardArrowRightIcon />
                  ) : (
                    <KeyboardArrowLeftIcon />
                  )}
                  Back
                </Button>
              }
            />
          </Box>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default LockTokenPage;

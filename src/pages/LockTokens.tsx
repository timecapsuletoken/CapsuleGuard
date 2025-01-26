import { Eip1193Provider, ethers } from "ethers"; 
import React, { useState, useContext } from 'react';
import { RouterContext } from "../App";
import { useWallet } from "../App";
import { CONTRACT_ADDRESS } from "../config";
import { TokenFetcher, TokenDetails } from '../components/TokenFetcher'; // Ensure you import the TokenDetails type
import {
  Box,
  Typography,
  MobileStepper,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Button,
  Container,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import { useTheme } from "@mui/material/styles";
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AdsClickIcon from '@mui/icons-material/AdsClick';
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
  const { address, isConnected } = useWallet();
  const { navigate } = useContext(RouterContext);
  const notifications = useNotifications();
  const notificationShownRef = React.useRef(false); // Ref to track if notification has been shown
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
  const [open, setOpen] = useState(false);
  const [tokens, setTokens] = useState<TokenDetails[]>([]);
  const [loading, setLoading] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
    setLoading(true); // Show loading spinner until tokens are fetched
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleTokensFetched = (fetchedTokens: TokenDetails[]) => {
    setTokens(fetchedTokens);
    setLoading(false);
  };

   // Use an effect to show the notification
    React.useEffect(() => {
      const timer = setTimeout(() => {
        if (!isConnected && !notificationShownRef.current) {
          notifications.show('You must Connect a wallet first', {
            severity: 'warning',
            autoHideDuration: 3000,
          });
          notificationShownRef.current = true; 
          navigate("/dashboard");
        }
      }, 2000); // 2-second delay

      // Reset the ref when connected
      if (isConnected) {
        notificationShownRef.current = false;
        clearTimeout(timer); // Clear the timer if the wallet connects
      }

      return () => clearTimeout(timer); // Cleanup the timer on unmount
    }, [isConnected, notifications, navigate]);

    // Return early if not connected
    if (!isConnected) {
      return null; // Render nothing if not connected
    }

/*
  const USDC_ADDRESSES: { [key: number]: string } = {
    1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Ethereum
    56: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", // BNB Smart Chain
    97: "0xE06D18c81d41fF106BE2B00d322F6F3266E288Ca", // BNB Smart Chain Testnet
    137: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // Polygon
    42161: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8", // Arbitrum
    43114: "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e", // Avalanche
    10: "0x7f5c764cbc14f9669b88837ca1490cca17c31607", // Optimism
    8453: "0x5e156f7bc5b5c23eb423fcb3a509c4bd4636dfcb", // Base
    59144: "0x4e163c3113ef4563b7d262d1de9e3a4cf122fe18", // Linea
  };
*/

/*
  const fetchUsdcAddress = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as unknown as Eip1193Provider);
      const contractABI = [
        "function usdcTokenAddress() view returns (address)", // ABI to fetch the USDC address
      ];
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);

      // Fetch USDC token address
      const usdcAddress = await contract.usdcTokenAddress();
      console.log("USDC Address:", usdcAddress);
      return usdcAddress;
    } catch (error) {
      console.error("Error fetching USDC address:", error);
      throw new Error("Failed to fetch USDC address from the contract.");
    }
  };
*/

  const fetchTokenDecimals = async (tokenAddress: string): Promise<number> => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as unknown as Eip1193Provider);
      const tokenABI = ["function decimals() view returns (uint8)"];
      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);
      const decimals = Number(await tokenContract.decimals());
      console.log("Decimals:", decimals);
      return decimals;
    } catch (error) {
      console.error("Error fetching token decimals:", error);
      throw new Error("Failed to fetch token decimals.");
    }
  };

  const checkWalletBalance = async (amount: string): Promise<boolean> => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as unknown as Eip1193Provider);
      const signer = await provider.getSigner();
  
      if (!address) {
        console.error("Address is not defined");
        return false; // Return false if the wallet address is not available
      }

      if (lockDetails.tokenAddress === 'native') {
        // Check native token balance (e.g., ETH, BNB)
        const balance = await provider.getBalance(address); // Fetch balance for the connected wallet
        console.log("Native Token Balance (Wei):", balance.toString());
        const formattedBalance = ethers.formatEther(balance); // Convert Wei to Ether
        console.log("Native Token Balance (Formatted):", formattedBalance);
        const results = Number(amount) <= Number(formattedBalance);
        console.log("Check Result (Native):", results);
        return results;
      } else {
        // Check ERC20 token balance
        const tokenABI = ["function balanceOf(address owner) view returns (uint256)"];
        const tokenContract = new ethers.Contract(lockDetails.tokenAddress, tokenABI, signer);
        const balance = await tokenContract.balanceOf(address); // Balance in token's smallest unit
        console.log("ERC20 Token Balance (Raw):", balance.toString());
        const decimals = await fetchTokenDecimals(lockDetails.tokenAddress); // Fetch token decimals
        const formattedBalance = ethers.formatUnits(balance, decimals); // Convert to human-readable format
        console.log("ERC20 Token Balance (Formatted):", formattedBalance);
        const results = Number(amount) <= Number(formattedBalance);
        console.log("Check Result (ERC20):", results);
        return results;  
      }
    } catch (error) {
      console.error("Error checking wallet balance:", error);
      return false;
    }
  };
  
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
    const isBalanceSufficient = await checkWalletBalance(lockDetails.amount);
  
    if (activeStep === 0 && (
      !lockDetails.tokenAddress || 
      lockDetails.tokenAddress.trim() === '') || 
      (!ethers.isAddress(lockDetails.tokenAddress.trim()) && lockDetails.tokenAddress !== 'native') || 
      !sanitizedInputs 
    ) {
      notifications.show('Please provide a valid Token or Liquidity Address', {
        severity: 'warning',
        autoHideDuration: 3000,
      });
      return; // Stop progression to the next step
    }

    if (activeStep === 1 && (!lockDetails.amount || lockDetails.amount.trim() === '') || !sanitizedInputs || !isBalanceSufficient) {
      notifications.show('Insufficient balance OR Provide a valid Amount', {
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
    if (
      !lockDetails.tokenAddress || 
      (lockDetails.tokenAddress !== 'native' && !ethers.isAddress(lockDetails.tokenAddress.trim())) ||
      !lockDetails.amount || 
      !lockDetails.lockDate
    ) {
      notifications.show('Please complete all required fields!', {
        severity: 'warning',
        autoHideDuration: 3000,
      });
      return;
    }
  
    try {
      setApproving(true);
      const provider = new ethers.BrowserProvider(window.ethereum as unknown as Eip1193Provider);
      const signer = await provider.getSigner();
  
      // Fetch USDC token address and decimals
      const usdcABI = ["function usdcTokenAddress() view returns (address)"];
      const contract = new ethers.Contract(CONTRACT_ADDRESS, usdcABI, provider);
      const usdcAddress = await contract.usdcTokenAddress();
      const usdcDecimals = await fetchTokenDecimals(usdcAddress);
      const feeInUSDC = ethers.parseUnits("5", usdcDecimals);
  
      switch (lockDetails.tokenAddress) {
        case 'native': {
          // Handle USDC fee approval for native tokens
          const tokenABI = ["function approve(address spender, uint256 amount) external returns (bool)"];
          const usdcContract = new ethers.Contract(usdcAddress, tokenABI, signer);
        
          console.log('Approving USDC fee for native token locking...');
          const approveFeeTx = await usdcContract.approve(CONTRACT_ADDRESS, feeInUSDC);
          await approveFeeTx.wait();
        
          notifications.show('USDC fee approved successfully for native tokens.', {
            severity: 'success',
            autoHideDuration: 3000,
          });
        
          setActiveStep((prevActiveStep) => prevActiveStep + 1); // Move to the next step
          break;
        }        
  
        case usdcAddress: {
          // Combined approval for USDC lock and fees
          const tokenABI = ["function approve(address spender, uint256 amount) external returns (bool)"];
          const tokenContract = new ethers.Contract(lockDetails.tokenAddress, tokenABI, signer);
          const decimals = await fetchTokenDecimals(lockDetails.tokenAddress);
          const lockAmount = ethers.parseUnits(lockDetails.amount, decimals);
  
          const totalApproval = lockAmount + feeInUSDC;
          const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, totalApproval);
          await approveTx.wait();
  
          notifications.show('USDC lock and fees approved successfully!', {
            severity: 'success',
            autoHideDuration: 3000,
          });
          setActiveStep((prevActiveStep) => prevActiveStep + 1); // Move to the next step
          break;
        }
  
        default: {
          // Handle ERC20 token approval: Approve lock amount and USDC fees separately
          const tokenABI = ["function approve(address spender, uint256 amount) external returns (bool)"];
          const tokenContract = new ethers.Contract(lockDetails.tokenAddress, tokenABI, signer);
          const decimals = await fetchTokenDecimals(lockDetails.tokenAddress);
          const lockAmount = ethers.parseUnits(lockDetails.amount, decimals);
  
          // Approve lock amount
          const approveLockTx = await tokenContract.approve(CONTRACT_ADDRESS, lockAmount);
          await approveLockTx.wait();
  
          // Approve USDC fee
          const usdcContract = new ethers.Contract(usdcAddress, tokenABI, signer);
          const approveFeeTx = await usdcContract.approve(CONTRACT_ADDRESS, feeInUSDC);
          await approveFeeTx.wait();
  
          notifications.show('Tokens and fees approved successfully!', {
            severity: 'success',
            autoHideDuration: 3000,
          });
          setActiveStep((prevActiveStep) => prevActiveStep + 1); // Move to the next step
          break;
        }
      }
  
    } catch (error) {
      console.error("Error approving tokens or fees:", error);
      notifications.show('Failed to approve tokens or fees', {
        severity: 'error',
        autoHideDuration: 3000,
      });
    } finally {
      setApproving(false);
    }
  };  

  const handleLock = async () => {

    if (
      !lockDetails.tokenAddress || 
      (lockDetails.tokenAddress !== 'native' && lockDetails.tokenAddress.trim() === '')
    ) {
      notifications.show('Please provide a valid Token or Liquidity Address!', {
        autoHideDuration: 3000,
      });
    }

    if (
      !lockDetails.tokenAddress || 
      (lockDetails.tokenAddress !== 'native' && !ethers.isAddress(lockDetails.tokenAddress.trim())) ||
      !lockDetails.amount || 
      !lockDetails.lockDate
    ) {
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

      // Check if we are locking a native token
      if (lockDetails.tokenAddress === 'native') {
        const nativeLockABI = ["function lockNativeTokens(uint256 unlockTime) external payable"];
      
        // Lock native tokens
        const nativeLockContract = new ethers.Contract(CONTRACT_ADDRESS, nativeLockABI, signer);
        console.log("Locking native tokens:", { amount: lockDetails.amount, unlockTime });
      
        const lockTx = await nativeLockContract.lockNativeTokens(unlockTime, {
          value: ethers.parseEther(lockDetails.amount), // Convert to Wei
        });
        await lockTx.wait();
      
        notifications.show('Native tokens locked and fees collected successfully', {
          severity: 'success',
          autoHideDuration: 3000,
        });
      } else {
        // Lock ERC20 tokens
        const decimals = await fetchTokenDecimals(lockDetails.tokenAddress);

        const contractABI = [
          "function lockTokens(address tokenAddress, uint256 amount, uint256 unlockTime) external",
        ];
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
        const amountToLock = ethers.parseUnits(lockDetails.amount, decimals);

        console.log("Locking ERC20 tokens:", {
          tokenAddress: lockDetails.tokenAddress,
          amountToLock: amountToLock.toString(),
          unlockTime,
        });

        const lockTx = await contract.lockTokens(
          lockDetails.tokenAddress,
          amountToLock,
          unlockTime
        );
        await lockTx.wait();
        notifications.show('ERC20 tokens locked successfully', {
          severity: 'success',
          autoHideDuration: 3000,
        });
      }

      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    } catch (error) {
        if (error instanceof Error) {
          console.error("Error message:", error.message);
        }      
      notifications.show('Failed to lock tokens', {
        severity: 'error',
        autoHideDuration: 3000,
      });
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
                <Box>
                  <Button variant="outlined" fullWidth startIcon={<AccountBalanceWalletIcon />} onClick={handleClickOpen}>
                    My Wallet Assets
                  </Button>
                  <Dialog open={open} onClose={handleClose}>
                    <DialogTitle>Enter Token or Liquidity Address</DialogTitle>
                    <DialogContent>
                    {loading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '150px' }}>
                        <CircularProgress />
                      </Box>
                    ) : tokens.length > 0 ? (
                      <List>
                        {tokens.map((token, index) => (
                          <ListItem key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <ListItemText
                              primary={`${token.name} (${token.symbol})`}
                              secondary={
                                <Chip 
                                  label={token.address} 
                                  variant="outlined" 
                                  onDelete={() => {
                                    setLockDetails({ ...lockDetails, tokenAddress: token.address });
                                    handleClose();
                                  }}
                                  deleteIcon={<AdsClickIcon />}
                                />
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography>No assets found in your wallet.</Typography>
                    )}
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={handleClose}>Cancel</Button>
                      <Button
                        onClick={() => {
                          handleClose();
                        }}
                      >
                        Save
                      </Button>
                    </DialogActions>
                  </Dialog>
                  {open && (
                    <TokenFetcher
                      address={address as string}
                      isConnected={isConnected}
                      onTokensFetched={handleTokensFetched}
                    />
                  )}
                  <Divider sx={{ mt: 2 }}>
                    <Chip label="OR" size="small" />
                  </Divider>
                  <TextField
                    fullWidth
                    label="Token or Liquidity Address"
                    name="tokenAddress"
                    value={lockDetails.tokenAddress}
                    onChange={handleInputChange}
                    sx={{ mt: 2 }}
                  />
                </Box>
              )}
              {activeStep === 1 && (
                <TextField
                  fullWidth
                  label="Amount to Lock"
                  name="amount"
                  type="text" // Use "text" for full control
                  value={lockDetails.amount}
                  onChange={(e) => {
                    const value = e.target.value;
                
                    // Regex to allow only numbers and a single dot for decimals
                    // - Starts with digits (0-9)
                    // - Allows one optional dot (.)
                    // - No thousand separators
                    // - Handles clearing the input (empty value)
                    if (/^\d\.\d*$|^\d+$/.test(value) || value === "") {
                      handleInputChange(e); // Only call when the value matches
                    }
                  }}
                  inputProps={{
                    inputMode: "decimal", // Ensures number and decimal point keyboard on mobile
                  }}                
                />
              )}
              {activeStep === 2 && (
                <DateTimePicker
                  label="Lock Until"
                  value={lockDetails.lockDate}
                  onChange={(newDate) =>
                    setLockDetails({ ...lockDetails, lockDate: newDate })
                  }
                  slotProps={{ textField: { fullWidth: true } }}
                  minDate={dayjs()} 
                />
              )}
              {activeStep === 3 && (
                <Box sx={{ marginTop: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="primary" sx={{ mb: 2 }}>
                    Note: A $5 USDC fee will be charged before locking tokens.
                  </Typography>
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
                      <Typography sx={{ marginTop: 0 }}>Locking tokens, please wait...</Typography>
                    </>
                  ) : (
                    <Typography>Click "Next" to lock your tokens.</Typography>
                  )}
                </Box>
              )}

              {activeStep === 5 && (
                <Typography variant="h6" color="success.main" sx={{ textAlign: "center" }}>
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
                  sx={{
                    color: theme.palette.primary.light, // Custom text color
                    "&:hover": {
                      color: theme.palette.primary.contrastText, // Custom text color
                    },
                    "&:disabled": {
                      //backgroundColor: "#e0e0e0", // Disabled state color
                    },
                  }}  
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

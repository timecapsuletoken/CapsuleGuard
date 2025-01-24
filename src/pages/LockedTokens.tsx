import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "../App"; // Import wallet context
import { CONTRACT_ADDRESS } from "../config";
import {
  Box,
  Stack,
  Divider,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Link,
  Avatar,
} from "@mui/material";
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import Grid from '@mui/material/Grid2';
import { styled } from '@mui/material/styles';
import { Theme } from "../styles/theme"; // Adjust the path as necessary
import { useNotifications } from '@toolpad/core/useNotifications';

import Lottie from 'lottie-react';
import KeyIcon from '@mui/icons-material/Key';
import LinkIcon from '@mui/icons-material/Link';
import SafetyCheckIcon from '@mui/icons-material/SafetyCheck';
import animationData from '../assets/images/animations/notfound.json';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.background.default} !important`, // Add vertical divider
    '&:last-child': {
      borderRight: 'none', // Remove border from the last cell
    },
    color: theme.palette.text.primary,
    textAlign: 'center',
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
    textAlign: 'center',
    color: theme.palette.text.primary,
    borderRight: `1px solid ${theme.palette.background.paper} !important`, // Add vertical divider
    '&:last-child': {
      borderRight: 'none', // Remove border from the last cell
    },
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.background.default,
    border: `solid 1px ${theme.palette.background.paper}`,
    color: theme.palette.primary.dark,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
})); 

type LockedToken = {
  lockerAddress: string; 
  tokenAddress: string;
  lockedAmount: string;
  unlockTime: string;
  isUnlocked: boolean;
};

const LockedTokens: React.FC = () => {
  const { address, provider, explorerUrl, ChainIcon } = useWallet(); // Access wallet context
  const [lockedTokens, setLockedTokens] = useState<LockedToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState<string | null>(null); // Track the withdrawing token
  const notifications = useNotifications();

  const contractAddress = CONTRACT_ADDRESS;
  const contractABI = [
    "function getUserTokens(address user) external view returns (address[])",
    "function getLockDetails(address lockerAddress, address tokenAddress) external view returns (uint256 lockedAmount, uint256 unlockTime)",
    "function withdrawTokens(address tokenAddress) external",
  ];

  const fetchTokenDecimals = async (tokenAddress: string): Promise<number> => {
    try {
        const tokenABI = ["function decimals() view returns (uint8)"];
        const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);
        const decimals = await tokenContract.decimals();
        return decimals;
    } catch (error) {
        console.error(`Error fetching decimals for token ${tokenAddress}:`, error);
        return 18; // Default to 18 decimals if fetching fails
    }
  };

  const fetchLockedTokens = async () => {
    if (!address || !provider) {
      notifications.show("Wallet not connected or provider unavailable", {
        severity: 'info',
        autoHideDuration: 3000,
      });
      return;
    }
  
    setLoading(true);
  
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
  
      // Fetch token addresses associated with the user
      const tokenAddresses: string[] = await contract.getUserTokens(address);
  
      if (tokenAddresses.length === 0) {
        console.log("No locked tokens found for this wallet.");
        notifications.show("No locked tokens found for this wallet", {
          severity: 'info',
          autoHideDuration: 3000,
        });
        setLockedTokens([]);
        return;
      }
  
      // Fetch lock details and decimals for each token
      const promises = tokenAddresses.map(async (tokenAddress) => {
        const [lockedAmount, unlockTime] = await contract.getLockDetails(address, tokenAddress);
        const decimals = await fetchTokenDecimals(tokenAddress);
        const unlockTimeNumber = Number(unlockTime) * 1000;

        return {
            lockerAddress: contractAddress,
            tokenAddress,
            lockedAmount: ethers.formatUnits(lockedAmount, decimals), // Dynamically adjust decimals
            unlockTime: unlockTime > 0 ? new Date(Number(unlockTime) * 1000).toLocaleString() : "N/A",
            isUnlocked: Date.now() > unlockTimeNumber,
        };
      });    
  
      const results = (await Promise.all(promises)).filter(
        (token) => token.lockedAmount !== "0"
      );
      setLockedTokens(results);
    } catch (error) {
      console.error("Error fetching locked tokens:", error);
      notifications.show('Failed to fetch locked tokens', {
        severity: 'warning',
        autoHideDuration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };  

  const handleWithdraw = async (tokenAddress: string) => {
    if (!address || !provider) {
      console.log("Wallet not connected or provider unavailable");
      notifications.show("Wallet not connected or provider unavailable", {
        severity: 'info',
        autoHideDuration: 3000,
      });
      return;
    }

    try {
      setWithdrawing(tokenAddress);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await contract.withdrawTokens(tokenAddress);
      await tx.wait();

      notifications.show(`Tokens successfully withdrawn for token: ${tokenAddress}`, {
        severity: 'success',
        autoHideDuration: 3000,
      });
      fetchLockedTokens(); // Refresh data after withdrawal
    } catch (error) {
      console.error("Error withdrawing tokens:", error);
      notifications.show("Failed to withdraw tokens", {
        severity: 'error',
        autoHideDuration: 3000,
      });
    } finally {
      setWithdrawing(null);
    }
  };

  useEffect(() => {
    fetchLockedTokens();
  }, [address, provider]);

  return (
    <Box sx={{ padding: 3, width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <Box sx={{ flexShrink: 0, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Locked Tokens
          </Typography>
        </Box>

        {/* Body */}
        <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'stretch' }}>
          {loading ? (
            <Box
              className="TestCircularProgress"
              sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}
            >
              <CircularProgress />
            </Box>
          ) : lockedTokens.length === 0 || lockedTokens.every((token) => token.lockedAmount === "0" || token.lockedAmount === "0.0") ? (
            <Box sx={{ width: '100%' }}>
              <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
                <Grid display="flex" justifyContent="center" alignItems="center" size={12}>
                  <Typography sx={{ color: Theme.typography.h2 }}>No locked tokens found.</Typography>
                </Grid>
                <Divider orientation="vertical" flexItem />
                <Grid display="flex" justifyContent="center" alignItems="center" size={12}>
                  <Lottie animationData={animationData} loop={true} style={{ width: '50%' }}/>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <StyledTableRow>
                    <StyledTableCell>Network</StyledTableCell>
                    <StyledTableCell>Token Address</StyledTableCell>
                    <StyledTableCell>Locker Address</StyledTableCell>
                    <StyledTableCell>Locked Amount</StyledTableCell>
                    <StyledTableCell>Unlock Time</StyledTableCell>
                    <StyledTableCell>Actions</StyledTableCell>
                  </StyledTableRow>
                </TableHead>
                <TableBody>
                  {lockedTokens.map((token, index) => (
                    <StyledTableRow key={index}>
                      <StyledTableCell sx={{ justifyItems: 'center' }}>
                        <Avatar
                          //alt="Remy Sharp"
                          src={ChainIcon}
                          sx={{ width: 24, height: 24 }}
                        />
                      </StyledTableCell>
                      <StyledTableCell>
                        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                          <Link
                            href={`${explorerUrl}/search?q=${token.tokenAddress}`}
                            underline="none"
                            target="_blank"
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                          >
                            <LinkIcon sx={{ mr: 0.5, color: Theme.palette.primary.dark }} />
                            {`${token.tokenAddress.slice(0, 6)}...${token.tokenAddress.slice(-6)}`}
                          </Link>
                        </Stack>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                          <Link
                            href={`${explorerUrl}/search?q=${token.lockerAddress}`}
                            underline="none"
                            target="_blank"
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                          >
                            <LinkIcon sx={{ mr: 0.5, color: Theme.palette.primary.dark }} />
                            {`${token.lockerAddress.slice(0, 6)}...${token.lockerAddress.slice(-6)}`}
                          </Link>
                        </Stack>
                      </StyledTableCell>
                      <StyledTableCell>{token.lockedAmount}</StyledTableCell>
                      <StyledTableCell>{token.unlockTime}</StyledTableCell>
                      <StyledTableCell>
                        {token.isUnlocked ? (
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<KeyIcon />}
                            onClick={() => handleWithdraw(token.tokenAddress)}
                            disabled={withdrawing === token.tokenAddress}
                            loading={withdrawing === token.tokenAddress ? true : false}
                            loadingPosition="start"
                          >
                            {withdrawing === token.tokenAddress ? "Withdrawing..." : "Withdraw"}
                          </Button>
                        ) : (
                          <Button variant="outlined" startIcon={<SafetyCheckIcon />} disabled>
                            Withdraw
                          </Button>
                        )}
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* Footer 
        <Box sx={{ flexShrink: 0, textAlign: 'center', mt: 0 }}>
          <Typography variant="body2" color="textSecondary">
            Powered by CapsuleGuard
          </Typography>
        </Box>
        */}
    </Box>
  );
};

export default LockedTokens;

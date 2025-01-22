import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "../App"; // Import wallet context
import { CONTRACT_ADDRESS } from "../config";
import {
  Box,
  Divider,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
} from "@mui/material";
import Grid from '@mui/material/Grid2';
import { Theme } from "../styles/theme"; // Adjust the path as necessary
import { useNotifications } from '@toolpad/core/useNotifications';

import Lottie from 'lottie-react';
import KeyIcon from '@mui/icons-material/Key';
import SafetyCheckIcon from '@mui/icons-material/SafetyCheck';
import animationData from '../assets/images/animations/notfound.json';

type LockedToken = {
  tokenAddress: string;
  lockedAmount: string;
  unlockTime: string;
  isUnlocked: boolean;
};

const LockedTokens: React.FC = () => {
  const { address, provider } = useWallet(); // Access wallet context
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
  
      // Fetch lock details for each token
      const promises = tokenAddresses.map(async (tokenAddress) => {
        const [lockedAmount, unlockTime] = await contract.getLockDetails(address, tokenAddress);
        const unlockTimeNumber = Number(unlockTime) * 1000;

        return {
          tokenAddress,
          lockedAmount: ethers.formatUnits(lockedAmount, 18), // Adjust decimals if needed
          unlockTime: unlockTime > 0 ? new Date(Number(unlockTime) * 1000).toLocaleString() : "N/A", // Convert unlockTime to number
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
        <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
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
                  <TableRow>
                    <TableCell>Token Address</TableCell>
                    <TableCell align="right">Locked Amount</TableCell>
                    <TableCell align="right">Unlock Time</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lockedTokens.map((token, index) => (
                    <TableRow key={index}>
                      <TableCell>{token.tokenAddress}</TableCell>
                      <TableCell align="right">{token.lockedAmount}</TableCell>
                      <TableCell align="right">{token.unlockTime}</TableCell>
                      <TableCell align="right">
                        {token.isUnlocked ? (
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<KeyIcon />}
                            onClick={() => handleWithdraw(token.tokenAddress)}
                            disabled={withdrawing === token.tokenAddress}
                          >
                            {withdrawing === token.tokenAddress ? "Withdrawing..." : "Withdraw"}
                          </Button>
                        ) : (
                          <Button variant="outlined" startIcon={<SafetyCheckIcon />} disabled>
                            Withdraw
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
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

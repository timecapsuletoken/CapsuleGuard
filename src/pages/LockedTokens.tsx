import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "../App"; // Import wallet context
import { CONTRACT_ADDRESS } from "../config";
import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

type LockedToken = {
  tokenAddress: string;
  lockedAmount: string;
  unlockTime: string;
};

const LockedTokens: React.FC = () => {
  const { address, provider, chainId } = useWallet(); // Access wallet context
  const [lockedTokens, setLockedTokens] = useState<LockedToken[]>([]);
  const [loading, setLoading] = useState(false);

  const contractAddress = CONTRACT_ADDRESS;
  const contractABI = [
    "function getUserTokens(address user) external view returns (address[])",
    "function getLockDetails(address lockerAddress, address tokenAddress) external view returns (uint256 lockedAmount, uint256 unlockTime)",
  ];

  const fetchLockedTokens = async () => {
    if (!address || !provider) {
      console.log("Wallet not connected or provider unavailable");
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
        setLockedTokens([]);
        return;
      }
  
      // Fetch lock details for each token
      const promises = tokenAddresses.map(async (tokenAddress) => {
        const [lockedAmount, unlockTime] = await contract.getLockDetails(address, tokenAddress);
  
        return {
          tokenAddress,
          lockedAmount: ethers.formatUnits(lockedAmount, 18), // Adjust decimals if needed
          unlockTime: unlockTime > 0 ? new Date(Number(unlockTime) * 1000).toLocaleString() : "N/A", // Convert unlockTime to number
        };
      });
  
      const results = (await Promise.all(promises)).filter(
        (token) => token.lockedAmount !== "0"
      );
      setLockedTokens(results);
    } catch (error) {
      console.error("Error fetching locked tokens:", error);
      alert("Failed to fetch locked tokens. Check the console for details.");
    } finally {
      setLoading(false);
    }
  };  

  useEffect(() => {
    fetchLockedTokens();
  }, [address, provider]);

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Locked Tokens
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : lockedTokens.length === 0 ? (
        <Box>
          <Typography>No locked tokens found.</Typography>
          <Typography>Wallet Address: {address}</Typography>
          <Typography>ChainID: {chainId}</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Token Address</TableCell>
                <TableCell align="right">Locked Amount</TableCell>
                <TableCell align="right">Unlock Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lockedTokens.map((token, index) => (
                <TableRow key={index}>
                  <TableCell>{token.tokenAddress}</TableCell>
                  <TableCell align="right">{token.lockedAmount}</TableCell>
                  <TableCell align="right">{token.unlockTime}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default LockedTokens;

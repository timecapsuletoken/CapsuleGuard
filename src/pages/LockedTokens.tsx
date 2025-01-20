import React, { useState, useEffect } from "react";
import { useWallet } from "../App"; // Import the wallet context
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Button,
  Container,
} from "@mui/material";
import { styled, keyframes } from "@mui/system";
import { Eip1193Provider, ethers } from "ethers";
import ShieldIcon from "@mui/icons-material/Shield";
import StarIcon from "@mui/icons-material/Star";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";

// Define a type for locked tokens
type LockedToken = {
    tokenAddress: string;
    lockedAmount: string;
    unlockTime: string;
  };
    
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
  fontSize: "4rem",
  color: theme.palette.primary.main,
  position: "absolute",
}));

const AnimatedBackground = styled(Box)(() => ({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: `radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0) 70%)`,
  zIndex: -1,
}));
  
const LockedTokens: React.FC = () => {
    const { address, provider } = useWallet(); // Access wallet context
    const [lockedTokens, setLockedTokens] = useState<LockedToken[]>([]);
    const [loading, setLoading] = useState(false);

  // Contract details
  const contractAddress = "0x30aea01D73934776bcd62d7F8b2Ff31f0e0EDc7c";
  const contractABI = [
    "function getLockDetails(address lockerAddress, address tokenAddress) external view returns (uint256 lockedAmount, uint256 unlockTime)",
  ];

  useEffect(() => {
    if (address && provider) {
      fetchLockedTokens();
    }
  }, [address, provider]);

  useEffect(() => {
    fetchLockedTokens();
  }, []);

  const fetchLockedTokens = async () => {
    setLoading(true);

    try {
      if (!window.ethereum) {
        alert("MetaMask is required to fetch locked tokens.");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum as unknown as Eip1193Provider);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const userAddress = await signer.getAddress();
      const tokenAddresses = ["TOKEN_ADDRESS_1", "TOKEN_ADDRESS_2"]; // Replace with actual token addresses

      const promises = tokenAddresses.map(async (tokenAddress) => {
        const [lockedAmount, unlockTime] = await contract.getLockDetails(
          userAddress,
          tokenAddress
        );

        return {
          tokenAddress,
          lockedAmount: ethers.formatUnits(lockedAmount, 18), // Adjust decimals if needed
          unlockTime: new Date(unlockTime * 1000).toLocaleString(),
        };
      });

      const results = await Promise.all(promises);
      setLockedTokens(results);
    } catch (error) {
      console.error("Error fetching locked tokens:", error);
      alert("Failed to fetch locked tokens. Check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 5, position: "relative" }}>
      <AnimatedBackground />

      {/* Floating Icons */}
      <FloatingIcon sx={{ top: "10%", left: "5%" }}>
        <ShieldIcon fontSize="inherit" />
      </FloatingIcon>
      <FloatingIcon sx={{ top: "20%", right: "10%" }}>
        <StarIcon fontSize="inherit" />
      </FloatingIcon>
      <FloatingIcon sx={{ bottom: "-20%", left: "-30%" }}>
        <RocketLaunchIcon fontSize="inherit" />
      </FloatingIcon>

      <Typography variant="h4" align="center" gutterBottom>
        Your Locked Tokens and Liquidity
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" mt={3}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Token Address</TableCell>
                <TableCell align="right">Locked Amount</TableCell>
                <TableCell align="right">Unlock Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lockedTokens.length > 0 ? (
                lockedTokens.map((token, index) => (
                  <TableRow key={index}>
                    <TableCell>{token.tokenAddress}</TableCell>
                    <TableCell align="right">{token.lockedAmount}</TableCell>
                    <TableCell align="right">{token.unlockTime}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    No locked tokens found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box display="flex" justifyContent="center" mt={3}>
        <Button
          variant="contained"
          color="primary"
          onClick={fetchLockedTokens}
          disabled={loading}
        >
          Refresh Data
        </Button>
      </Box>
    </Container>
  );
};

export default LockedTokens;

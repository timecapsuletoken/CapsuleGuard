import React from "react";
import { Box, Button } from "@mui/material";
import DiscordIcon from "../assets/images/logos/discord.svg"; // Replace with your Discord icon path

const DiscordSupportButton: React.FC = () => {
  const handleRedirect = () => {
    window.open("https://discord.gg/YOUR_SERVER_INVITE", "_blank");
  };

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 16, // Adjust for spacing
        right: 16, // Adjust for spacing
        zIndex: 1000, // Ensure it stays on top
      }}
    >
      <Button
        onClick={handleRedirect}
        variant="contained"
        startIcon={
          <img
            src={DiscordIcon}
            alt="Discord"
            style={{ width: "24px", height: "24px" }}
          />
        }
        sx={{
          backgroundColor: "#5865F2", // Discord blue
          color: "#FFFFFF",
          textTransform: "none",
          fontWeight: "bold",
          "&:hover": {
            backgroundColor: "#4752C4", // Slightly darker blue on hover
          },
        }}
      >
        Support
      </Button>
    </Box>
  );
};

export default DiscordSupportButton;
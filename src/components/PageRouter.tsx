import React from "react";
import { Typography } from "@mui/material";
import DashboardPage from "../pages/index";
import LockTokens from "../pages/LockTokens";
import LockedTokens from "../pages/LockedTokens";
import LearnMore from "../pages/LearnMore";

interface DemoPageContentProps {
  pathname: string;
}

const DemoPageContent: React.FC<DemoPageContentProps> = ({ pathname }) => {
  console.log("Current pathname:", pathname); // Debugging log
  if (pathname === "/dashboard" || pathname === "/") return <DashboardPage />;
  if (pathname === "/locker") return <LockTokens />;
  if (pathname === "/locked") return <LockedTokens />;
  if (pathname === "/LearnMore") return <LearnMore />;
  if (pathname === "/Support") {
    window.location.href = "https://discord.com/channels/1231742452453478400/1231744999419281438";
    return null; 
  }
  
  return <Typography>404 - Page Not Found</Typography>;
};

export default DemoPageContent;

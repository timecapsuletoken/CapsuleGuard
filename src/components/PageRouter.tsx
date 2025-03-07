import React from "react";
import DashboardPage from "../pages/index";
import LockTokens from "../pages/LockTokens";
import LockSolTokens from "../pages/LockSolTokens";
import LockedTokens from "../pages/LockedTokens";
import LockedSolTokens from "../pages/LockedSolTokens";
import LearnMore from "../pages/LearnMore";
import HowToUse from "../pages/HowToUse";
import SolanaTest from "../pages/SolanaTest";
import InitializeContract from "../pages/InitializeContract";
import AdminDashboard from "../pages/AdminDashboard";

interface DemoPageContentProps {
  pathname: string;
}

const DemoPageContent: React.FC<DemoPageContentProps> = ({ pathname }) => {

  if (pathname === "/dashboard" || pathname === "/") return <DashboardPage />;
  if (pathname === "/locker") return <LockTokens />;
  if (pathname === "/sollocker") {
    // Now we use the dedicated LockSolTokens component for Solana
    return <LockSolTokens />;
  }
  if (pathname === "/locked") return <LockedTokens />;
  if (pathname === "/lockedsol") return <LockedSolTokens />;
  if (pathname === "/LearnMore") return <LearnMore />;
  if (pathname === "/Support") {
    window.location.href = "https://discord.com/channels/1231742452453478400/1231744999419281438";
    return null; 
  }
  if (pathname === "/HowToUse") return <HowToUse />;
  if (pathname === "/solana-test") return <SolanaTest />;
  if (pathname === "/admin/initialize") return <InitializeContract />;
  if (pathname === "/admin/dashboard") return <AdminDashboard />;
  
  window.location.href = "/dashboard";
  return null;

};

export default DemoPageContent;

import * as React from 'react';
import { ethers } from "ethers";
import { Box, Stack, Avatar, Typography, Chip, Link } from '@mui/material';
import { Theme } from "./styles/theme"; 
import { Dashboard as DashboardIcon, LockClock as LockClockIcon, LockOpen as LockOpenIcon, Help as HelpIcon, PsychologyAlt as PsychologyAltIcon } from '@mui/icons-material';
import CGLogo from './assets/images/logos/logo.png';
import { FaDiscord } from "react-icons/fa";
import { AppProvider, type Navigation } from '@toolpad/core/AppProvider';
import { DashboardLayout, ThemeSwitcher, type SidebarFooterProps } from '@toolpad/core/DashboardLayout';
import PageRouter from './components/PageRouter';
import { useDemoRouter } from '@toolpad/core/internal';
import { createWeb3Modal, defaultConfig, useWeb3ModalAccount, useWeb3ModalProvider  } from 'web3modal-web3js/react';
import { PROJECT_ID } from "./config";

import EthLogo from './assets/images/walletproviders/ethereum.png';
import ArbLogo from './assets/images/walletproviders/arbitrum.png';
import BNBLogo from './assets/images/walletproviders/bnb.png';
import OpLogo from './assets/images/walletproviders/optimism.png';
import PolLogo from './assets/images/walletproviders/polygon.png';
import AvaxLogo from './assets/images/walletproviders/Avax.png';
import coinbaseLogo from './assets/images/walletproviders/coinbase.png';
import lineaLogo from './assets/images/walletproviders/linea.png';
import CronosLogo from './assets/images/walletproviders/cronos.png';

const NAVIGATION: Navigation = [
  {
    segment: 'dashboard',
    title: 'Dashboard',
    icon: <DashboardIcon />,
  },
  {
    kind: 'divider',
  },
  {
    segment: 'locker',
    title: 'Locker',
    icon: <LockClockIcon />,
  },
  {
    kind: 'divider',
  },
  {
    segment: 'locked',
    title: 'Locked Tokens',
    icon: <LockOpenIcon />,
  },
  {
    kind: 'divider',
  },
  {
    segment: 'HowToUse',
    title: 'How To Use',
    icon: <PsychologyAltIcon />,
  },
  {
    kind: 'divider',
  },
  {
    segment: 'LearnMore',
    title: 'Learn More',
    icon: <HelpIcon />,
  },
  {
    kind: 'divider',
  },
  {
    segment: "Support",
    title: "Support",
    icon: <FaDiscord style={{ fontSize: "24px", color: "inherit" }} />, 
  },
];

// Web3Modal Configuration
const projectId = PROJECT_ID || "";
const chains = [
  {
    chainId: 1,
    name: 'Ethereum',
    currency: 'ETH',
    ChainIcon: EthLogo,
    explorerUrl: 'https://etherscan.io',
    rpcUrl: 'https://cloudflare-eth.com',
  },
  {
    chainId: 56,
    name: 'BNB Smart Chain',
    currency: 'BNB',
    ChainIcon: BNBLogo,
    explorerUrl: 'https://bscscan.com',
    rpcUrl: 'https://bsc-dataseed.bnbchain.org/',
  },
  {
    chainId: 97,
    name: 'BNB Smart Chain Testnet',
    currency: 'tBNB',
    ChainIcon: BNBLogo,
    explorerUrl: 'https://testnet.bscscan.com',
    rpcUrl: 'https://bsc-testnet.bnbchain.org/',
  },
  {
    chainId: 42161, 
    name: 'Arbitrum',
    currency: 'ETH',
    ChainIcon: ArbLogo,
    explorerUrl: 'https://arbiscan.io',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
  },
  {
    chainId: 421614, 
    name: 'Arbitrum Sepolia Mainnet',
    currency: 'ETH',
    ChainIcon: ArbLogo,
    explorerUrl: 'https://sepolia.arbiscan.io',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
  },
  {
    chainId: 25,
    name: 'Cronos',
    currency: 'CRO',
    ChainIcon: CronosLogo,
    explorerUrl: 'https://cronoscan.com',
    rpcUrl: 'https://evm-cronos.crypto.org',
  },
  {
    chainId: 338,
    name: 'Cronos Testnet',
    currency: 'TCRO',
    ChainIcon: CronosLogo,
    explorerUrl: 'https://explorer.cronos.org/testnet',
    rpcUrl: 'https://evm-t3.cronos.org',
  },
  {
    chainId: 10,
    name: 'Optimism',
    currency: 'ETH',
    ChainIcon: OpLogo,
    explorerUrl: 'https://optimistic.etherscan.io',
    rpcUrl: 'https://mainnet.optimism.io',
  },
  {
    chainId: 11155420,
    name: 'OP Sepolia Testnet',
    currency: 'ETH',
    ChainIcon: OpLogo,
    explorerUrl: 'https://sepolia-optimism.etherscan.io',
    rpcUrl: 'https://sepolia.optimism.io',
  },
  {
    chainId: 137,
    name: 'Polygon',
    currency: 'MATIC',
    ChainIcon: PolLogo,
    explorerUrl: 'https://polygonscan.com',
    rpcUrl: 'https://polygon-rpc.com',
  },
  {
    chainId: 2442,
    name: 'Polygon zkEVM Cardona Testnet',
    currency: 'ETH',
    ChainIcon: PolLogo,
    explorerUrl: 'https://cardona-zkevm.polygonscan.com',
    rpcUrl: 'https://rpc.cardona.zkevm-rpc.com',
  },
  {
    chainId: 43114,
    name: 'Avalanche',
    currency: 'AVAX',
    ChainIcon: AvaxLogo,
    explorerUrl: 'https://snowtrace.io',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
  },
  {
    chainId: 8453,
    name: 'Base',
    currency: 'ETH',
    ChainIcon: coinbaseLogo,
    explorerUrl: 'https://basescan.org',
    rpcUrl: 'https://mainnet.base.org',
  },
  {
    chainId: 59144,
    name: 'Linea',
    currency: 'ETH',
    ChainIcon: lineaLogo,
    explorerUrl: 'https://explorer.linea.build',
    rpcUrl: 'https://rpc.linea.build',
  },
];

const web3Config = defaultConfig({
  metadata: {
    name: 'CapsuleGuard',
    description: 'A decentralized token lock platform',
    url: 'http://localhost:5173/',
    icons: ['https://example.com/logo.png'],
  },
  defaultChainId: 1,
  rpcUrl: 'https://cloudflare-eth.com',
});

// Extract the resolved color from the theme
const colorMain = Theme.palette.primary.main;
const colorDark = Theme.palette.primary.dark;

const transformedChains = chains.map((chain) => ({
  chainId: chain.chainId,
  nativeCurrency: { name: chain.currency, symbol: chain.currency, decimals: 18 },
  blockExplorerUrls: [chain.explorerUrl], // Convert `explorerUrl` to array
  rpcUrls: [chain.rpcUrl], // Convert `rpcUrl` to array
  chainName: chain.name,
}));

createWeb3Modal({
  web3Config,
  chains: transformedChains, 
  projectId,
  enableAnalytics: true,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': colorMain,
    '--w3m-color-mix': colorDark,
    '--w3m-color-mix-strength': 20,
    '--w3m-z-index': 1200,
  },
});

function ToolbarThemeSwitcher() {
  return (
    <Stack direction="row">
      <ThemeSwitcher />
    </Stack>
  );
}

function SidebarFooter({ mini }: SidebarFooterProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        justifyItems: 'center',
      }}
    >
      <w3m-button />
      <Typography
        variant="caption"
        sx={{ my: 2, whiteSpace: 'nowrap', overflow: 'hidden' }}
      >
      {mini ? (
        '© $TCA'
      ) : (
        <>
        <Link href="https://www.timecapsuletoken.com" target="_blank" underline="hover">
          CapsuleGuard dApp © {new Date().getFullYear()}
        </Link>
        </>
      )}
      </Typography>
    </Box>
  );
}

function CustomAppTitle() {
  return (
    <Stack direction="row" alignItems="center" spacing={2}>
      <Avatar
        alt="CapsuleGuard"
        src={CGLogo}
        sx={{ width: 30, height: 30 }}
      />
      <Typography variant="h6">CapsuleGuard</Typography>
      <Link href="https://www.geckoterminal.com/bsc/pools/0x0a4f7119409634c3ac889f1b1026830174dbb911" target="_blank">
        <Chip size="small" label="$TCA" sx={{ color: 'primary.main' }} />
      </Link>
    </Stack>
  );
}

interface DemoProps {
  /**
   * Injected by the documentation to work in an iframe.
   * Remove this when copying and pasting into your project.
   */
  window?: () => Window;
}

const WalletContext = React.createContext<{
  address: string | undefined;
  isConnected: boolean;
  provider: ethers.BrowserProvider | null;
  chainId: number | undefined;
  explorerUrl?: string;
  ChainIcon?: string; // Add explorerUrl here
}>({
  address: undefined,
  isConnected: false,
  provider: null,
  chainId: undefined,
  explorerUrl: undefined,
  ChainIcon: undefined,
});

export const useWallet = () => {
  const context = React.useContext(WalletContext);

  if (!context) {
    throw new Error("useWallet must be used within a WalletContext.Provider");
  }

  const explorerUrl = React.useMemo(() => {
    if (!context.chainId) return undefined;
    const chain = chains.find((c) => c.chainId === context.chainId);
    return chain?.explorerUrl; // Use `explorerUrl` here
  }, [context.chainId]);

  const ChainIcon = React.useMemo(() => {
    if (!context.chainId) return undefined;
    const chain = chains.find((c) => c.chainId === context.chainId);
    return chain?.ChainIcon;
  }, [context.chainId]);

  return { ...context, explorerUrl, ChainIcon };
};

export default function App(props: DemoProps) {
  const { window } = props;

  // Get the current pathname from the browser or default to "/dashboard"
  const initialPathname =
    typeof globalThis.window !== "undefined" && globalThis.window.location.pathname
      ? globalThis.window.location.pathname
      : "/dashboard";

  // Initialize `useDemoRouter` with the current pathname
  const router = useDemoRouter(initialPathname);

  const demoWindow = window !== undefined ? window() : undefined;

  const { address, isConnected, chainId } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();

  // Create an ethers.js provider when `walletProvider` is available
  const [provider, setProvider] = React.useState<ethers.BrowserProvider | null>(null);

  // Calculate explorerUrl
  const explorerUrl = React.useMemo(() => {
    if (!chainId) return undefined;
    const chain = chains.find((c) => c.chainId === chainId);
    return chain?.explorerUrl; // Ensure it's accessing the correct field
  }, [chainId]);

   // Calculate ChainIcon
   const ChainIcon = React.useMemo(() => {
    if (!chainId) return undefined;
    const chain = chains.find((c) => c.chainId === chainId);
    return chain?.ChainIcon; // Ensure it's accessing the correct field
  }, [chainId]);

  React.useEffect(() => {
    if (walletProvider) {
      const ethersProvider = new ethers.BrowserProvider(walletProvider);
      setProvider(ethersProvider);
    }
  }, [walletProvider]);

  React.useEffect(() => {
    if (typeof globalThis.window !== "undefined") {
      globalThis.window.history.replaceState({}, "", router.pathname);
    }
  }, [router.pathname]);  

  return (
    <WalletContext.Provider value={{ address, isConnected, provider, chainId, explorerUrl, ChainIcon }}>
      <RouterContext.Provider value={{ navigate: router.navigate }}>
        <AppProvider
          navigation={NAVIGATION}
          router={router}
          theme={Theme}
          window={demoWindow}
        >
          <DashboardLayout
            slots={{
              appTitle: CustomAppTitle,
              toolbarActions: ToolbarThemeSwitcher,
              sidebarFooter: SidebarFooter,
            }}
            disableCollapsibleSidebar
          >
            <Box sx={{ flex: 1, padding: 0 }}>
              <PageRouter pathname={router.pathname} />
            </Box>
          </DashboardLayout>
        </AppProvider>
      </RouterContext.Provider>
    </WalletContext.Provider>
  );
}

export const RouterContext = React.createContext<{
  navigate: (path: string) => void;
}>({ navigate: () => {} });

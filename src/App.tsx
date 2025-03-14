import * as React from 'react';
import { ethers } from "ethers";
import { Box, Stack, Avatar, Typography, Chip, Link } from '@mui/material';
import { Theme } from "./styles/theme"; 
import { Dashboard as DashboardIcon, LockClock as LockClockIcon, LockOpen as LockOpenIcon, Help as HelpIcon, PsychologyAlt as PsychologyAltIcon, Settings as SettingsIcon } from '@mui/icons-material';
import CGLogo from './assets/images/logos/logo.png';
import { FaDiscord } from "react-icons/fa";
import { AppProvider, type Navigation } from '@toolpad/core/AppProvider';
import { DashboardLayout, ThemeSwitcher, type SidebarFooterProps } from '@toolpad/core/DashboardLayout';
import PageRouter from './components/PageRouter';
import { useDemoRouter } from '@toolpad/core/internal';
import { createWeb3Modal, defaultConfig, useWeb3ModalAccount, useWeb3ModalProvider  } from 'web3modal-web3js/react';
import { PROJECT_ID } from "./config";
import { useEffect, useMemo } from 'react';

import EthLogo from './assets/images/walletproviders/ethereum.png';
import ArbLogo from './assets/images/walletproviders/arbitrum.png';
import BNBLogo from './assets/images/walletproviders/bnb.png';
import OpLogo from './assets/images/walletproviders/optimism.png';
import PolLogo from './assets/images/walletproviders/polygon.png';
import AvaxLogo from './assets/images/walletproviders/Avax.png';
import coinbaseLogo from './assets/images/walletproviders/coinbase.png';
import lineaLogo from './assets/images/walletproviders/linea.png';
import CronosLogo from './assets/images/walletproviders/cronos.png';
import SolanaLogo from './assets/images/walletproviders/solana.png';
import { SiSolana, SiEthereum } from "react-icons/si";

// Import Solana wallet adapter
import { useWallet as useSolanaWallet, WalletContextState } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { SolanaWalletProvider } from './components/SolanaWalletProvider';
import WalletConnectButton from './components/WalletConnectButton';

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
    chainId: 84532, 
    name: 'Base Sepolia',
    currency: 'ETH',
    ChainIcon: coinbaseLogo,
    explorerUrl: 'https://sepolia.basescan.org',
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
      <WalletConnectButton />
      <Typography
        variant="caption"
        sx={{ my: 2, whiteSpace: 'nowrap', overflow: 'hidden' }}
      >
      {mini ? (
        '© $TCA'
      ) : (
        <>
        <Link href="https://www.timecapsuletoken.com" target="_blank" underline="hover">
          © 2024 TimeCapsule Token
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
  ChainIcon?: string;
  solanaAddress?: string;
  isSolanaConnected: boolean;
  solanaNetwork?: string;
  solanaBalance?: number;
  connectSolanaWallet: (walletName: string) => Promise<boolean>;
  disconnectWallet: () => void;
  disconnectSolanaWallet: () => void;
}>({
  address: undefined,
  isConnected: false,
  provider: null,
  chainId: undefined,
  explorerUrl: undefined,
  ChainIcon: undefined,
  solanaAddress: undefined,
  isSolanaConnected: false,
  solanaNetwork: undefined,
  solanaBalance: undefined,
  connectSolanaWallet: async () => false,
  disconnectWallet: () => {},
  disconnectSolanaWallet: () => {},
});

export const useWallet = () => {
  const { address, isConnected, chainId } = useWeb3ModalAccount();
  const web3ModalProvider = useWeb3ModalProvider();
  const solanaWallet = useSolanaWallet();
  const isSolanaConnected = solanaWallet.connected;
  const solanaAddress = solanaWallet.publicKey?.toString();
  
  // Get Solana network information
  const solanaNetwork = useMemo(() => {
    // Default to mainnet
    return WalletAdapterNetwork.Devnet;
  }, []);

  // Get provider for Ethereum
  const provider = useMemo(() => {
    if (isConnected && web3ModalProvider.walletProvider) {
      try {
        return new ethers.BrowserProvider(web3ModalProvider.walletProvider);
      } catch (error) {
        console.error('Error creating Ethereum provider:', error);
        return null;
      }
    }
    return null;
  }, [isConnected, web3ModalProvider.walletProvider]);

  // Get explorer URL based on chainId
  const explorerUrl = useMemo(() => {
    if (!chainId) return undefined;
    const chain = chains.find((c) => c.chainId === chainId);
    return chain?.explorerUrl;
  }, [chainId]);

  // Get chain icon based on chainId
  const ChainIcon = useMemo(() => {
    if (!chainId) return undefined;
    const chain = chains.find((c) => c.chainId === chainId);
    return chain?.ChainIcon;
  }, [chainId]);

  useEffect(() => {
    if (solanaWallet.connected) {
      console.log('Solana wallet connected:', solanaWallet.publicKey?.toString());
    }
  }, [solanaWallet.connected, solanaWallet.publicKey]);

  const disconnectWallet = () => {
    if (isConnected && web3ModalProvider.walletProvider) {
      try {
        // Use the web3Modal to disconnect
        console.log('Disconnecting Ethereum wallet');
      } catch (error) {
        console.error('Error disconnecting Ethereum wallet:', error);
      }
    }
  };

  const disconnectSolanaWallet = () => {
    if (solanaWallet.connected && solanaWallet.disconnect) {
      try {
        solanaWallet.disconnect();
        console.log('Solana wallet disconnected successfully');
      } catch (error) {
        console.error('Error disconnecting Solana wallet:', error);
      }
    } else {
      console.log('No Solana wallet connected or disconnect method not available');
    }
  };

  return {
    address,
    isConnected,
    chainId,
    provider,
    explorerUrl,
    ChainIcon,
    isSolanaConnected,
    solanaAddress,
    solanaNetwork,
    disconnectWallet,
    disconnectSolanaWallet
  };
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
  
  // Update URL when router pathname changes
  React.useEffect(() => {
    if (typeof globalThis.window !== "undefined") {
      globalThis.window.history.replaceState({}, "", router.pathname);
    }
  }, [router.pathname]);

  return (
    <SolanaWalletProvider>
      <WalletContextWrapper router={router} demoWindow={demoWindow} />
    </SolanaWalletProvider>
  );
}

// Separate component to access Solana wallet after provider is initialized
const WalletContextWrapper = ({ router, demoWindow }: { router: any, demoWindow: Window | undefined }) => {
  // Ethereum wallet state
  const { address, isConnected, chainId } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const [provider, setProvider] = React.useState<ethers.BrowserProvider | null>(null);

  // Solana wallet state - now safely accessed after SolanaWalletProvider is initialized
  const solanaWallet = useSolanaWallet();
  const [solanaNetwork, setSolanaNetwork] = React.useState<string>(WalletAdapterNetwork.Mainnet);
  const [solanaBalance, setSolanaBalance] = React.useState<number | undefined>(undefined);

  // Detect Solana network when wallet connects
  React.useEffect(() => {
    const detectNetwork = async () => {
      if (solanaWallet && solanaWallet.connected && solanaWallet.publicKey) {
        try {
          console.log('Detecting Solana network from connected wallet...');
          
          // Get the network from the wallet adapter context
          // We need to access the connection differently since it's not directly on the wallet context
          const endpoint = (window as any).solana?.connection?._rpcEndpoint || 
                           (solanaWallet as any).adapter?.connection?._rpcEndpoint;
          
          if (endpoint) {
            console.log('Current RPC endpoint:', endpoint);
            
            let detectedNetwork;
            if (endpoint.includes('devnet')) {
              detectedNetwork = 'devnet';
            } else if (endpoint.includes('testnet')) {
              detectedNetwork = 'testnet';
            } else {
              detectedNetwork = 'mainnet';
            }
            
            console.log('Detected Solana network:', detectedNetwork);
            setSolanaNetwork(detectedNetwork);
          } else {
            console.log('No connection available in wallet, defaulting to devnet');
            setSolanaNetwork('devnet');
          }
        } catch (error) {
          console.error('Error detecting Solana network:', error);
          // Default to devnet on error for development
          setSolanaNetwork('devnet');
        }
      }
    };
    
    detectNetwork();
  }, [solanaWallet.connected, solanaWallet.publicKey]);

  // Calculate explorerUrl
  const explorerUrl = React.useMemo(() => {
    if (!chainId) return undefined;
    const chain = chains.find((c) => c.chainId === chainId);
    return chain?.explorerUrl;
  }, [chainId]);

  // Calculate ChainIcon
  const ChainIcon = React.useMemo(() => {
    if (!chainId) return undefined;
    const chain = chains.find((c) => c.chainId === chainId);
    return chain?.ChainIcon;
  }, [chainId]);

  React.useEffect(() => {
    if (walletProvider) {
      const ethersProvider = new ethers.BrowserProvider(walletProvider);
      setProvider(ethersProvider);
    }
  }, [walletProvider]);

  // Connect to Solana wallet
  const connectSolanaWallet = async (walletName: string) => {
    console.log('Solana wallet connection is now handled by the wallet adapter');
    // This function is now a placeholder since we're using the wallet adapter modal directly
    // The actual connection is handled by the wallet adapter when the user selects a wallet
    return true;
  };

  // Disconnect Ethereum wallet
  const disconnectWallet = () => {
    // Web3Modal handles disconnection internally
    console.log('Disconnecting Ethereum wallet');
  };

  // Disconnect Solana wallet
  const disconnectSolanaWallet = () => {
    console.log('Attempting to disconnect Solana wallet');
    try {
      if (solanaWallet.connected && solanaWallet.disconnect) {
        solanaWallet.disconnect();
        console.log('Solana wallet disconnected successfully');
      } else {
        console.log('No Solana wallet connected or disconnect method not available');
      }
    } catch (error) {
      console.error('Error disconnecting Solana wallet:', error);
    }
  };

  // Example wallet addresses
  const address1 = address; // Replace with the actual address
  const address2 = solanaWallet.publicKey?.toString(); // Replace with the actual address

  // Check if wallet is connected for ETH (isConnected) or Solana (solanaWallet.connected)
  const isETHConnected = isConnected; // Assuming 'isConnected' tracks ETH wallet connection status
  const isSolanaConnected = solanaWallet.connected; // Assuming 'solanaWallet.connected' tracks Solana wallet connection

  // Address to check
  const CheckSOLWalletAddress = "TCAuHGBvkvQ773a9xHTZNaokLdM9RyL9ZBwS42syHNu"; // Replace with the current wallet address
  const CheckETHWalletAddress = "0x812E7DDb3576376D3420DEc704335D91E6f49795"; // Replace with the current wallet address
  
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
      kind: 'header',
      title: 'Lock Tokens',
    },
    ...(!isConnected && solanaWallet.connected ? [] : [
      {
        segment: 'locker',
        title: 'ETH EVMs',
        icon: <SiEthereum />,
      },
    ]),
    ...(isConnected && !solanaWallet.connected ? [] : [
      {
        segment: 'sollocker',
        title: 'Solana',
        icon: <SiSolana />,
      },
    ]),
    {
      kind: 'divider',
    },
    {
      kind: 'header',
      title: 'Locked Tokens',
    },
    ...(!isConnected && solanaWallet.connected ? [] : [
      {
        segment: 'locked',
        title: 'ETH EVMs',
        icon: <SiEthereum />,
      },
    ]),
    ...(isConnected && !solanaWallet.connected ? [] : [
      {
        segment: 'lockedsol',
        title: 'Solana',
        icon: <SiSolana />,
      },
    ]),
    ...(
      (CheckETHWalletAddress === address1 || CheckSOLWalletAddress === address2) && 
      (isETHConnected || isSolanaConnected) 
        ? [
            {
              kind: 'divider' as 'divider', // Explicitly type this as 'divider'
            },
            {
              kind: 'header' as 'header', // Explicitly type this as 'header'
              title: 'Admin',
            },
            {
              segment: 'admin',
              title: 'Admin',
              icon: <SettingsIcon />,
              children: [
                {
                  segment: 'initialize',
                  title: 'Initialize Contract',
                  icon: <SettingsIcon />,
                },
                {
                  segment: 'dashboard',
                  title: 'Admin Dashboard',
                  icon: <DashboardIcon />,
                },
              ],
            },
         ] 
         : [] // Show nothing if the condition doesn't match
      ),
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

  return (
    <WalletContext.Provider 
      value={{ 
        address, 
        isConnected, 
        provider, 
        chainId, 
        explorerUrl, 
        ChainIcon,
        solanaAddress: solanaWallet.publicKey?.toString(),
        isSolanaConnected: solanaWallet.connected,
        solanaNetwork,
        solanaBalance,
        connectSolanaWallet,
        disconnectWallet,
        disconnectSolanaWallet
      }}
    >
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

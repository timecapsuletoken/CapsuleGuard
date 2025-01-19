import * as React from 'react';
import { Box, Stack, Avatar, Typography, Chip, Link } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { Dashboard as DashboardIcon, PunchClock as PunchClockIcon } from '@mui/icons-material';
import CGLogo from './assets/images/logos/logo.png';
import { AppProvider, type Navigation } from '@toolpad/core/AppProvider';
import { DashboardLayout, ThemeSwitcher, type SidebarFooterProps } from '@toolpad/core/DashboardLayout';
import { useDemoRouter } from '@toolpad/core/internal';
import { createWeb3Modal, defaultConfig } from 'web3modal-web3js/react';
import DashboardPage from './pages/index'; // Dashboard content
import LockTokens from './pages/LockTokens'; // Orders content

const NAVIGATION: Navigation = [
  {
    kind: 'header',
    title: 'Main items',
  },
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
    title: 'Tools',
  },
  {
    segment: '',
    title: 'Locker',
    icon: <PunchClockIcon />,
    children: [
      {
        segment: 'localhost:5173/locker',
        title: 'Lock Tokens',
        icon: <PunchClockIcon />,
      },
      {
        segment: 'LockedTokens',
        title: 'Locked Tokens',
        icon: <PunchClockIcon />,
      },
    ],
  },
];

const demoTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'data-toolpad-color-scheme',
  },
  colorSchemes: {
    light: {
      palette: {
        background: {
          default: '#F9F9FE',
          paper: '#EEEEF9',
        },
        primary: {
          main: '#9e03f2', // Primary color
          light: '#c773f5',
          dark: '#5f0191',
          contrastText: '#ffffff', // Text color for primary elements
        },
        secondary: {
          main: '#595959', // Secondary color
          light:'rgb(143, 143, 143)',
          dark: '#333333',
          contrastText: '#ffffff', // Text color for secondary elements
        },
        text: {
          primary: '#333333', // Main text color
          secondary: '#555555', // Secondary text color
        },
      },
    },
    dark: {
      palette: {
        background: {
          default: '#1c1c1c',
          paper: '#333333',
        },
        primary: {
          main: '#1ec8d8', // Primary color
          light:'rgb(191, 250, 255)',
          dark:'rgb(18, 101, 109)',
          contrastText: '#ffffff', // Text color for primary elements
        },
        secondary: {
          main:'rgb(0, 157, 172)', // Secondary color
          light: 'rgb(224, 252, 255)',
          dark: 'rgb(0, 108, 117)',
          contrastText: '#ffffff', // Text color for secondary elements
        },
        text: {
          primary: '#ffffff', // Main text color
          secondary: '#bdbdbd', // Secondary text color
        },
      },
    },
  },
  typography: {
    fontFamily: "'Lunasima', 'Arial', sans-serif", // Custom font
    h1: { fontSize: '2rem', fontWeight: 700 },
    body1: { fontSize: '1rem', lineHeight: 1.5 },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 600,
      lg: 1200,
      xl: 1536,
    },
  },
});

// Web3Modal Configuration
const projectId = 'e3a29696e7dba40c10f0ed56b268a15a';
const chains = [
  {
    chainId: 1,
    name: 'Ethereum',
    currency: 'ETH',
    explorerUrl: 'https://etherscan.io',
    rpcUrl: 'https://cloudflare-eth.com',
  },
  {
    chainId: 56,
    name: 'BNB Smart Chain',
    currency: 'BNB',
    explorerUrl: 'https://bscscan.com',
    rpcUrl: 'https://bsc-dataseed.bnbchain.org/',
  },
  {
    chainId: 42161,
    name: 'Arbitrum',
    currency: 'ETH',
    explorerUrl: 'https://arbiscan.io',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
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
const colorMain = demoTheme.palette.primary.main;
const colorDark = demoTheme.palette.primary.dark;

createWeb3Modal({
  web3Config,
  chains,
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

function ToolbarActionsSearch() {
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
        sx={{ m: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}
      >
        {mini ? '© MUI' : `© ${new Date().getFullYear()} Made with love by MUI`}
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

function DemoPageContent({ pathname }: { pathname: string }) {
  if (pathname === '/dashboard' || pathname === '/') return <DashboardPage />;
  if (pathname === '/locker') return <LockTokens />;
  return <Typography>404 - Page Not Found</Typography>;
}

interface DemoProps {
  /**
   * Injected by the documentation to work in an iframe.
   * Remove this when copying and pasting into your project.
   */
  window?: () => Window;
}

export default function DashboardLayoutSlots(props: DemoProps) {
  const { window } = props;
  const router = useDemoRouter('/dashboard');
  const demoWindow = window !== undefined ? window() : undefined;

  return (
    <AppProvider
      navigation={NAVIGATION}
      router={router}
      theme={demoTheme}
      window={demoWindow}
    >
      <DashboardLayout
        slots={{
          appTitle: CustomAppTitle,
          toolbarActions: ToolbarActionsSearch,
          sidebarFooter: SidebarFooter,
        }}
        disableCollapsibleSidebar
      >
        <Box sx={{ flex: 1, padding: 0 }}>
         <DemoPageContent pathname={router.pathname} />
        </Box>
      </DashboardLayout>
    </AppProvider>
  );
}
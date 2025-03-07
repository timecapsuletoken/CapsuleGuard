interface Window {
  ethereum?: any;
  Buffer: typeof Buffer;
  process: {
    env: Record<string, string>;
  };
  global: typeof globalThis;
  solana?: {
    isPhantom?: boolean;
    publicKey?: any;
    _network?: string;
    connection?: {
      _rpcEndpoint?: string;
    };
    signAndSendTransaction: (transaction: any) => Promise<{
      signature: string;
      publicKey: string;
    }>;
    signTransaction: (transaction: any) => Promise<Uint8Array>;
    signAllTransactions: (transactions: any[]) => Promise<Uint8Array[]>;
    request: (request: { method: string; params?: any }) => Promise<any>;
    connect: () => Promise<{ publicKey: string }>;
    disconnect: () => Promise<void>;
  };
} 
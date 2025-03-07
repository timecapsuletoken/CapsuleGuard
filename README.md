# CapsuleGuard

**CapsuleGuard** is a secure and efficient cross-chain token locking platform that supports both EVM-compatible blockchains (Ethereum, BNB Chain, etc.) and Solana. It enables users to lock tokens for a specified period with transparency and simplicity, making it ideal for projects requiring time-based token releases, vesting schedules, and liquidity management.

![CapsuleGuard](https://github.com/timecapsuletoken/CapsuleGuard/raw/main/public/logo.png)

## Features

### Cross-Chain Support
- **EVM Chains**: Lock ERC-20 tokens on Ethereum, BNB Chain, Arbitrum, Optimism, Polygon, Avalanche, Base, and Linea.
- **Solana**: Lock SPL tokens and native SOL on the Solana blockchain.

### Token Locking
- **Token Locking**: Securely lock a specified amount of tokens until a designated unlock time.
- **Native Token Support**: Lock native tokens (ETH, BNB, SOL) in addition to standard tokens.
- **Multiple Locks**: Create multiple lock positions for the same token with different unlock times.
- **Fee Structure**: Simple and transparent fee structure using USDC.

### Management Features
- **Withdrawal**: Withdraw locked tokens after the lock period has expired.
- **Lock Time Extension**: Extend the unlock time of locked tokens if needed.
- **Lock Information**: Query locked token details, including the locked amount and unlock time.
- **User Dashboard**: View all your locked tokens across different blockchains.
- **Token Metadata**: Automatic fetching and display of token metadata (name, symbol, logo).

### Admin Features
- **Contract Initialization**: Initialize the contract with configurable parameters.
- **Fee Management**: Collect and withdraw fees from the platform.
- **USDC Mint Updates**: Update the USDC mint address for fee collection.

### Security & Transparency
- **Event Logging**: Emit events for key actions, such as token locking and withdrawal, for improved traceability.
- **Human-Readable Amounts**: Display token amounts in a user-friendly format.
- **Secure Architecture**: Utilize secure design patterns to protect user funds.

---

## Supported Blockchains

### EVM Chains
- Ethereum Mainnet
- BNB Smart Chain
- Arbitrum
- Optimism
- Polygon
- Avalanche
- Base
- Linea
- Various Testnets (BNB Testnet, Arbitrum Testnet, Optimism Testnet, etc.)

### Solana
- Solana Mainnet
- Solana Devnet
- Solana Testnet

---

## Technical Architecture

### Ethereum Smart Contract (CGCV9)
The Ethereum implementation uses a Solidity smart contract with the following key components:
- Token locking with USDC fee payment
- Native token locking support
- Multiple locks per wallet
- Owner-only administrative functions

### Solana Program
The Solana implementation uses an Anchor-based Rust program with the following key components:
- SPL token and native SOL locking
- PDA-based account structure
- Fee collection in USDC
- Owner configuration and management

### Frontend Application
- React-based web application
- Material UI components
- Wallet integration for both EVM chains and Solana
- Token metadata fetching and display
- Human-readable formatting for large numbers

---

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Web browser with wallet extensions (MetaMask for EVM chains, Phantom/Solflare for Solana)

### Installation
1. Clone the repository:
   ```
   git clone https://github.com/timecapsuletoken/CapsuleGuard.git
   cd CapsuleGuard
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the required environment variables:
   ```
   VITE_PROJECT_ID=your_web3_project_id
   VITE_TCA_TOKEN_ADDRESS=your_token_address
   VITE_PAIR_ADDRESS=your_pair_address
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Build for production:
   ```
   npm run build
   ```

---

## How to Use

### Locking Tokens (EVM Chains)
1. Connect your wallet to the desired EVM chain.
2. Navigate to the "Lock Tokens" page.
3. Select the token you want to lock.
4. Enter the amount to lock and the unlock date.
5. Approve the token spending (if needed) and confirm the transaction.
6. Your tokens will be locked until the specified unlock time.

### Locking Tokens (Solana)
1. Connect your Solana wallet.
2. Navigate to the "Lock SOL Tokens" page.
3. Choose between SOL or SPL tokens.
4. Enter the token address (for SPL tokens), amount, and unlock date.
5. Confirm the transaction.
6. Your tokens will be locked until the specified unlock time.

### Withdrawing Tokens
1. Connect the wallet that originally locked the tokens.
2. Navigate to the "Locked Tokens" page (for EVM chains) or "Locked SOL Tokens" page (for Solana).
3. Find the lock position you want to withdraw.
4. Click "Withdraw" if the unlock time has passed.
5. Confirm the transaction to receive your tokens.

### Extending Lock Time
1. Connect the wallet that originally locked the tokens.
2. Navigate to the appropriate locked tokens page.
3. Find the lock position you want to extend.
4. Click "Extend" and select a new unlock date.
5. Confirm the transaction to update the unlock time.

### Admin Functions
1. Connect the owner wallet.
2. Navigate to the "Admin Dashboard" or "Initialize Contract" page.
3. Access functions like fee withdrawal, USDC mint updates, and contract initialization.

---

## Security Considerations

- Ensure you're connected to the correct network before performing any transactions.
- Verify contract addresses match the official ones listed in the documentation.
- Tokens are transferred using standard token interfaces, requiring approval for ERC-20/SPL tokens.
- Lock extensions can only be performed by the original locker of the tokens.
- The platform charges a small fee in USDC for each lock operation.

---

## Development

### Contract Deployment
- EVM contracts can be deployed using Hardhat or Remix.
- Solana programs can be deployed using Anchor.

### Testing
Run tests with:
```
npm run test
```

### Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

---

## Contact

Project Link: [https://github.com/timecapsuletoken/CapsuleGuard](https://github.com/timecapsuletoken/CapsuleGuard)

---

CapsuleGuard: Secure. Cross-Chain. Reliable.
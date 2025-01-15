# BNBLockGuard

## Description
BNBLockGuard is a robust and secure smart contract designed for locking ERC20 tokens, including Liquidity Pool (LP) tokens, on the Binance Smart Chain (BSC). It provides a simple and transparent mechanism for locking tokens to build trust with investors and secure liquidity. The contract ensures that tokens are locked for a specified period and can only be withdrawn once the lock expires. Additionally, it allows flexibility to extend the lock duration if needed.

---

## Features
- **Token Locking**: Securely lock ERC20 tokens, including LP tokens, for a specified duration.
- **Unlock Mechanism**: Tokens can only be withdrawn by the owner after the lock period ends.
- **Extend Lock Time**: Extend the lock duration if required.
- **Transparency**: Emission of events for locking and withdrawing tokens for easy tracking.

---

## Contract Details
### State Variables
- `address public immutable owner`:
  The address of the contract owner who can lock and withdraw tokens.
- `IERC20 public token`:
  The ERC20 token to be locked.
- `uint256 public unlockTime`:
  The timestamp when the lock ends.
- `uint256 public lockedAmount`:
  The total amount of tokens locked.

### Events
- `event TokensLocked(address indexed locker, uint256 amount, uint256 unlockTime)`:
  Emitted when tokens are locked.
- `event TokensWithdrawn(address indexed owner, uint256 amount)`:
  Emitted when tokens are withdrawn.

### Modifiers
- `onlyOwner`:
  Restricts access to the contract owner.
- `lockExpired`:
  Ensures that the lock period has ended before allowing withdrawals.

### Functions
1. **Constructor**
   ```solidity
   constructor(address _tokenAddress, uint256 _unlockTime)
   ```
   - Initializes the contract with the token to be locked and the unlock time.
   - Requirements:
     - `_unlockTime` must be in the future.
     - `_tokenAddress` must be a valid ERC20 token address.

2. **lockTokens**
   ```solidity
   function lockTokens(uint256 _amount) external onlyOwner
   ```
   - Locks the specified amount of tokens in the contract.
   - Requirements:
     - `_amount` must be greater than zero.
     - Tokens must be approved for transfer to the contract.

3. **withdrawTokens**
   ```solidity
   function withdrawTokens() external onlyOwner lockExpired
   ```
   - Withdraws all locked tokens after the lock period ends.

4. **extendLockTime**
   ```solidity
   function extendLockTime(uint256 newUnlockTime) external onlyOwner
   ```
   - Extends the unlock time to a future date.
   - Requirements:
     - `newUnlockTime` must be greater than the current unlock time.

---

## Deployment
### Prerequisites
1. Install [MetaMask](https://metamask.io/) and configure it for Binance Smart Chain Testnet/Mainnet.
2. Install a Solidity development environment, such as [Remix](https://remix.ethereum.org/) or [Hardhat](https://hardhat.org/).

### Steps
1. **Compile the Contract**:
   - Use Solidity 0.8.20 or a compatible version.
   - Ensure OpenZeppelin dependencies are installed if using Hardhat or Truffle.

2. **Deploy the Contract**:
   - Deploy the contract with:
     - `_tokenAddress`: Address of the ERC20 token to be locked.
     - `_unlockTime`: Timestamp for the lock expiration (e.g., `block.timestamp + 30 days`).

3. **Verify the Contract**:
   - Use BscScan or other tools to verify the deployed contract.

---

## How to Use
### Lock Tokens
1. Approve the contract to spend the tokens:
   ```solidity
   token.approve(address(tokenLock), amount);
   ```
2. Call the `lockTokens` function:
   ```solidity
   tokenLock.lockTokens(amount);
   ```

### Withdraw Tokens
1. Ensure the unlock time has passed.
2. Call the `withdrawTokens` function:
   ```solidity
   tokenLock.withdrawTokens();
   ```

### Extend Lock Time
1. Call the `extendLockTime` function with the new unlock time:
   ```solidity
   tokenLock.extendLockTime(newUnlockTime);
   ```

---

## Example
### Deployment Parameters
- `_tokenAddress`: `0x...` (Token contract address).
- `_unlockTime`: `block.timestamp + 30 days`.

### Interactions
- Lock 1000 tokens:
  ```solidity
  token.approve(address(tokenLock), 1000 * 10**decimals);
  tokenLock.lockTokens(1000 * 10**decimals);
  ```
- Withdraw tokens after the unlock period:
  ```solidity
  tokenLock.withdrawTokens();
  ```

---

## Security Considerations
1. Ensure you trust the token contract (`_tokenAddress`) to prevent malicious interactions.
2. Use a hardware wallet for deployment to secure the private key.
3. Test thoroughly on a testnet before deploying to mainnet.

---

## License
This project is licensed under the MIT License.

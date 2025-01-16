# CapsuleGuard

**CapsuleGuard** is a secure and efficient smart contract designed to lock ERC-20 tokens for a specified period. It enables users to manage token locking with transparency and simplicity, making it ideal for projects requiring time-based token releases.

---

## Features

- **Token Locking**: Securely lock a specified amount of ERC-20 tokens until a designated unlock time.
- **Withdrawal**: Withdraw locked tokens after the lock period has expired.
- **Lock Time Extension**: Extend the unlock time of locked tokens if needed.
- **Lock Information**: Query locked token details, including the locked amount and unlock time.
- **Event Logging**: Emit events for key actions, such as token locking and withdrawal, for improved traceability.

---

## Table of Contents

- [Deployment](#deployment)
- [How It Works](#how-it-works)
- [Functions](#functions)
- [Security Considerations](#security-considerations)
- [License](#license)

---

## Deployment

To deploy the `CapsuleGuard` contract, follow these steps:

1. Use a development environment like [Remix](https://remix.ethereum.org/) or [Hardhat](https://hardhat.org/).
2. Compile the contract with Solidity version `^0.8.20`.
3. Deploy the contract to your desired blockchain network (e.g., Ethereum, BNB Smart Chain).

---

## How It Works

1. **Lock Tokens**: Users can lock their tokens by transferring them to the contract along with the desired unlock time.
2. **Query Lock Details**: Users can query the locked amount and unlock time of their tokens.
3. **Withdraw Tokens**: Once the unlock time has passed, users can withdraw their locked tokens.
4. **Extend Lock Time**: Users can extend the unlock time of their tokens if needed.

---

## Functions

### 1. `lockTokens(address tokenAddress, uint256 amount, uint256 unlockTime)`

Locks a specified amount of tokens until a specified unlock time.

- **Parameters**:
  - `tokenAddress`: Address of the ERC-20 token to lock.
  - `amount`: Amount of tokens to lock.
  - `unlockTime`: Unix timestamp when the tokens can be unlocked.
- **Emits**: `TokensLocked` event.

---

### 2. `withdrawTokens(address tokenAddress)`

Withdraws locked tokens after the lock period has expired.

- **Parameters**:
  - `tokenAddress`: Address of the ERC-20 token to withdraw.
- **Emits**: `TokensWithdrawn` event.
- **Reverts**:
  - If the lock period has not ended.
  - If no tokens are locked.

---

### 3. `extendLockTime(address tokenAddress, uint256 newUnlockTime)`

Extends the unlock time for a locked token.

- **Parameters**:
  - `tokenAddress`: Address of the ERC-20 token to extend the lock for.
  - `newUnlockTime`: New unlock timestamp (must be greater than the current unlock time).

---

### 4. `getLockDetails(address lockerAddress, address tokenAddress)`

Fetches the details of locked tokens for a specific locker and token.

- **Parameters**:
  - `lockerAddress`: Address of the token locker.
  - `tokenAddress`: Address of the ERC-20 token.
- **Returns**:
  - `lockedAmount`: Amount of tokens locked.
  - `unlockTime`: Timestamp when the tokens can be unlocked.

---

## Security Considerations

- Ensure the contract is deployed on a trusted network.
- Tokens are transferred using the `transferFrom` method, requiring the user to approve the contract to spend tokens on their behalf.
- Extending the unlock time can only be performed by the locker of the tokens.

---

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

---

CapsuleGuard: Secure. Transparent. Reliable.
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenLock {
    address public immutable owner;
    IERC20 public token; // The token to be locked
    uint256 public unlockTime; // Timestamp when the lock ends
    uint256 public lockedAmount; // Amount of tokens locked

    event TokensLocked(address indexed locker, uint256 amount, uint256 unlockTime);
    event TokensWithdrawn(address indexed owner, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier lockExpired() {
        require(block.timestamp >= unlockTime, "Lock period not yet ended");
        _;
    }

    constructor(address _tokenAddress, uint256 _unlockTime) {
        require(_unlockTime > block.timestamp, "Unlock time must be in the future");
        require(_tokenAddress != address(0), "Invalid token address");
        owner = msg.sender;
        token = IERC20(_tokenAddress);
        unlockTime = _unlockTime;
    }

    function lockTokens(uint256 _amount) external onlyOwner {
        require(_amount > 0, "Amount must be greater than zero");
        require(token.transferFrom(msg.sender, address(this), _amount), "Token transfer failed");
        lockedAmount += _amount;

        emit TokensLocked(msg.sender, _amount, unlockTime);
    }

    function withdrawTokens() external onlyOwner lockExpired {
        uint256 amount = lockedAmount;
        require(amount > 0, "No tokens to withdraw");
        lockedAmount = 0;

        require(token.transfer(owner, amount), "Token transfer failed");
        emit TokensWithdrawn(owner, amount);
    }

    function extendLockTime(uint256 newUnlockTime) external onlyOwner {
        require(newUnlockTime > unlockTime, "New unlock time must be in the future");
        unlockTime = newUnlockTime;
    }
} 

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CGCV6 {
    // Mapping from locker -> token address -> lock info
    struct TokenLockInfo {
        uint256 lockedAmount;
        uint256 unlockTime;
    }
    mapping(address => mapping(address => TokenLockInfo)) private _tokenLocks;
    mapping(address => address[]) private _userTokens;
    mapping(address => mapping(address => bool)) private _userTokenExists;

    event TokensLocked(address indexed token, address indexed locker, uint256 amount, uint256 unlockTime);
    event TokensWithdrawn(address indexed token, address indexed locker, uint256 amount);

    modifier lockExpired(address lockerAddress, address tokenAddress) {
        require(block.timestamp >= _tokenLocks[lockerAddress][tokenAddress].unlockTime, "Lock period not yet ended");
        _;
    }

    address private owner; // Contract owner
    uint256 public collectedFees; // Total fees collected

    // Fee in USDC (scaled to 6 decimals)
    uint256 private constant FEE_IN_USD = 5 * (10 ** 6); // $5 fee (assuming USDC has 6 decimals)
    address public usdcTokenAddress; // USDC token address

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    constructor(address _usdcTokenAddress) {
        owner = msg.sender;
        usdcTokenAddress = _usdcTokenAddress;
    }

    /**
     * @dev Locks a specified amount of tokens until a specified unlock time.
     * @param tokenAddress The address of the token to lock.
     * @param amount The amount of tokens to lock.
     * @param unlockTime The timestamp when the tokens can be unlocked.
     */
    function lockTokens(address tokenAddress, uint256 amount, uint256 unlockTime) external {
        require(tokenAddress != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than zero");
        require(unlockTime > block.timestamp, "Unlock time must be in the future");

        IERC20 token = IERC20(tokenAddress);

        // Separate checks for fee and lock amount
        if (tokenAddress == usdcTokenAddress) {
            require(
                token.allowance(msg.sender, address(this)) >= FEE_IN_USD + amount,
                "Allowance insufficient"
            );
            require(
                token.balanceOf(msg.sender) >= FEE_IN_USD + amount,
                "Balance insufficient"
            );

            // Deduct the fee first
            require(token.transferFrom(msg.sender, address(this), FEE_IN_USD), "Fee payment in USDC failed");
        } else {
            require(
                token.allowance(msg.sender, address(this)) >= amount,
                "Allowance insufficient for lock amount"
            );
            require(
                token.balanceOf(msg.sender) >= amount,
                "Balance insufficient for lock amount"
            );

            IERC20 usdcToken = IERC20(usdcTokenAddress);
            require(
                usdcToken.allowance(msg.sender, address(this)) >= FEE_IN_USD,
                "Allowance insufficient for fee"
            );
            require(
                usdcToken.balanceOf(msg.sender) >= FEE_IN_USD,
                "Balance insufficient for fee"
            );

            // Deduct the fee
            require(usdcToken.transferFrom(msg.sender, address(this), FEE_IN_USD), "Fee payment in USDC failed");
        }

        // Transfer the locked amount
        require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");

        // Update lock details
        TokenLockInfo storage lockInfo = _tokenLocks[msg.sender][tokenAddress];
        lockInfo.lockedAmount += amount;
        lockInfo.unlockTime = unlockTime;

        // Track user tokens
        if (!_userTokenExists[msg.sender][tokenAddress]) {
            _userTokens[msg.sender].push(tokenAddress);
            _userTokenExists[msg.sender][tokenAddress] = true;
        }

        emit TokensLocked(tokenAddress, msg.sender, amount, unlockTime);
    }

    /**
     * @dev Withdraws locked tokens after the lock period has expired.
     * @param tokenAddress The address of the token to withdraw.
     */
    function withdrawTokens(address tokenAddress) external lockExpired(msg.sender, tokenAddress) {
        TokenLockInfo storage lockInfo = _tokenLocks[msg.sender][tokenAddress];
        uint256 amount = lockInfo.lockedAmount;
        require(amount > 0, "No tokens to withdraw");

        // Reset locked amount
        lockInfo.lockedAmount = 0;

        IERC20 token = IERC20(tokenAddress);
        require(token.transfer(msg.sender, amount), "Token transfer failed");

        emit TokensWithdrawn(tokenAddress, msg.sender, amount);
    }

    /**
     * @dev Extends the unlock time for a locked token.
     * @param tokenAddress The address of the token to extend the lock time for.
     * @param newUnlockTime The new unlock time (must be greater than the current unlock time).
     */
    function extendLockTime(address tokenAddress, uint256 newUnlockTime) external {
        TokenLockInfo storage lockInfo = _tokenLocks[msg.sender][tokenAddress];
        require(newUnlockTime > lockInfo.unlockTime, "New unlock time must be in the future");

        lockInfo.unlockTime = newUnlockTime;
    }

    /**
     * @dev Gets the lock details for a specific locker and token.
     * @param lockerAddress The address of the locker.
     * @param tokenAddress The address of the token.
     * @return lockedAmount The amount of locked tokens.
     * @return unlockTime The unlock timestamp.
     */
    function getLockDetails(address lockerAddress, address tokenAddress)
        external
        view
        returns (uint256 lockedAmount, uint256 unlockTime)
    {
        TokenLockInfo memory lockInfo = _tokenLocks[lockerAddress][tokenAddress];
        return (lockInfo.lockedAmount, lockInfo.unlockTime);
    }

    function getUserTokens(address user) 
        external 
        view 
        returns (address[] memory)
    {
        return _userTokens[user];
    }

    // Function for the owner to withdraw collected fees
    function withdrawFees() external onlyOwner {
        require(collectedFees > 0, "No fees to withdraw");

        uint256 amount = collectedFees;
        collectedFees = 0; // Reset collected fees

        IERC20 usdcToken = IERC20(usdcTokenAddress);
        require(usdcToken.transfer(owner, amount), "Fee withdrawal failed");
    }

    // Update the USDC token address (owner only)
    function updateUsdcTokenAddress(address _usdcTokenAddress) external onlyOwner {
        require(_usdcTokenAddress != address(0), "Invalid address");
        usdcTokenAddress = _usdcTokenAddress;
    }

}
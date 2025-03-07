use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("4u2VSp7vyT3uSKybjwBvAikbMQE9Hr7eaBVhbJ2yWrDT");

const FEE_IN_USD: u64 = 5_000_000; // $5 USDC (6 decimals)

#[program]
pub mod token_locker {
    use super::*;

    // Lock SPL tokens
    pub fn lock_tokens(
        ctx: Context<LockTokens>,
        amount: u64,
        unlock_time: u64,
        seed: u64,
    ) -> Result<()> {
        let clock = Clock::get()?;
        require!(unlock_time > clock.unix_timestamp as u64, ErrorCode::InvalidUnlockTime);
        require!(amount > 0, ErrorCode::InvalidAmount);

        // Pay USDC fee
        let fee_transfer = Transfer {
            from: ctx.accounts.usdc_account.to_account_info(),
            to: ctx.accounts.program_usdc_account.to_account_info(),
            authority: ctx.accounts.locker.to_account_info(),
        };
        let fee_cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            fee_transfer,
        );
        token::transfer(fee_cpi_ctx, FEE_IN_USD)?;
        ctx.accounts.config.collected_fees += FEE_IN_USD;

        // Transfer tokens to lock account
        let token_transfer = Transfer {
            from: ctx.accounts.token_account.to_account_info(),
            to: ctx.accounts.lock_token_account.to_account_info(),
            authority: ctx.accounts.locker.to_account_info(),
        };
        let token_cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token_transfer,
        );
        token::transfer(token_cpi_ctx, amount)?;

        // Initialize lock account
        let lock_account = &mut ctx.accounts.lock_account;
        lock_account.locker = ctx.accounts.locker.key();
        lock_account.token_mint = ctx.accounts.token_account.mint;
        lock_account.locked_amount = amount;
        lock_account.unlock_time = unlock_time;
        lock_account.creation_time = clock.unix_timestamp as u64;
        lock_account.seed = seed;

        Ok(())
    }

    // Lock native SOL
    pub fn lock_native_tokens(
        ctx: Context<LockNativeTokens>,
        amount: u64,
        unlock_time: u64,
        seed: u64,
    ) -> Result<()> {
        let clock = Clock::get()?;
        require!(unlock_time > clock.unix_timestamp as u64, ErrorCode::InvalidUnlockTime);
        require!(amount > 0, ErrorCode::InvalidAmount);

        // Pay USDC fee
        let fee_transfer = Transfer {
            from: ctx.accounts.usdc_account.to_account_info(),
            to: ctx.accounts.program_usdc_account.to_account_info(),
            authority: ctx.accounts.locker.to_account_info(),
        };
        let fee_cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            fee_transfer,
        );
        token::transfer(fee_cpi_ctx, FEE_IN_USD)?;
        ctx.accounts.config.collected_fees += FEE_IN_USD;

        // Transfer SOL to lock account
        let transfer_instruction = anchor_lang::system_program::Transfer {
            from: ctx.accounts.locker.to_account_info(),
            to: ctx.accounts.lock_account.to_account_info(),
        };
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                transfer_instruction,
            ),
            amount,
        )?;

        // Initialize lock account
        let lock_account = &mut ctx.accounts.lock_account;
        lock_account.locker = ctx.accounts.locker.key();
        lock_account.token_mint = Pubkey::default(); // SOL represented by default pubkey
        lock_account.locked_amount = amount;
        lock_account.unlock_time = unlock_time;
        lock_account.creation_time = clock.unix_timestamp as u64;
        lock_account.seed = seed;

        Ok(())
    }

    // Withdraw SPL tokens
    pub fn withdraw_tokens(ctx: Context<WithdrawTokens>) -> Result<()> {
        let clock = Clock::get()?;
        let lock_account = &mut ctx.accounts.lock_account;
        require!(clock.unix_timestamp as u64 >= lock_account.unlock_time, ErrorCode::LockNotExpired);
        require!(lock_account.locker == ctx.accounts.locker.key(), ErrorCode::UnauthorizedLocker);
        require!(lock_account.locked_amount > 0, ErrorCode::NoTokensToWithdraw);

        let amount = lock_account.locked_amount;
        lock_account.locked_amount = 0;

        // Bind temporary values to extend their lifetime
        let locker_key = ctx.accounts.locker.key();
        let token_mint = ctx.accounts.lock_account.token_mint;
        let seed = lock_account.seed;
        let bump = ctx.bumps.lock_account;

        let seeds = &[
            b"TokenLockInfo",
            locker_key.as_ref(),
            token_mint.as_ref(),
            &seed.to_le_bytes(),
            &[bump],
        ];
        let signer_seeds = &[&seeds[..]];
        let token_transfer = Transfer {
            from: ctx.accounts.lock_token_account.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.lock_account.to_account_info(),
        };
        let token_cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token_transfer,
            signer_seeds,
        );
        token::transfer(token_cpi_ctx, amount)?;

        Ok(())
    }

    // Withdraw native SOL
    pub fn withdraw_native_tokens(ctx: Context<WithdrawNativeTokens>) -> Result<()> {
        let clock = Clock::get()?;
        let lock_account = &mut ctx.accounts.lock_account;
        require!(
            clock.unix_timestamp as u64 >= lock_account.unlock_time,
            ErrorCode::LockNotExpired
        );
        require!(lock_account.locker == ctx.accounts.locker.key(), ErrorCode::UnauthorizedLocker);
        require!(lock_account.locked_amount > 0, ErrorCode::NoTokensToWithdraw);

        let amount = lock_account.locked_amount;
        lock_account.locked_amount = 0;

        // Instead of using system program transfer (which doesn't work for PDAs with data),
        // directly transfer lamports from the lock account to the locker
        let lock_account_info = ctx.accounts.lock_account.to_account_info();
        let locker_info = ctx.accounts.locker.to_account_info();

        // Safety check to ensure we have enough lamports
        require!(
            **lock_account_info.lamports.borrow() >= amount,
            ErrorCode::NoTokensToWithdraw
        );

        // Transfer lamports directly by modifying the lamports fields
        // This is the recommended way to transfer SOL from a PDA that contains data
        **lock_account_info.lamports.borrow_mut() = lock_account_info.lamports()
            .checked_sub(amount)
            .ok_or(ErrorCode::NoTokensToWithdraw)?;

        **locker_info.lamports.borrow_mut() = locker_info.lamports()
            .checked_add(amount)
            .ok_or(ErrorCode::NoTokensToWithdraw)?;

        Ok(())
    }

    // Extend lock time
    pub fn extend_lock_time(ctx: Context<ExtendLockTime>, new_unlock_time: u64) -> Result<()> {
        let lock_account = &mut ctx.accounts.lock_account;
        require!(lock_account.locker == ctx.accounts.locker.key(), ErrorCode::OnlyLockerCanExtend);
        require!(new_unlock_time > lock_account.unlock_time, ErrorCode::NewUnlockTimeMustBeGreater);
        let clock = Clock::get()?;
        require!(new_unlock_time > clock.unix_timestamp as u64, ErrorCode::NewUnlockTimeMustBeInFuture);

        lock_account.unlock_time = new_unlock_time;
        Ok(())
    }

    // Withdraw collected fees (owner only)
    pub fn withdraw_fees(ctx: Context<WithdrawFees>) -> Result<()> {
        require!(ctx.accounts.owner.key() == ctx.accounts.config.owner, ErrorCode::UnauthorizedOwner);
        require!(ctx.accounts.config.collected_fees > 0, ErrorCode::NoFeesToWithdraw);

        let amount = ctx.accounts.config.collected_fees;
        ctx.accounts.config.collected_fees = 0;

        let fee_transfer = Transfer {
            from: ctx.accounts.program_usdc_account.to_account_info(),
            to: ctx.accounts.owner_usdc_account.to_account_info(),
            authority: ctx.accounts.config.to_account_info(),
        };

        let bump = ctx.bumps.config;
        let seeds = &[b"OwnerConfig".as_ref(), &[bump]];
        let signer_seeds = &[&seeds[..]];

        let fee_cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            fee_transfer,
            signer_seeds,
        );
        token::transfer(fee_cpi_ctx, amount)?;

        Ok(())
    }

    // Update USDC mint (owner only)
    pub fn update_usdc_mint(ctx: Context<UpdateUsdcMint>, new_usdc_mint: Pubkey) -> Result<()> {
        require!(ctx.accounts.owner.key() == ctx.accounts.config.owner, ErrorCode::OnlyOwnerCanUpdate);
        require!(new_usdc_mint != Pubkey::default(), ErrorCode::InvalidUsdcMint);

        ctx.accounts.config.usdc_mint = new_usdc_mint;
        Ok(())
    }

    pub fn initialize_config(ctx: Context<InitializeConfig>, usdc_mint: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.owner = ctx.accounts.owner.key();
        config.usdc_mint = usdc_mint;
        config.collected_fees = 0;
        Ok(())
    }

    pub fn initialize_usdc_account(_ctx: Context<InitializeUsdcAccount>) -> Result<()> {
        // The ATA will be created automatically by Anchor
        Ok(())
    }
}

// Account structs
#[account]
pub struct OwnerConfig {
    pub owner: Pubkey,
    pub usdc_mint: Pubkey,
    pub collected_fees: u64,
}

#[account]
pub struct TokenLockInfo {
    pub locker: Pubkey,
    pub token_mint: Pubkey,
    pub locked_amount: u64,
    pub unlock_time: u64,
    pub creation_time: u64,
    pub seed: u64,
}

// Contexts
#[derive(Accounts)]
#[instruction(amount: u64, unlock_time: u64, seed: u64)]
pub struct LockTokens<'info> {
    #[account(mut)]
    pub locker: Signer<'info>,
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub usdc_account: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = locker,
        space = 8 + 32 + 32 + 8 + 8 + 8 + 8, // Added 8 bytes for seed
        seeds = [
            b"TokenLockInfo", 
            locker.key().as_ref(), 
            token_account.mint.as_ref(),
            &seed.to_le_bytes()
        ],
        bump
    )]
    pub lock_account: Account<'info, TokenLockInfo>,
    #[account(
        init_if_needed,
        payer = locker,
        associated_token::mint = token_account.mint,
        associated_token::authority = lock_account
    )]
    pub lock_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub program_usdc_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub config: Account<'info, OwnerConfig>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(amount: u64, unlock_time: u64, seed: u64)]
pub struct LockNativeTokens<'info> {
    #[account(mut)]
    pub locker: Signer<'info>,
    #[account(mut)]
    pub usdc_account: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = locker,
        space = 8 + 32 + 32 + 8 + 8 + 8 + 8, // Added 8 bytes for seed
        seeds = [
            b"TokenLockInfo", 
            locker.key().as_ref(), 
            Pubkey::default().as_ref(),
            &seed.to_le_bytes()
        ],
        bump
    )]
    pub lock_account: Account<'info, TokenLockInfo>,
    #[account(mut)]
    pub program_usdc_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub config: Account<'info, OwnerConfig>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct WithdrawTokens<'info> {
    #[account(mut)]
    pub locker: Signer<'info>,
    #[account(
        mut,
        seeds = [
            b"TokenLockInfo", 
            locker.key().as_ref(), 
            lock_account.token_mint.as_ref(),
            &lock_account.seed.to_le_bytes()
        ],
        bump
    )]
    pub lock_account: Account<'info, TokenLockInfo>,
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = lock_account.token_mint,
        associated_token::authority = lock_account
    )]
    pub lock_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawNativeTokens<'info> {
    #[account(mut)]
    pub locker: Signer<'info>,
    #[account(
        mut,
        seeds = [
            b"TokenLockInfo", 
            locker.key().as_ref(), 
            Pubkey::default().as_ref(),
            &lock_account.seed.to_le_bytes()
        ],
        bump
    )]
    pub lock_account: Account<'info, TokenLockInfo>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExtendLockTime<'info> {
    #[account(mut)]
    pub locker: Signer<'info>,
    #[account(
        mut,
        seeds = [
            b"TokenLockInfo", 
            locker.key().as_ref(), 
            lock_account.token_mint.as_ref(),
            &lock_account.seed.to_le_bytes()
        ],
        bump
    )]
    pub lock_account: Account<'info, TokenLockInfo>,
}

#[derive(Accounts)]
pub struct WithdrawFees<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        mut,
        seeds = [b"OwnerConfig"],
        bump
    )]
    pub config: Account<'info, OwnerConfig>,
    #[account(mut)]
    pub program_usdc_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub owner_usdc_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdateUsdcMint<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        mut,
        seeds = [b"OwnerConfig"],
        bump
    )]
    pub config: Account<'info, OwnerConfig>,
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 32 + 8,
        seeds = [b"OwnerConfig"],
        bump
    )]
    pub config: Account<'info, OwnerConfig>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct InitializeUsdcAccount<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        mut,
        seeds = [b"OwnerConfig"],
        bump
    )]
    pub config: Account<'info, OwnerConfig>,
    #[account(
        init,
        payer = owner,
        associated_token::mint = usdc_mint,
        associated_token::authority = config
    )]
    pub program_usdc_account: Account<'info, TokenAccount>,
    pub usdc_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

// Error codes
#[error_code]
pub enum ErrorCode {
    #[msg("Unlock time must be in the future")]
    InvalidUnlockTime,
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Lock period not yet ended")]
    LockNotExpired,
    #[msg("Only locker can withdraw")]
    UnauthorizedLocker,
    #[msg("No tokens to withdraw")]
    NoTokensToWithdraw,
    #[msg("Only owner can withdraw fees")]
    UnauthorizedOwner,
    #[msg("No fees to withdraw")]
    NoFeesToWithdraw,
    #[msg("Invalid USDC mint")]
    InvalidUsdcMint,
    #[msg("Only locker can extend")]
    OnlyLockerCanExtend,
    #[msg("New unlock time must be greater")]
    NewUnlockTimeMustBeGreater,
    #[msg("New unlock time must be in future")]
    NewUnlockTimeMustBeInFuture,
    #[msg("Only owner can update")]
    OnlyOwnerCanUpdate,
}
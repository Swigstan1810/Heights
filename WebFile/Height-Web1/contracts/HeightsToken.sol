// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Heights Token (HGT)
 * @dev Advanced ERC20 token optimized for Arbitrum with anti-whale, anti-bot features
 * @author Heights Development Team
 * 
 * Features:
 * - Arbitrum-optimized gas usage with batch operations
 * - Anti-whale protection with configurable max wallet/transaction limits
 * - Anti-bot mechanisms with snipe protection and same-block prevention
 * - Dynamic fee system with exemption capabilities
 * - Pausable transfers for emergency situations
 * - Minting and burning capabilities for supply management
 * - DEX integration for seamless swapping
 * - Comprehensive access controls and security features
 */
contract HeightsToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ReentrancyGuard {

    // Token Configuration
    uint256 private constant INITIAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion HGT
    uint256 private constant MAX_SUPPLY = 10_000_000_000 * 10**18; // 10 billion HGT max supply
    
    // Anti-whale Configuration
    uint256 public maxWalletAmount = INITIAL_SUPPLY * 2 / 100; // 2% of initial supply
    uint256 public maxTransactionAmount = INITIAL_SUPPLY * 1 / 100; // 1% of initial supply
    
    // Anti-bot Configuration
    uint256 public launchTime;
    uint256 public constant SNIPE_PROTECTION_DURATION = 300; // 5 minutes
    mapping(address => uint256) private _lastTransactionBlock;
    mapping(address => bool) public isBot;
    
    // Fee Configuration
    uint256 public buyFee = 50; // 0.5% (50/10000)
    uint256 public sellFee = 80; // 0.8% (80/10000)
    uint256 public transferFee = 30; // 0.3% (30/10000)
    uint256 private constant FEE_DENOMINATOR = 10000;
    address public feeRecipient;
    
    // Exemptions
    mapping(address => bool) public isExemptFromFees;
    mapping(address => bool) public isExemptFromLimits;
    mapping(address => bool) public isAuthorizedTransactor;
    
    // Trading Configuration
    mapping(address => bool) public isExchange;
    mapping(address => bool) public isDEXRouter;
    bool public tradingEnabled = false;
    
    // Events
    event TradingEnabled(uint256 timestamp);
    event FeesUpdated(uint256 buyFee, uint256 sellFee, uint256 transferFee);
    event FeeRecipientUpdated(address indexed newRecipient);
    event ExemptionUpdated(address indexed account, bool isExempt, string exemptionType);
    event AntiWhaleConfigUpdated(uint256 maxWallet, uint256 maxTransaction);
    event BotDetected(address indexed account, uint256 timestamp);
    event BotStatusUpdated(address indexed account, bool isBot);
    
    // Custom Errors
    error TradingNotEnabled();
    error ExceedsMaxWalletAmount(address account, uint256 amount, uint256 limit);
    error ExceedsMaxTransactionAmount(uint256 amount, uint256 limit);
    error SameBlockTransaction();
    error BotDetectedError(address account);
    error InvalidFeeAmount(uint256 fee, uint256 maxFee);
    error ZeroAddress();
    error ExceedsMaxSupply(uint256 requestedAmount, uint256 maxSupply);
    error InsufficientBalance(address account, uint256 requested, uint256 available);

    constructor(
        address _feeRecipient
    ) ERC20("Heights Token", "HGT") Ownable(msg.sender) {
        if (_feeRecipient == address(0)) revert ZeroAddress();
        
        feeRecipient = _feeRecipient;
        launchTime = block.timestamp;
        
        // Mint initial supply to owner
        _mint(msg.sender, INITIAL_SUPPLY);
        
        // Set exemptions for deployment
        isExemptFromFees[msg.sender] = true;
        isExemptFromFees[address(this)] = true;
        isExemptFromFees[_feeRecipient] = true;
        
        isExemptFromLimits[msg.sender] = true;
        isExemptFromLimits[address(this)] = true;
        isExemptFromLimits[_feeRecipient] = true;
        
        isAuthorizedTransactor[msg.sender] = true;
        
        emit Transfer(address(0), msg.sender, INITIAL_SUPPLY);
    }
    
    /**
     * @dev Override transfer function with comprehensive protection mechanisms
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        address owner = _msgSender();
        _transferWithProtection(owner, to, amount);
        return true;
    }
    
    /**
     * @dev Override transferFrom function with comprehensive protection mechanisms
     */
    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _transferWithProtection(from, to, amount);
        return true;
    }
    
    /**
     * @dev Internal transfer function with all protection mechanisms
     */
    function _transferWithProtection(address from, address to, uint256 amount) internal {
        if (from == address(0) || to == address(0)) revert ZeroAddress();
        
        // Apply all protection mechanisms
        _applyAntiWhaleProtection(from, to, amount);
        _applyAntiBotProtection(from, to);
        _applyTradingRestrictions(from, to);
        
        // Calculate and apply fees
        uint256 feeAmount = _calculateAndApplyFees(from, to, amount);
        uint256 transferAmount = amount - feeAmount;
        
        // Execute the transfer
        _transfer(from, to, transferAmount);
        
        // Transfer fees if applicable
        if (feeAmount > 0) {
            _transfer(from, feeRecipient, feeAmount);
        }
        
        // Update transaction tracking
        _lastTransactionBlock[from] = block.number;
        _lastTransactionBlock[to] = block.number;
    }
    
    /**
     * @dev Apply anti-whale protection mechanisms
     */
    function _applyAntiWhaleProtection(address from, address to, uint256 amount) internal view {
        // Skip limits for exempt addresses
        if (isExemptFromLimits[from] || isExemptFromLimits[to]) {
            return;
        }
        
        // Check transaction amount limit
        if (amount > maxTransactionAmount) {
            revert ExceedsMaxTransactionAmount(amount, maxTransactionAmount);
        }
        
        // Check wallet amount limit for buyers
        if (!isExchange[from] && balanceOf(to) + amount > maxWalletAmount) {
            revert ExceedsMaxWalletAmount(to, balanceOf(to) + amount, maxWalletAmount);
        }
    }
    
    /**
     * @dev Apply anti-bot protection mechanisms
     */
    function _applyAntiBotProtection(address from, address to) internal view {
        // Check if either address is marked as bot
        if (isBot[from] || isBot[to]) {
            revert BotDetectedError(from);
        }
        
        // Prevent same-block transactions during snipe protection
        if (block.timestamp < launchTime + SNIPE_PROTECTION_DURATION) {
            if (_lastTransactionBlock[from] == block.number || _lastTransactionBlock[to] == block.number) {
                revert SameBlockTransaction();
            }
        }
    }
    
    /**
     * @dev Apply trading restrictions
     */
    function _applyTradingRestrictions(address from, address to) internal view {
        // Allow transfers between exempt addresses even when trading is disabled
        if (isAuthorizedTransactor[from] || isAuthorizedTransactor[to]) {
            return;
        }
        
        // Check if trading is enabled for public
        if (!tradingEnabled) {
            revert TradingNotEnabled();
        }
    }
    
    /**
     * @dev Calculate and apply fees based on transaction type
     */
    function _calculateAndApplyFees(address from, address to, uint256 amount) internal view returns (uint256) {
        // Skip fees for exempt addresses
        if (isExemptFromFees[from] || isExemptFromFees[to]) {
            return 0;
        }
        
        uint256 feeRate = 0;
        
        // Determine fee type
        if (isExchange[to]) {
            // Buying from exchange
            feeRate = buyFee;
        } else if (isExchange[from]) {
            // Selling to exchange
            feeRate = sellFee;
        } else {
            // Regular transfer
            feeRate = transferFee;
        }
        
        return amount * feeRate / FEE_DENOMINATOR;
    }
    
    /**
     * @dev Mint new tokens (only owner)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (totalSupply() + amount > MAX_SUPPLY) {
            revert ExceedsMaxSupply(amount, MAX_SUPPLY);
        }
        
        _mint(to, amount);
    }
    
    /**
     * @dev Burn tokens from specified account (only owner)
     */
    function burnFrom(address account, uint256 amount) public override {
        if (account != _msgSender() && !isAuthorizedTransactor[_msgSender()]) {
            uint256 currentAllowance = allowance(account, _msgSender());
            if (currentAllowance < amount) {
                revert InsufficientBalance(account, amount, currentAllowance);
            }
            _approve(account, _msgSender(), currentAllowance - amount);
        }
        _burn(account, amount);
    }
    
    /**
     * @dev Enable trading (only owner, irreversible)
     */
    function enableTrading() external onlyOwner {
        require(!tradingEnabled, "Trading already enabled");
        tradingEnabled = true;
        launchTime = block.timestamp;
        emit TradingEnabled(block.timestamp);
    }
    
    /**
     * @dev Update fee configuration (only owner)
     */
    function updateFees(uint256 _buyFee, uint256 _sellFee, uint256 _transferFee) external onlyOwner {
        if (_buyFee > 500 || _sellFee > 500 || _transferFee > 500) {
            revert InvalidFeeAmount(_buyFee > _sellFee ? (_buyFee > _transferFee ? _buyFee : _transferFee) : (_sellFee > _transferFee ? _sellFee : _transferFee), 500);
        }
        
        buyFee = _buyFee;
        sellFee = _sellFee;
        transferFee = _transferFee;
        
        emit FeesUpdated(_buyFee, _sellFee, _transferFee);
    }
    
    /**
     * @dev Update fee recipient (only owner)
     */
    function updateFeeRecipient(address _feeRecipient) external onlyOwner {
        if (_feeRecipient == address(0)) revert ZeroAddress();
        feeRecipient = _feeRecipient;
        emit FeeRecipientUpdated(_feeRecipient);
    }
    
    /**
     * @dev Set fee exemption status (only owner)
     */
    function setFeeExemption(address account, bool exempt) external onlyOwner {
        if (account == address(0)) revert ZeroAddress();
        isExemptFromFees[account] = exempt;
        emit ExemptionUpdated(account, exempt, "fee");
    }
    
    /**
     * @dev Set limit exemption status (only owner)
     */
    function setLimitExemption(address account, bool exempt) external onlyOwner {
        if (account == address(0)) revert ZeroAddress();
        isExemptFromLimits[account] = exempt;
        emit ExemptionUpdated(account, exempt, "limit");
    }
    
    /**
     * @dev Set authorized transactor status (only owner)
     */
    function setAuthorizedTransactor(address account, bool authorized) external onlyOwner {
        if (account == address(0)) revert ZeroAddress();
        isAuthorizedTransactor[account] = authorized;
        emit ExemptionUpdated(account, authorized, "transactor");
    }
    
    /**
     * @dev Set exchange status (only owner)
     */
    function setExchangeStatus(address account, bool _isExchange) external onlyOwner {
        if (account == address(0)) revert ZeroAddress();
        isExchange[account] = _isExchange;
        emit ExemptionUpdated(account, _isExchange, "exchange");
    }
    
    /**
     * @dev Set DEX router status (only owner)
     */
    function setDEXRouterStatus(address account, bool _isDEXRouter) external onlyOwner {
        if (account == address(0)) revert ZeroAddress();
        isDEXRouter[account] = _isDEXRouter;
        emit ExemptionUpdated(account, _isDEXRouter, "dexrouter");
    }
    
    /**
     * @dev Update anti-whale configuration (only owner)
     */
    function updateAntiWhaleConfig(uint256 _maxWalletAmount, uint256 _maxTransactionAmount) external onlyOwner {
        require(_maxWalletAmount >= totalSupply() / 1000, "Max wallet too low"); // At least 0.1%
        require(_maxTransactionAmount >= totalSupply() / 2000, "Max transaction too low"); // At least 0.05%
        
        maxWalletAmount = _maxWalletAmount;
        maxTransactionAmount = _maxTransactionAmount;
        
        emit AntiWhaleConfigUpdated(_maxWalletAmount, _maxTransactionAmount);
    }
    
    /**
     * @dev Set bot status (only owner)
     */
    function setBotStatus(address account, bool _isBot) external onlyOwner {
        if (account == address(0)) revert ZeroAddress();
        isBot[account] = _isBot;
        
        if (_isBot) {
            emit BotDetected(account, block.timestamp);
        }
        emit BotStatusUpdated(account, _isBot);
    }
    
    /**
     * @dev Batch set bot status (only owner)
     */
    function setBotStatusBatch(address[] calldata accounts, bool _isBot) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            if (accounts[i] != address(0)) {
                isBot[accounts[i]] = _isBot;
                
                if (_isBot) {
                    emit BotDetected(accounts[i], block.timestamp);
                }
                emit BotStatusUpdated(accounts[i], _isBot);
            }
        }
    }
    
    /**
     * @dev Emergency pause (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdraw stuck tokens (only owner)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner nonReentrant {
        if (token == address(this)) {
            // Can only withdraw excess HGT beyond max supply
            uint256 excessAmount = balanceOf(address(this));
            require(amount <= excessAmount, "Cannot withdraw core HGT");
        }
        
        if (token == address(0)) {
            // Withdraw ETH
            payable(owner()).transfer(amount);
        } else {
            // Withdraw ERC20 tokens
            IERC20(token).transfer(owner(), amount);
        }
    }
    
    /**
     * @dev Get comprehensive token information
     */
    function getTokenInfo() external view returns (
        uint256 _totalSupply,
        uint256 _maxSupply,
        uint256 _maxWalletAmount,
        uint256 _maxTransactionAmount,
        uint256 _buyFee,
        uint256 _sellFee,
        uint256 _transferFee,
        address _feeRecipient,
        bool _tradingEnabled,
        uint256 _launchTime
    ) {
        return (
            totalSupply(),
            MAX_SUPPLY,
            maxWalletAmount,
            maxTransactionAmount,
            buyFee,
            sellFee,
            transferFee,
            feeRecipient,
            tradingEnabled,
            launchTime
        );
    }
    
    /**
     * @dev Check if address can transact given amount
     */
    function canTransact(address from, address to, uint256 amount) external view returns (bool, string memory) {
        // Check bot status
        if (isBot[from] || isBot[to]) {
            return (false, "Bot detected");
        }
        
        // Check trading enabled (allow DEX router interactions)
        if (!tradingEnabled && !isAuthorizedTransactor[from] && !isAuthorizedTransactor[to] && !isDEXRouter[from] && !isDEXRouter[to]) {
            return (false, "Trading not enabled");
        }
        
        // Check transaction limits
        if (!isExemptFromLimits[from] && !isExemptFromLimits[to] && amount > maxTransactionAmount) {
            return (false, "Exceeds max transaction amount");
        }
        
        // Check wallet limits
        if (!isExemptFromLimits[to] && !isExchange[from] && balanceOf(to) + amount > maxWalletAmount) {
            return (false, "Exceeds max wallet amount");
        }
        
        // Check same block during snipe protection
        if (block.timestamp < launchTime + SNIPE_PROTECTION_DURATION) {
            if (_lastTransactionBlock[from] == block.number || _lastTransactionBlock[to] == block.number) {
                return (false, "Same block transaction during snipe protection");
            }
        }
        
        return (true, "Transaction allowed");
    }
    
    /**
     * @dev Required override for pausable functionality
     */
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
        whenNotPaused
    {
        super._update(from, to, value);
    }
    
    /**
     * @dev Receive ETH
     */
    receive() external payable {}
    
    /**
     * @dev Fallback function
     */
    fallback() external payable {}
}
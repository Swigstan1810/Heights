// test/HeightsToken.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HeightsToken", function () {
  let heightsToken;
  let owner;
  let feeRecipient;
  let user1;
  let user2;
  let user3;
  
  const INITIAL_SUPPLY = ethers.utils.parseEther("1000000000"); // 1B tokens
  
  beforeEach(async function () {
    [owner, feeRecipient, user1, user2, user3] = await ethers.getSigners();
    
    const HeightsToken = await ethers.getContractFactory("HeightsToken");
    heightsToken = await HeightsToken.deploy(INITIAL_SUPPLY, feeRecipient.address);
    await heightsToken.deployed();
  });
  
  describe("Deployment", function () {
    it("Should set the correct token name and symbol", async function () {
      expect(await heightsToken.name()).to.equal("Heights Token");
      expect(await heightsToken.symbol()).to.equal("HGT");
    });
    
    it("Should mint initial supply to owner", async function () {
      expect(await heightsToken.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
    });
    
    it("Should set correct max wallet and transaction amounts", async function () {
      const maxWallet = await heightsToken.maxWalletAmount();
      const maxTx = await heightsToken.maxTransactionAmount();
      
      expect(maxWallet).to.equal(INITIAL_SUPPLY.mul(2).div(100)); // 2%
      expect(maxTx).to.equal(INITIAL_SUPPLY.mul(1).div(100)); // 1%
    });
    
    it("Should set owner as exempt from fees and limits", async function () {
      expect(await heightsToken.isExemptFromFees(owner.address)).to.be.true;
      expect(await heightsToken.isExemptFromLimits(owner.address)).to.be.true;
    });
  });
  
  describe("Trading", function () {
    it("Should prevent transfers before trading is enabled", async function () {
      await expect(
        heightsToken.connect(user1).transfer(user2.address, ethers.utils.parseEther("100"))
      ).to.be.revertedWith("Trading not enabled");
    });
    
    it("Should allow owner to enable trading", async function () {
      await heightsToken.enableTrading();
      expect(await heightsToken.tradingEnabledTimestamp()).to.be.gt(0);
    });
    
    it("Should prevent enabling trading twice", async function () {
      await heightsToken.enableTrading();
      await expect(heightsToken.enableTrading()).to.be.revertedWith("Trading already enabled");
    });
  });
  
  describe("Anti-Whale", function () {
    beforeEach(async function () {
      await heightsToken.enableTrading();
      // Transfer some tokens to user1 for testing
      await heightsToken.transfer(user1.address, ethers.utils.parseEther("5000000")); // 0.5%
    });
    
    it("Should prevent transfers exceeding max transaction amount", async function () {
      const maxTx = await heightsToken.maxTransactionAmount();
      const tooMuch = maxTx.add(1);
      
      await expect(
        heightsToken.connect(user1).transfer(user2.address, tooMuch)
      ).to.be.revertedWith("Exceeds max transaction");
    });
    
    it("Should prevent wallet from exceeding max wallet amount", async function () {
      const maxWallet = await heightsToken.maxWalletAmount();
      
      await expect(
        heightsToken.transfer(user1.address, maxWallet)
      ).to.be.revertedWith("Exceeds max wallet");
    });
    
    it("Should allow owner to update max amounts", async function () {
      const newMaxWallet = ethers.utils.parseEther("50000000"); // 5%
      await heightsToken.updateMaxWalletAmount(newMaxWallet);
      expect(await heightsToken.maxWalletAmount()).to.equal(newMaxWallet);
    });
  });
  
  describe("Anti-Bot", function () {
    beforeEach(async function () {
      await heightsToken.enableTrading();
      await heightsToken.transfer(user1.address, ethers.utils.parseEther("1000000"));
    });
    
    it("Should prevent same block transactions", async function () {
      // Disable auto-mining for this test
      await network.provider.send("evm_setAutomine", [false]);
      
      // Send two transactions in same block
      const tx1 = heightsToken.connect(user1).transfer(user2.address, ethers.utils.parseEther("100"));
      const tx2 = heightsToken.connect(user1).transfer(user3.address, ethers.utils.parseEther("100"));
      
      // Mine the block
      await network.provider.send("evm_mine");
      
      // First should succeed, second should fail
      await expect(tx1).to.not.be.reverted;
      await expect(tx2).to.be.revertedWith("Cannot perform multiple transactions in same block");
      
      // Re-enable auto-mining
      await network.provider.send("evm_setAutomine", [true]);
    });
    
    it("Should blacklist snipers in anti-snipe period", async function () {
      // Deploy new token to test anti-snipe
      const HeightsToken = await ethers.getContractFactory("HeightsToken");
      const newToken = await HeightsToken.deploy(INITIAL_SUPPLY, feeRecipient.address);
      await newToken.deployed();
      
      // Transfer tokens to user1 (exempt as owner)
      await newToken.transfer(user1.address, ethers.utils.parseEther("1000"));
      
      // Enable trading
      await newToken.enableTrading();
      
      // Try to trade in first block (should blacklist)
      await expect(
        newToken.connect(user1).transfer(user2.address, ethers.utils.parseEther("100"))
      ).to.be.revertedWith("Anti-snipe protection");
      
      expect(await newToken.isBlacklisted(user1.address)).to.be.true;
      expect(await newToken.isBlacklisted(user2.address)).to.be.true;
    });
  });
  
  describe("Fees", function () {
    beforeEach(async function () {
      await heightsToken.enableTrading();
      await heightsToken.updateTransferFee(100); // 1% fee
      await heightsToken.transfer(user1.address, ethers.utils.parseEther("1000000"));
    });
    
    it("Should charge transfer fee correctly", async function () {
      const amount = ethers.utils.parseEther("1000");
      const fee = amount.mul(100).div(10000); // 1%
      const netAmount = amount.sub(fee);
      
      const feeRecipientBalanceBefore = await heightsToken.balanceOf(feeRecipient.address);
      
      await heightsToken.connect(user1).transfer(user2.address, amount);
      
      expect(await heightsToken.balanceOf(user2.address)).to.equal(netAmount);
      expect(await heightsToken.balanceOf(feeRecipient.address)).to.equal(
        feeRecipientBalanceBefore.add(fee)
      );
    });
    
    it("Should not charge fees to exempt addresses", async function () {
      await heightsToken.updateExemptions(user1.address, true, false);
      
      const amount = ethers.utils.parseEther("1000");
      await heightsToken.connect(user1).transfer(user2.address, amount);
      
      expect(await heightsToken.balanceOf(user2.address)).to.equal(amount);
    });
    
    it("Should prevent setting fee too high", async function () {
      await expect(
        heightsToken.updateTransferFee(501) // 5.01%
      ).to.be.revertedWith("Fee too high");
    });
  });
  
  describe("Blacklist", function () {
    it("Should allow owner to blacklist addresses", async function () {
      await heightsToken.updateBlacklist(user1.address, true);
      expect(await heightsToken.isBlacklisted(user1.address)).to.be.true;
    });
    
    it("Should prevent blacklisted addresses from transferring", async function () {
      await heightsToken.enableTrading();
      await heightsToken.transfer(user1.address, ethers.utils.parseEther("1000"));
      await heightsToken.updateBlacklist(user1.address, true);
      
      await expect(
        heightsToken.connect(user1).transfer(user2.address, ethers.utils.parseEther("100"))
      ).to.be.revertedWith("Sender blacklisted");
    });
    
    it("Should prevent transfers to blacklisted addresses", async function () {
      await heightsToken.enableTrading();
      await heightsToken.updateBlacklist(user2.address, true);
      
      await expect(
        heightsToken.transfer(user2.address, ethers.utils.parseEther("100"))
      ).to.be.revertedWith("Recipient blacklisted");
    });
    
    it("Should allow batch blacklist updates", async function () {
      await heightsToken.updateBlacklistBatch([user1.address, user2.address], true);
      expect(await heightsToken.isBlacklisted(user1.address)).to.be.true;
      expect(await heightsToken.isBlacklisted(user2.address)).to.be.true;
    });
  });
  
  describe("Pausable", function () {
    it("Should allow owner to pause transfers", async function () {
      await heightsToken.pause();
      await expect(
        heightsToken.transfer(user1.address, ethers.utils.parseEther("100"))
      ).to.be.revertedWith("Pausable: paused");
    });
    
    it("Should allow owner to unpause transfers", async function () {
      await heightsToken.pause();
      await heightsToken.unpause();
      
      await expect(
        heightsToken.transfer(user1.address, ethers.utils.parseEther("100"))
      ).to.not.be.reverted;
    });
  });
  
  describe("Admin Functions", function () {
    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.utils.parseEther("1000000");
      await heightsToken.mint(user1.address, mintAmount);
      expect(await heightsToken.balanceOf(user1.address)).to.equal(mintAmount);
    });
    
    it("Should allow token burning", async function () {
      await heightsToken.transfer(user1.address, ethers.utils.parseEther("1000"));
      const burnAmount = ethers.utils.parseEther("500");
      
      await heightsToken.connect(user1).burn(burnAmount);
      expect(await heightsToken.balanceOf(user1.address)).to.equal(
        ethers.utils.parseEther("500")
      );
    });
    
    it("Should allow owner to recover stuck tokens", async function () {
      // Send ETH to contract
      await owner.sendTransaction({
        to: heightsToken.address,
        value: ethers.utils.parseEther("1"),
      });
      
      const balanceBefore = await owner.getBalance();
      await heightsToken.recoverToken(ethers.constants.AddressZero, ethers.utils.parseEther("1"));
      const balanceAfter = await owner.getBalance();
      
      expect(balanceAfter).to.be.gt(balanceBefore);
    });
  });
  
  describe("AMM Integration", function () {
    it("Should allow setting AMM pairs", async function () {
      const ammPair = user3.address; // Mock AMM pair
      await heightsToken.setAutomatedMarketMaker(ammPair, true);
      expect(await heightsToken.isAutomatedMarketMaker(ammPair)).to.be.true;
    });
    
    it("Should not apply max wallet to AMM when selling", async function () {
      await heightsToken.enableTrading();
      
      // Set user3 as AMM
      await heightsToken.setAutomatedMarketMaker(user3.address, true);
      
      // Transfer max wallet amount to user3 (AMM)
      const maxWallet = await heightsToken.maxWalletAmount();
      await heightsToken.transfer(user3.address, maxWallet);
      
      // Should allow more tokens when selling to AMM
      await heightsToken.transfer(user1.address, ethers.utils.parseEther("5000000"));
      await expect(
        heightsToken.connect(user1).transfer(user3.address, ethers.utils.parseEther("5000000"))
      ).to.not.be.reverted;
    });
  });
  
  describe("Gas Optimization", function () {
    it("Should have reasonable gas costs for transfers", async function () {
      await heightsToken.enableTrading();
      await heightsToken.transfer(user1.address, ethers.utils.parseEther("1000000"));
      
      const tx = await heightsToken.connect(user1).transfer(
        user2.address, 
        ethers.utils.parseEther("1000")
      );
      const receipt = await tx.wait();
      
      // Gas should be under 100k for a simple transfer
      expect(receipt.gasUsed).to.be.lt(100000);
    });
  });
});
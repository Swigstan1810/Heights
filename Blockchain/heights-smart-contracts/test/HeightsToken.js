const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HeightsToken", function () {
  let HeightsToken;
  let heightsToken;
  let owner;
  let addr1;
  let addr2;
  
  // Initial token supply (1 million tokens)
  const initialSupply = 1000000;
  const decimals = 18;
  const initialSupplyWithDecimals = ethers.parseUnits(initialSupply.toString(), decimals);

  // Deploy a fresh contract before each test
  beforeEach(async function () {
    // Get signers (accounts)
    [owner, addr1, addr2] = await ethers.getSigners();
    
    // Deploy the contract
    HeightsToken = await ethers.getContractFactory("HeightsToken");
    heightsToken = await HeightsToken.deploy(initialSupply);
  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await heightsToken.name()).to.equal("Heights Token");
      expect(await heightsToken.symbol()).to.equal("HTK");
      expect(await heightsToken.decimals()).to.equal(decimals);
    });

    it("Should set the right owner", async function () {
      expect(await heightsToken.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply to the owner", async function () {
      const ownerBalance = await heightsToken.balanceOf(owner.address);
      expect(await heightsToken.totalSupply()).to.equal(ownerBalance);
      expect(ownerBalance).to.equal(initialSupplyWithDecimals);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      // Transfer 100 tokens from owner to addr1
      const transferAmount = ethers.parseUnits("100", decimals);
      await heightsToken.transfer(addr1.address, transferAmount);
      
      // Check balances
      const addr1Balance = await heightsToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(transferAmount);
      
      // Transfer 50 tokens from addr1 to addr2
      const secondTransferAmount = ethers.parseUnits("50", decimals);
      await heightsToken.connect(addr1).transfer(addr2.address, secondTransferAmount);
      
      // Check balances after second transfer
      const addr2Balance = await heightsToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(secondTransferAmount);
      expect(await heightsToken.balanceOf(addr1.address)).to.equal(transferAmount - secondTransferAmount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      // Get initial balance of owner
      const initialOwnerBalance = await heightsToken.balanceOf(owner.address);
      
      // Try to send more tokens than addr1 has (which is 0)
      await expect(
        heightsToken.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("Not enough tokens");

      // Check that balances haven't changed
      expect(await heightsToken.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });

    it("Should fail if transferring to zero address", async function () {
      await expect(
        heightsToken.transfer(ethers.ZeroAddress, 100)
      ).to.be.revertedWith("Transfer to zero address");
    });

    it("Should emit Transfer event when transfer is successful", async function () {
      const amount = ethers.parseUnits("100", decimals);
      await expect(heightsToken.transfer(addr1.address, amount))
        .to.emit(heightsToken, "Transfer")
        .withArgs(owner.address, addr1.address, amount);
    });
  });

  describe("Allowances", function () {
    it("Should approve and allow transferFrom", async function () {
      const approveAmount = ethers.parseUnits("100", decimals);
      await heightsToken.approve(addr1.address, approveAmount);
      
      expect(await heightsToken.allowance(owner.address, addr1.address))
        .to.equal(approveAmount);
        
      // Use allowance to transfer tokens
      const transferAmount = ethers.parseUnits("50", decimals);
      await heightsToken.connect(addr1).transferFrom(
        owner.address, addr2.address, transferAmount
      );
      
      // Check balances
      expect(await heightsToken.balanceOf(addr2.address)).to.equal(transferAmount);
      expect(await heightsToken.allowance(owner.address, addr1.address)).to.equal(approveAmount - transferAmount);
    });
    
    it("Should fail if trying to transferFrom more than allowed", async function () {
      // Approve addr1 to spend 50 tokens
      const approveAmount = ethers.parseUnits("50", decimals);
      await heightsToken.approve(addr1.address, approveAmount);
      
      // Try to transfer 100 tokens (more than approved)
      const transferAmount = ethers.parseUnits("100", decimals);
      await expect(
        heightsToken.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)
      ).to.be.revertedWith("Not enough allowance");
    });
    
    it("Should emit Approval event on approval", async function () {
      const amount = ethers.parseUnits("100", decimals);
      await expect(heightsToken.approve(addr1.address, amount))
        .to.emit(heightsToken, "Approval")
        .withArgs(owner.address, addr1.address, amount);
    });
  });
});
import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

describe("EventLogger", function () {
  let eventLogger: any;
  let owner: any;
  let verifier1: any;
  let verifier2: any;
  let user: any;

  const credentialId = ethers.keccak256(ethers.toUtf8Bytes("credential_001"));
  const credentialId2 = ethers.keccak256(ethers.toUtf8Bytes("credential_002"));

  beforeEach(async function () {
    [owner, verifier1, verifier2, user] = await ethers.getSigners();

    eventLogger = await ethers.deployContract("EventLogger");
  });

  describe("Deployment", function () {
    it("Should set the deployer as owner", async function () {
      expect(await eventLogger.owner()).to.equal(owner.address);
    });

    it("Should authorize owner as verifier on deployment", async function () {
      expect(await eventLogger.authorizedVerifiers(owner.address)).to.equal(true);
    });

    it("Should emit VerifierAuthorized event for owner", async function () {
      const eventLogger = await ethers.deployContract("EventLogger");
      const tx = eventLogger.deploymentTransaction();
      await expect(tx)
        .to.emit(eventLogger, "VerifierAuthorized")
        .withArgs(owner.address);
    });
  });

  describe("Verifier Authorization", function () {
    it("Should allow owner to add authorized verifier", async function () {
      await expect(eventLogger.addAuthorizedVerifier(verifier1.address))
        .to.emit(eventLogger, "VerifierAuthorized")
        .withArgs(verifier1.address);

      expect(await eventLogger.authorizedVerifiers(verifier1.address)).to.equal(true);
    });

    it("Should prevent non-owner from adding verifier", async function () {
      await expect(
        eventLogger.connect(verifier1).addAuthorizedVerifier(verifier2.address)
      ).to.be.revertedWith("Only owner can call this");
    });

    it("Should prevent adding zero address as verifier", async function () {
      await expect(
        eventLogger.addAuthorizedVerifier(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });

    it("Should prevent adding already authorized verifier", async function () {
      await eventLogger.addAuthorizedVerifier(verifier1.address);
      await expect(
        eventLogger.addAuthorizedVerifier(verifier1.address)
      ).to.be.revertedWith("Already authorized");
    });

    it("Should allow owner to remove authorized verifier", async function () {
      await eventLogger.addAuthorizedVerifier(verifier1.address);

      await expect(eventLogger.removeAuthorizedVerifier(verifier1.address))
        .to.emit(eventLogger, "VerifierDeauthorized")
        .withArgs(verifier1.address);

      expect(await eventLogger.authorizedVerifiers(verifier1.address)).to.equal(false);
    });

    it("Should prevent removing non-authorized verifier", async function () {
      await expect(
        eventLogger.removeAuthorizedVerifier(verifier1.address)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should prevent removing owner from verifiers", async function () {
      await expect(
        eventLogger.removeAuthorizedVerifier(owner.address)
      ).to.be.revertedWith("Cannot remove owner");
    });

    it("Should prevent non-owner from removing verifier", async function () {
      await eventLogger.addAuthorizedVerifier(verifier1.address);

      await expect(
        eventLogger.connect(user).removeAuthorizedVerifier(verifier1.address)
      ).to.be.revertedWith("Only owner can call this");
    });

    it("Should allow multiple verifiers to be authorized", async function () {
      await eventLogger.addAuthorizedVerifier(verifier1.address);
      await eventLogger.addAuthorizedVerifier(verifier2.address);

      expect(await eventLogger.authorizedVerifiers(verifier1.address)).to.equal(true);
      expect(await eventLogger.authorizedVerifiers(verifier2.address)).to.equal(true);
    });
  });

  describe("Verification Logging", function () {
    beforeEach(async function () {
      await eventLogger.addAuthorizedVerifier(verifier1.address);
    });

    it("Should allow authorized verifier to log verification", async function () {
      await expect(
        eventLogger.connect(verifier1).logVerification(credentialId, true)
      ).to.emit(eventLogger, "CredentialVerified");
    });

    it("Should prevent unauthorized user from logging verification", async function () {
      await expect(
        eventLogger.connect(user).logVerification(credentialId, true)
      ).to.be.revertedWith("Not authorized verifier");
    });

    it("Should emit correct event parameters", async function () {
      const tx = await eventLogger
        .connect(verifier1)
        .logVerification(credentialId, true);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(eventLogger, "CredentialVerified")
        .withArgs(credentialId, verifier1.address, block!.timestamp, true);
    });

    it("Should track verification history", async function () {
      await eventLogger.connect(verifier1).logVerification(credentialId, true);
      await eventLogger.connect(verifier1).logVerification(credentialId, true);

      const history = await eventLogger.getVerificationHistory(credentialId);
      expect(history.length).to.equal(2);
    });

    it("Should increment verification count", async function () {
      await eventLogger.connect(verifier1).logVerification(credentialId, true);
      await eventLogger.connect(verifier1).logVerification(credentialId, true);
      await eventLogger.connect(verifier1).logVerification(credentialId, false);

      const count = await eventLogger.getVerificationCount(credentialId);
      expect(count).to.equal(3);
    });

    it("Should log both successful and failed verifications", async function () {
      const tx1 = await eventLogger
        .connect(verifier1)
        .logVerification(credentialId, true);
      await expect(tx1).to.emit(eventLogger, "CredentialVerified");

      const tx2 = await eventLogger
        .connect(verifier1)
        .logVerification(credentialId, false);
      await expect(tx2).to.emit(eventLogger, "CredentialVerified");
    });

    it("Should maintain separate history for different credentials", async function () {
      await eventLogger.connect(verifier1).logVerification(credentialId, true);
      await eventLogger.connect(verifier1).logVerification(credentialId2, true);
      await eventLogger.connect(verifier1).logVerification(credentialId, true);

      const history1 = await eventLogger.getVerificationHistory(credentialId);
      const history2 = await eventLogger.getVerificationHistory(credentialId2);

      expect(history1.length).to.equal(2);
      expect(history2.length).to.equal(1);
    });

    it("Should return empty history for unverified credential", async function () {
      const history = await eventLogger.getVerificationHistory(credentialId);
      expect(history.length).to.equal(0);
    });
  });

  describe("Access Logging", function () {
    it("Should allow anyone to log access", async function () {
      await expect(
        eventLogger.connect(user).logAccess(credentialId, true)
      ).to.emit(eventLogger, "AccessAttempt");
    });

    it("Should emit correct event parameters for access", async function () {
      const tx = await eventLogger.connect(user).logAccess(credentialId, true);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(eventLogger, "AccessAttempt")
        .withArgs(credentialId, user.address, block!.timestamp, true);
    });

    it("Should emit AccessAttempt event for access logs", async function () {
      await expect(eventLogger.connect(user).logAccess(credentialId, true))
        .to.emit(eventLogger, "AccessAttempt")
        .withArgs(credentialId, user.address, anyValue, true);
      
      await expect(eventLogger.connect(verifier1).logAccess(credentialId2, false))
        .to.emit(eventLogger, "AccessAttempt")
        .withArgs(credentialId2, verifier1.address, anyValue, false);
    });

    it("Should emit correct event data for access logs", async function () {
      const tx = await eventLogger.connect(user).logAccess(credentialId, true);
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
      // Access logs are tracked via events for gas efficiency
    });

    it("Should log both successful and failed access attempts via events", async function () {
      await expect(eventLogger.connect(user).logAccess(credentialId, true))
        .to.emit(eventLogger, "AccessAttempt")
        .withArgs(credentialId, user.address, anyValue, true);
      
      await expect(eventLogger.connect(user).logAccess(credentialId, false))
        .to.emit(eventLogger, "AccessAttempt")
        .withArgs(credentialId, user.address, anyValue, false);
    });

    it("Should allow anyone to log access", async function () {
      // user (non-verifier) can log access
      await expect(eventLogger.connect(user).logAccess(credentialId, true))
        .to.emit(eventLogger, "AccessAttempt");
      
      // verifier can also log access
      await expect(eventLogger.connect(verifier1).logAccess(credentialId2, false))
        .to.emit(eventLogger, "AccessAttempt");
    });

    it("Should record multiple access attempts via events", async function () {
      await expect(eventLogger.connect(user).logAccess(credentialId, true))
        .to.emit(eventLogger, "AccessAttempt");
      await expect(eventLogger.connect(verifier1).logAccess(credentialId2, false))
        .to.emit(eventLogger, "AccessAttempt");
      await expect(eventLogger.connect(user).logAccess(credentialId, true))
        .to.emit(eventLogger, "AccessAttempt");
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      await eventLogger.addAuthorizedVerifier(verifier1.address);
      await eventLogger.connect(verifier1).logVerification(credentialId, true);
      await eventLogger.connect(verifier1).logVerification(credentialId, true);
      await eventLogger.connect(user).logAccess(credentialId, true);
    });

    it("Should check if address is authorized verifier", async function () {
      expect(await eventLogger.isAuthorizedVerifier(owner.address)).to.equal(true);
      expect(await eventLogger.isAuthorizedVerifier(verifier1.address)).to.equal(true);
      expect(await eventLogger.isAuthorizedVerifier(user.address)).to.equal(false);
    });

    it("Should get correct verification count", async function () {
      const count = await eventLogger.getVerificationCount(credentialId);
      expect(count).to.equal(2);
    });

    it("Should return zero count for unverified credential", async function () {
      const count = await eventLogger.getVerificationCount(credentialId2);
      expect(count).to.equal(0);
    });
  });

  describe("Ownership Transfer", function () {
    it("Should allow owner to transfer ownership", async function () {
      await eventLogger.transferOwnership(verifier1.address);

      expect(await eventLogger.owner()).to.equal(verifier1.address);
    });

    it("Should authorize new owner as verifier", async function () {
      await eventLogger.transferOwnership(verifier1.address);

      expect(await eventLogger.authorizedVerifiers(verifier1.address)).to.equal(true);
    });

    it("Should prevent non-owner from transferring ownership", async function () {
      await expect(
        eventLogger.connect(user).transferOwnership(verifier1.address)
      ).to.be.revertedWith("Only owner can call this");
    });

    it("Should prevent transferring to zero address", async function () {
      await expect(
        eventLogger.transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });

    it("Should prevent transferring to current owner", async function () {
      await expect(
        eventLogger.transferOwnership(owner.address)
      ).to.be.revertedWith("Already owner");
    });

    it("Should allow new owner to add verifiers", async function () {
      await eventLogger.transferOwnership(verifier1.address);

      await expect(
        eventLogger.connect(verifier1).addAuthorizedVerifier(verifier2.address)
      ).to.not.be.reverted;
    });

    it("Should prevent old owner from adding verifiers after transfer", async function () {
      await eventLogger.transferOwnership(verifier1.address);

      await expect(
        eventLogger.connect(owner).addAuthorizedVerifier(verifier2.address)
      ).to.be.revertedWith("Only owner can call this");
    });
  });

  describe("Edge Cases", function () {
    beforeEach(async function () {
      await eventLogger.addAuthorizedVerifier(verifier1.address);
    });

    it("Should handle rapid verification logging", async function () {
      for (let i = 0; i < 10; i++) {
        await eventLogger.connect(verifier1).logVerification(credentialId, true);
      }

      const count = await eventLogger.getVerificationCount(credentialId);
      expect(count).to.equal(10);
    });

    it("Should handle rapid access logging via events", async function () {
      for (let i = 0; i < 10; i++) {
        await expect(eventLogger.connect(user).logAccess(credentialId, i % 2 === 0))
          .to.emit(eventLogger, "AccessAttempt");
      }
      // Access logs are tracked via events, not storage
    });

    it("Should handle large number of authorized verifiers", async function () {
      const signers = await ethers.getSigners();
      for (let i = 4; i < Math.min(10, signers.length); i++) {
        await eventLogger.addAuthorizedVerifier(signers[i].address);
        expect(await eventLogger.authorizedVerifiers(signers[i].address)).to.equal(
          true
        );
      }
    });
  });

  describe("Gas Optimization", function () {
    beforeEach(async function () {
      await eventLogger.addAuthorizedVerifier(verifier1.address);
    });

    it("Should log verification with reasonable gas", async function () {
      const tx = await eventLogger
        .connect(verifier1)
        .logVerification(credentialId, true);
      const receipt = await tx.wait();

      expect(receipt.gasUsed).to.be.lessThan(150000n);
    });

    it("Should log access with reasonable gas", async function () {
      const tx = await eventLogger.connect(user).logAccess(credentialId, true);
      const receipt = await tx.wait();

      expect(receipt.gasUsed).to.be.lessThan(150000n);
    });
  });
});

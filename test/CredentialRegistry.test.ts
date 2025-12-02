import { expect } from "chai";
import { ethers } from "hardhat";

describe("CredentialRegistry", function () {
  let credentialRegistry: any;
  let owner: any;
  let issuer: any;
  let holder: any;
  let verifier: any;

  const credentialId = ethers.keccak256(ethers.toUtf8Bytes("credential_001"));
  const credentialId2 = ethers.keccak256(ethers.toUtf8Bytes("credential_002"));
  const credentialHash = ethers.keccak256(
    ethers.toUtf8Bytes(
      '{"type":"UniversityDegree","degree":"BSc Computer Science"}'
    )
  );
  const credentialCID = "ipfs://QmExampleCredential123";

  beforeEach(async function () {
    [owner, issuer, holder, verifier] = await ethers.getSigners();

    credentialRegistry = await ethers.deployContract("CredentialRegistry");
  });

  describe("Credential Issuance", function () {
    it("Should issue a new credential successfully", async function () {
      await expect(
        credentialRegistry
          .connect(issuer)
          .issueCredential(credentialId, holder.address, credentialHash, credentialCID)
      )
        .to.emit(credentialRegistry, "CredentialIssued")
        .withArgs(credentialId, issuer.address, holder.address, credentialHash, credentialCID);

      const credential = await credentialRegistry.getCredential(credentialId);
      expect(credential.issuer).to.equal(issuer.address);
      expect(credential.holder).to.equal(holder.address);
      expect(credential.credentialHash).to.equal(credentialHash);
      expect(credential.cid).to.equal(credentialCID);
      expect(credential.revoked).to.equal(false);
    });

    it("Should prevent duplicate credential issuance", async function () {
      await credentialRegistry
        .connect(issuer)
        .issueCredential(credentialId, holder.address, credentialHash, credentialCID);

      await expect(
        credentialRegistry
          .connect(issuer)
          .issueCredential(credentialId, holder.address, credentialHash, credentialCID)
      ).to.be.revertedWith("credential exists");
    });

    it("Should allow different issuers to issue different credentials", async function () {
      const hash1 = ethers.keccak256(ethers.toUtf8Bytes("credential1"));
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("credential2"));

      await credentialRegistry
        .connect(issuer)
        .issueCredential(credentialId, holder.address, hash1, credentialCID);
      await credentialRegistry
        .connect(holder)
        .issueCredential(credentialId2, holder.address, hash2, credentialCID);

      const cred1 = await credentialRegistry.getCredential(credentialId);
      const cred2 = await credentialRegistry.getCredential(credentialId2);

      expect(cred1.issuer).to.equal(issuer.address);
      expect(cred2.issuer).to.equal(holder.address);
    });

    it("Should record correct timestamp on issuance", async function () {
      const tx = await credentialRegistry
        .connect(issuer)
        .issueCredential(credentialId, holder.address, credentialHash, credentialCID);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      const credential = await credentialRegistry.getCredential(credentialId);
      expect(credential.issuedAt).to.equal(block!.timestamp);
    });

    it("Should emit correct event on issuance", async function () {
      const tx = await credentialRegistry
        .connect(issuer)
        .issueCredential(credentialId, holder.address, credentialHash, credentialCID);

      await expect(tx)
        .to.emit(credentialRegistry, "CredentialIssued")
        .withArgs(credentialId, issuer.address, holder.address, credentialHash, credentialCID);
    });

    it("Should allow empty CID string", async function () {
      await expect(
        credentialRegistry
          .connect(issuer)
          .issueCredential(credentialId, holder.address, credentialHash, "")
      ).to.not.be.reverted;

      const credential = await credentialRegistry.getCredential(credentialId);
      expect(credential.cid).to.equal("");
    });

    it("Should allow zero hash", async function () {
      const zeroHash = ethers.ZeroHash;
      await expect(
        credentialRegistry
          .connect(issuer)
          .issueCredential(credentialId, holder.address, zeroHash, credentialCID)
      ).to.not.be.reverted;

      const credential = await credentialRegistry.getCredential(credentialId);
      expect(credential.credentialHash).to.equal(zeroHash);
    });
  });

  describe("Credential Revocation", function () {
    beforeEach(async function () {
      await credentialRegistry
        .connect(issuer)
        .issueCredential(credentialId, holder.address, credentialHash, credentialCID);
    });

    it("Should allow issuer to revoke credential", async function () {
      await expect(
        credentialRegistry.connect(issuer).revokeCredential(credentialId)
      )
        .to.emit(credentialRegistry, "CredentialRevoked")
        .withArgs(credentialId, issuer.address);

      const credential = await credentialRegistry.getCredential(credentialId);
      expect(credential.revoked).to.equal(true);
    });

    it("Should prevent non-issuer from revoking credential", async function () {
      await expect(
        credentialRegistry.connect(holder).revokeCredential(credentialId)
      ).to.be.revertedWith("only issuer");
    });

    it("Should prevent revoking already revoked credential", async function () {
      await credentialRegistry.connect(issuer).revokeCredential(credentialId);

      await expect(
        credentialRegistry.connect(issuer).revokeCredential(credentialId)
      ).to.be.revertedWith("already revoked");
    });

    it("Should prevent revoking non-existent credential", async function () {
      const nonExistentId = ethers.keccak256(
        ethers.toUtf8Bytes("nonexistent")
      );
      await expect(
        credentialRegistry.connect(issuer).revokeCredential(nonExistentId)
      ).to.be.revertedWith("only issuer");
    });

    it("Should maintain credential data after revocation", async function () {
      await credentialRegistry.connect(issuer).revokeCredential(credentialId);

      const credential = await credentialRegistry.getCredential(credentialId);
      expect(credential.issuer).to.equal(issuer.address);
      expect(credential.credentialHash).to.equal(credentialHash);
      expect(credential.cid).to.equal(credentialCID);
      expect(credential.revoked).to.equal(true);
    });

    it("Should emit correct event on revocation", async function () {
      const tx = await credentialRegistry
        .connect(issuer)
        .revokeCredential(credentialId);

      await expect(tx)
        .to.emit(credentialRegistry, "CredentialRevoked")
        .withArgs(credentialId, issuer.address);
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      await credentialRegistry
        .connect(issuer)
        .issueCredential(credentialId, holder.address, credentialHash, credentialCID);
    });

    it("Should return correct credential data", async function () {
      const credential = await credentialRegistry.getCredential(credentialId);

      expect(credential.issuer).to.equal(issuer.address);
      expect(credential.credentialHash).to.equal(credentialHash);
      expect(credential.cid).to.equal(credentialCID);
      expect(credential.revoked).to.equal(false);
      expect(credential.issuedAt).to.be.greaterThan(0);
    });

    it("Should return zero values for non-existent credential", async function () {
      const nonExistentId = ethers.keccak256(
        ethers.toUtf8Bytes("nonexistent")
      );
      const credential = await credentialRegistry.getCredential(nonExistentId);

      expect(credential.issuer).to.equal(ethers.ZeroAddress);
      expect(credential.credentialHash).to.equal(ethers.ZeroHash);
      expect(credential.cid).to.equal("");
      expect(credential.issuedAt).to.equal(0);
      expect(credential.revoked).to.equal(false);
    });

    it("Should query credential via public mapping", async function () {
      const credential = await credentialRegistry.credentials(credentialId);

      expect(credential.issuer).to.equal(issuer.address);
      expect(credential.credentialHash).to.equal(credentialHash);
    });

    it("Should reflect revocation status in query", async function () {
      await credentialRegistry.connect(issuer).revokeCredential(credentialId);

      const credential = await credentialRegistry.getCredential(credentialId);
      expect(credential.revoked).to.equal(true);
    });
  });

  describe("Multiple Credentials Workflow", function () {
    it("Should handle multiple credentials from same issuer", async function () {
      const hash1 = ethers.keccak256(ethers.toUtf8Bytes("cred1"));
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("cred2"));

      await credentialRegistry
        .connect(issuer)
        .issueCredential(credentialId, holder.address, hash1, credentialCID);
      await credentialRegistry
        .connect(issuer)
        .issueCredential(credentialId2, holder.address, hash2, credentialCID);

      const cred1 = await credentialRegistry.getCredential(credentialId);
      const cred2 = await credentialRegistry.getCredential(credentialId2);

      expect(cred1.credentialHash).to.equal(hash1);
      expect(cred2.credentialHash).to.equal(hash2);
    });

    it("Should allow issuer to revoke only their credentials", async function () {
      await credentialRegistry
        .connect(issuer)
        .issueCredential(credentialId, holder.address, credentialHash, credentialCID);
      await credentialRegistry
        .connect(holder)
        .issueCredential(credentialId2, holder.address, credentialHash, credentialCID);

      // Issuer can revoke their own
      await expect(
        credentialRegistry.connect(issuer).revokeCredential(credentialId)
      ).to.not.be.reverted;

      // But cannot revoke holder's credential
      await expect(
        credentialRegistry.connect(issuer).revokeCredential(credentialId2)
      ).to.be.revertedWith("only issuer");
    });

    it("Should maintain independence between credentials", async function () {
      await credentialRegistry
        .connect(issuer)
        .issueCredential(credentialId, holder.address, credentialHash, credentialCID);
      await credentialRegistry
        .connect(issuer)
        .issueCredential(credentialId2, holder.address, credentialHash, credentialCID);

      // Revoke first credential
      await credentialRegistry.connect(issuer).revokeCredential(credentialId);

      const cred1 = await credentialRegistry.getCredential(credentialId);
      const cred2 = await credentialRegistry.getCredential(credentialId2);

      expect(cred1.revoked).to.equal(true);
      expect(cred2.revoked).to.equal(false);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle long IPFS CIDs", async function () {
      const longCID =
        "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

      await expect(
        credentialRegistry
          .connect(issuer)
          .issueCredential(credentialId, holder.address, credentialHash, longCID)
      ).to.not.be.reverted;

      const credential = await credentialRegistry.getCredential(credentialId);
      expect(credential.cid).to.equal(longCID);
    });

    it("Should handle complex credential hashes", async function () {
      const complexData = JSON.stringify({
        type: "UniversityDegree",
        credentialSubject: {
          id: "did:example:ebfeb1f712ebc6f1c276e12ec21",
          degree: {
            type: "BachelorDegree",
            name: "Bachelor of Science and Arts",
          },
        },
      });
      const complexHash = ethers.keccak256(ethers.toUtf8Bytes(complexData));

      await expect(
        credentialRegistry
          .connect(issuer)
          .issueCredential(credentialId, holder.address, complexHash, credentialCID)
      ).to.not.be.reverted;

      const credential = await credentialRegistry.getCredential(credentialId);
      expect(credential.credentialHash).to.equal(complexHash);
    });

    it("Should handle rapid issuance", async function () {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        const id = ethers.keccak256(ethers.toUtf8Bytes(`credential_${i}`));
        promises.push(
          credentialRegistry
            .connect(issuer)
            .issueCredential(id, holder.address, credentialHash, credentialCID)
        );
      }

      await expect(Promise.all(promises)).to.not.be.reverted;
    });

    it("Should handle credential ID collision attempts", async function () {
      await credentialRegistry
        .connect(issuer)
        .issueCredential(credentialId, holder.address, credentialHash, credentialCID);

      // Different issuer tries to use same ID
      await expect(
        credentialRegistry
          .connect(holder)
          .issueCredential(credentialId, holder.address, credentialHash, credentialCID)
      ).to.be.revertedWith("credential exists");
    });
  });

  describe("Event Emission", function () {
    it("Should emit CredentialIssued event with all parameters", async function () {
      const tx = await credentialRegistry
        .connect(issuer)
        .issueCredential(credentialId, holder.address, credentialHash, credentialCID);

      await expect(tx)
        .to.emit(credentialRegistry, "CredentialIssued")
        .withArgs(credentialId, issuer.address, holder.address, credentialHash, credentialCID);
    });

    it("Should emit CredentialRevoked event with all parameters", async function () {
      await credentialRegistry
        .connect(issuer)
        .issueCredential(credentialId, holder.address, credentialHash, credentialCID);

      const tx = await credentialRegistry
        .connect(issuer)
        .revokeCredential(credentialId);

      await expect(tx)
        .to.emit(credentialRegistry, "CredentialRevoked")
        .withArgs(credentialId, issuer.address);
    });

    it("Should emit events in correct order for workflow", async function () {
      const tx1 = await credentialRegistry
        .connect(issuer)
        .issueCredential(credentialId, holder.address, credentialHash, credentialCID);
      await expect(tx1).to.emit(credentialRegistry, "CredentialIssued");

      const tx2 = await credentialRegistry
        .connect(issuer)
        .revokeCredential(credentialId);
      await expect(tx2).to.emit(credentialRegistry, "CredentialRevoked");
    });
  });

  describe("Gas Optimization", function () {
    it("Should issue credential with reasonable gas", async function () {
      const tx = await credentialRegistry
        .connect(issuer)
        .issueCredential(credentialId, holder.address, credentialHash, credentialCID);
      const receipt = await tx.wait();

      // Gas should be reasonable (adjust threshold as needed)
      expect(receipt!.gasUsed).to.be.lessThan(200000n);
    });

    it("Should revoke credential with reasonable gas", async function () {
      await credentialRegistry
        .connect(issuer)
        .issueCredential(credentialId, holder.address, credentialHash, credentialCID);

      const tx = await credentialRegistry
        .connect(issuer)
        .revokeCredential(credentialId);
      const receipt = await tx.wait();

      expect(receipt!.gasUsed).to.be.lessThan(100000n);
    });
  });
});

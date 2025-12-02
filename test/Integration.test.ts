import { expect } from "chai";
import { ethers } from "hardhat";

describe("Integration Tests", function () {
  let didRegistry: any;
  let credentialRegistry: any;
  let eventLogger: any;
  let owner: any;
  let issuer: any;
  let holder: any;
  let verifier: any;

  beforeEach(async function () {
    [owner, issuer, holder, verifier] = await ethers.getSigners();

    // Deploy all contracts
    didRegistry = await ethers.deployContract("DIDRegistry");
    credentialRegistry = await ethers.deployContract("CredentialRegistry");
    eventLogger = await ethers.deployContract("EventLogger");

    // Setup EventLogger with authorized verifier
    await eventLogger.addAuthorizedVerifier(verifier.address);
  });

  describe("Complete Credential Issuance Workflow", function () {
    it("Should complete full workflow: DID registration -> Credential issuance -> Verification logging", async function () {
      // Step 1: Register DIDs for holder and issuer
      const holderDID = ethers.keccak256(
        ethers.toUtf8Bytes("did:idverse:holder123")
      );
      const issuerDID = ethers.keccak256(
        ethers.toUtf8Bytes("did:idverse:issuer456")
      );
      const holderDocPointer = "ipfs://QmHolderDIDDocument";
      const issuerDocPointer = "ipfs://QmIssuerDIDDocument";

      await didRegistry
        .connect(holder)
        .registerDID(holderDID, holder.address, holderDocPointer);
      await didRegistry
        .connect(issuer)
        .registerDID(issuerDID, issuer.address, issuerDocPointer);

      // Verify DIDs are registered
      expect(await didRegistry.getController(holderDID)).to.equal(holder.address);
      expect(await didRegistry.getController(issuerDID)).to.equal(issuer.address);

      // Step 2: Issuer issues a credential to the holder
      const credentialId = ethers.keccak256(
        ethers.toUtf8Bytes("credential_degree_001")
      );
      const credentialData = JSON.stringify({
        type: "UniversityDegree",
        credentialSubject: {
          id: holderDID,
          degree: {
            type: "BachelorDegree",
            name: "BSc Computer Science",
          },
        },
      });
      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes(credentialData));
      const credentialCID = "ipfs://QmCredentialDocument";

      await expect(
        credentialRegistry
          .connect(issuer)
          .issueCredential(credentialId, holder.address, credentialHash, credentialCID)
      )
        .to.emit(credentialRegistry, "CredentialIssued")
        .withArgs(credentialId, issuer.address, holder.address, credentialHash, credentialCID);

      // Verify credential is issued
      const credential = await credentialRegistry.getCredential(credentialId);
      expect(credential.issuer).to.equal(issuer.address);
      expect(credential.revoked).to.equal(false);

      // Step 3: Verifier verifies the credential
      await expect(
        eventLogger.connect(verifier).logVerification(credentialId, true)
      ).to.emit(eventLogger, "CredentialVerified");

      // Step 4: Holder logs access to their credential
      await expect(
        eventLogger.connect(holder).logAccess(credentialId, true)
      ).to.emit(eventLogger, "AccessAttempt");

      // Verify the complete workflow state
      const verificationCount = await eventLogger.getVerificationCount(credentialId);
      expect(verificationCount).to.equal(1);

      const accessLogCount = await eventLogger.getAccessLogCount();
      expect(accessLogCount).to.equal(1);
    });

    it("Should handle credential revocation workflow", async function () {
      // Setup: Register DID and issue credential
      const holderDID = ethers.keccak256(
        ethers.toUtf8Bytes("did:idverse:holder")
      );
      await didRegistry
        .connect(holder)
        .registerDID(holderDID, holder.address, "ipfs://QmHolder");

      const credentialId = ethers.keccak256(ethers.toUtf8Bytes("credential_001"));
      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("data"));
      const credentialCID = "ipfs://QmCredential";

      await credentialRegistry
        .connect(issuer)
        .issueCredential(credentialId, holder.address, credentialHash, credentialCID);

      // Log initial verification
      await eventLogger.connect(verifier).logVerification(credentialId, true);

      // Issuer revokes the credential
      await expect(
        credentialRegistry.connect(issuer).revokeCredential(credentialId)
      ).to.emit(credentialRegistry, "CredentialRevoked");

      // Verify revocation status
      const credential = await credentialRegistry.getCredential(credentialId);
      expect(credential.revoked).to.equal(true);

      // Log failed verification after revocation
      await eventLogger.connect(verifier).logVerification(credentialId, false);

      // Verify both verifications are logged
      const verificationCount = await eventLogger.getVerificationCount(credentialId);
      expect(verificationCount).to.equal(2);
    });
  });

  describe("DID Controller Transfer with Credential Management", function () {
    it("Should allow new controller to manage DID after transfer", async function () {
      const did = ethers.keccak256(ethers.toUtf8Bytes("did:idverse:test"));
      const initialPointer = "ipfs://QmInitial";
      const updatedPointer = "ipfs://QmUpdated";

      // Initial registration
      await didRegistry
        .connect(holder)
        .registerDID(did, holder.address, initialPointer);

      // Transfer control
      await didRegistry
        .connect(holder)
        .updateController(did, issuer.address);

      // New controller updates document pointer
      await expect(
        didRegistry.connect(issuer).updateDocPointer(did, updatedPointer)
      ).to.not.be.reverted;

      // Verify update
      const pointer = await didRegistry.getDocPointer(did);
      expect(pointer).to.equal(updatedPointer);

      // Old controller cannot update
      await expect(
        didRegistry.connect(holder).updateDocPointer(did, "ipfs://QmWrong")
      ).to.be.revertedWith("only controller");
    });
  });

  describe("Multi-Party Credential Workflow", function () {
    it("Should handle credentials from multiple issuers", async function () {
      const [, issuer1, issuer2, student] = await ethers.getSigners();

      // Register DIDs
      const studentDID = ethers.keccak256(
        ethers.toUtf8Bytes("did:idverse:student")
      );
      const issuer1DID = ethers.keccak256(
        ethers.toUtf8Bytes("did:idverse:university")
      );
      const issuer2DID = ethers.keccak256(
        ethers.toUtf8Bytes("did:idverse:employer")
      );

      await didRegistry
        .connect(student)
        .registerDID(studentDID, student.address, "ipfs://QmStudent");
      await didRegistry
        .connect(issuer1)
        .registerDID(issuer1DID, issuer1.address, "ipfs://QmUniversity");
      await didRegistry
        .connect(issuer2)
        .registerDID(issuer2DID, issuer2.address, "ipfs://QmEmployer");

      // Issue credentials from different issuers
      const degreeCred = ethers.keccak256(ethers.toUtf8Bytes("degree"));
      const employmentCred = ethers.keccak256(ethers.toUtf8Bytes("employment"));

      await credentialRegistry
        .connect(issuer1)
        .issueCredential(
          degreeCred,
          student.address,
          ethers.keccak256(ethers.toUtf8Bytes("degree_data")),
          "ipfs://QmDegree"
        );

      await credentialRegistry
        .connect(issuer2)
        .issueCredential(
          employmentCred,
          student.address,
          ethers.keccak256(ethers.toUtf8Bytes("employment_data")),
          "ipfs://QmEmployment"
        );

      // Verify both credentials exist with correct issuers
      const cred1 = await credentialRegistry.getCredential(degreeCred);
      const cred2 = await credentialRegistry.getCredential(employmentCred);

      expect(cred1.issuer).to.equal(issuer1.address);
      expect(cred2.issuer).to.equal(issuer2.address);

      // Log verifications
      await eventLogger.connect(verifier).logVerification(degreeCred, true);
      await eventLogger.connect(verifier).logVerification(employmentCred, true);

      // Verify verification counts
      expect(await eventLogger.getVerificationCount(degreeCred)).to.equal(1);
      expect(await eventLogger.getVerificationCount(employmentCred)).to.equal(1);
    });
  });

  describe("Access Control and Security", function () {
    it("Should enforce access control across contracts", async function () {
      const did = ethers.keccak256(ethers.toUtf8Bytes("did:idverse:secure"));
      const credentialId = ethers.keccak256(ethers.toUtf8Bytes("cred_secure"));

      // Register DID as holder
      await didRegistry
        .connect(holder)
        .registerDID(did, holder.address, "ipfs://QmSecure");

      // Only holder can update their DID
      await expect(
        didRegistry.connect(issuer).updateDocPointer(did, "ipfs://QmHack")
      ).to.be.revertedWith("only controller");

      // Issue credential as issuer
      await credentialRegistry
        .connect(issuer)
        .issueCredential(
          credentialId,
          holder.address,
          ethers.keccak256(ethers.toUtf8Bytes("data")),
          "ipfs://QmCred"
        );

      // Only issuer can revoke
      await expect(
        credentialRegistry.connect(holder).revokeCredential(credentialId)
      ).to.be.revertedWith("only issuer");

      // Only authorized verifiers can log verification
      await expect(
        eventLogger.connect(holder).logVerification(credentialId, true)
      ).to.be.revertedWith("Not authorized verifier");

      // But anyone can log access
      await expect(
        eventLogger.connect(holder).logAccess(credentialId, true)
      ).to.not.be.reverted;
    });
  });

  describe("Complete Verification Audit Trail", function () {
    it("Should maintain complete audit trail for credential lifecycle", async function () {
      const credentialId = ethers.keccak256(ethers.toUtf8Bytes("audit_cred"));
      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes("audit_data"));

      // Issue credential
      await credentialRegistry
        .connect(issuer)
        .issueCredential(credentialId, holder.address, credentialHash, "ipfs://QmAudit");

      // Multiple verifications
      await eventLogger.connect(verifier).logVerification(credentialId, true);
      console.log("Count after 1:", await eventLogger.getVerificationCount(credentialId));
      await eventLogger.connect(verifier).logVerification(credentialId, true);
      console.log("Count after 2:", await eventLogger.getVerificationCount(credentialId));
      await eventLogger.connect(verifier).logVerification(credentialId, true);
      console.log("Count after 3:", await eventLogger.getVerificationCount(credentialId));

      // Multiple access attempts
      await eventLogger.connect(holder).logAccess(credentialId, true);
      await eventLogger.connect(holder).logAccess(credentialId, true);

      // Revoke credential
      await credentialRegistry.connect(issuer).revokeCredential(credentialId);

      // Verification after revocation
      await eventLogger.connect(verifier).logVerification(credentialId, false);

      // Access after revocation
      await eventLogger.connect(holder).logAccess(credentialId, false);
      await eventLogger.connect(holder).logAccess(credentialId, false);

      // Verify complete audit trail
      const verificationCount = await eventLogger.getVerificationCount(credentialId);
      expect(verificationCount).to.equal(4); // 3 successful + 1 failed

      const accessLogCount = await eventLogger.getAccessLogCount();
      expect(accessLogCount).to.equal(4); // 2 successful + 2 failed

      const credential = await credentialRegistry.getCredential(credentialId);
      expect(credential.revoked).to.equal(true);
    });
  });

  describe("Data Consistency", function () {
    it("Should maintain data consistency across contracts", async function () {
      const holderDID = ethers.keccak256(ethers.toUtf8Bytes("did:consistency"));
      const credentialId = ethers.keccak256(
        ethers.toUtf8Bytes("cred_consistency")
      );

      // Register DID
      const didDocPointer = "ipfs://QmDIDDoc";
      await didRegistry
        .connect(holder)
        .registerDID(holderDID, holder.address, didDocPointer);

      // Issue credential with reference to DID
      const credentialHash = ethers.keccak256(
        ethers.toUtf8Bytes(
          JSON.stringify({ subject: holderDID, type: "TestCredential" })
        )
      );
      await credentialRegistry
        .connect(issuer)
        .issueCredential(credentialId, holder.address, credentialHash, "ipfs://QmCred");

      // Verify relationships
      const didController = await didRegistry.getController(holderDID);
      const credential = await credentialRegistry.getCredential(credentialId);

      expect(didController).to.equal(holder.address);
      expect(credential.issuer).to.equal(issuer.address);
      expect(credential.credentialHash).to.equal(credentialHash);

      // Update DID document doesn't affect credential
      await didRegistry
        .connect(holder)
        .updateDocPointer(holderDID, "ipfs://QmUpdatedDoc");

      const updatedCredential = await credentialRegistry.getCredential(
        credentialId
      );
      expect(updatedCredential.credentialHash).to.equal(credentialHash);
      expect(updatedCredential.cid).to.equal("ipfs://QmCred");
    });
  });

  describe("Error Handling", function () {
    it("Should handle errors gracefully across contract interactions", async function () {
      const nonExistentDID = ethers.keccak256(
        ethers.toUtf8Bytes("did:nonexistent")
      );
      const nonExistentCred = ethers.keccak256(
        ethers.toUtf8Bytes("cred_nonexistent")
      );

      // Query non-existent DID
      const controller = await didRegistry.getController(nonExistentDID);
      expect(controller).to.equal(ethers.ZeroAddress);

      // Query non-existent credential
      const credential = await credentialRegistry.getCredential(nonExistentCred);
      expect(credential.issuer).to.equal(ethers.ZeroAddress);

      // Verification history for non-verified credential
      const history = await eventLogger.getVerificationHistory(nonExistentCred);
      expect(history.length).to.equal(0);

      // Count for non-existent credential
      const count = await eventLogger.getVerificationCount(nonExistentCred);
      expect(count).to.equal(0);
    });
  });

  describe("Gas Efficiency", function () {
    it("Should execute complete workflow with reasonable gas costs", async function () {
      const did = ethers.keccak256(ethers.toUtf8Bytes("did:gas"));
      const credId = ethers.keccak256(ethers.toUtf8Bytes("cred_gas"));

      // Track gas for each operation
      const tx1 = await didRegistry
        .connect(holder)
        .registerDID(did, holder.address, "ipfs://QmGas");
      const receipt1 = await tx1.wait();

      const tx2 = await credentialRegistry
        .connect(issuer)
        .issueCredential(
          credId,
          holder.address,
          ethers.keccak256(ethers.toUtf8Bytes("gas_data")),
          "ipfs://QmGasCred"
        );
      const receipt2 = await tx2.wait();

      const tx3 = await eventLogger
        .connect(verifier)
        .logVerification(credId, true);
      const receipt3 = await tx3.wait();

      // Verify reasonable gas usage
      expect(receipt1!.gasUsed).to.be.lessThan(200000n);
      expect(receipt2!.gasUsed).to.be.lessThan(200000n);
      expect(receipt3!.gasUsed).to.be.lessThan(150000n);
    });
  });
});

import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Starting Full Pipeline Test on Localhost...\n");

  // 1. Load deployed addresses
  const addressFile = path.join(__dirname, "../client/src/services/contract-addresses.json");
  if (!fs.existsSync(addressFile)) {
    console.error("❌ Contract addresses not found. Run deploy-local.ts first.");
    process.exit(1);
  }
  const addresses = JSON.parse(fs.readFileSync(addressFile, "utf8"));
  console.log("📍 Loaded Contract Addresses:", addresses);

  // 2. Connect to contracts
  const DIDRegistry = await ethers.getContractAt("DIDRegistry", addresses.DIDRegistry);
  const CredentialRegistry = await ethers.getContractAt("CredentialRegistry", addresses.CredentialRegistry);
  const EventLogger = await ethers.getContractAt("EventLogger", addresses.EventLogger);

  // 3. Setup Actors
  const [deployer, issuer, holder, verifier] = await ethers.getSigners();
  console.log("\n👥 Actors:");
  console.log("   Deployer:", deployer.address);
  console.log("   Issuer:  ", issuer.address);
  console.log("   Holder:  ", holder.address);
  console.log("   Verifier:", verifier.address);

  // 4. Register DIDs
  console.log("\n📝 Step 1: Registering DIDs...");
  const issuerDID = ethers.id("did:idverse:issuer" + Date.now()); // Unique ID
  const holderDID = ethers.id("did:idverse:holder" + Date.now()); // Unique ID

  await (await DIDRegistry.connect(issuer).registerDID(issuerDID, issuer.address, "ipfs://issuer-doc")).wait();
  await (await DIDRegistry.connect(holder).registerDID(holderDID, holder.address, "ipfs://holder-doc")).wait();
  console.log("   ✅ DIDs Registered");

  // 5. Issue Credential
  console.log("\n🎓 Step 2: Issuing Credential...");
  const credentialId = ethers.id("cred-" + Date.now());
  const credentialHash = ethers.id("hash-001");
  
  // Note: Using the updated signature: issueCredential(id, holder, hash, cid)
  await (await CredentialRegistry.connect(issuer).issueCredential(credentialId, holder.address, credentialHash, "ipfs://cred-cid")).wait();
  console.log("   ✅ Credential Issued");

  // 6. Authorize Verifier
  console.log("\n🔐 Step 3: Authorizing Verifier...");
  // EventLogger owner is deployer (from deploy-local.ts)
  // Check if already authorized
  const isAuthorized = await EventLogger.isAuthorizedVerifier(verifier.address);
  if (!isAuthorized) {
      await (await EventLogger.connect(deployer).addAuthorizedVerifier(verifier.address)).wait();
      console.log("   ✅ Verifier Authorized");
  } else {
      console.log("   ℹ️  Verifier already authorized");
  }

  // 7. Verify Credential
  console.log("\n🔍 Step 4: Verifying Credential...");
  const cred = await CredentialRegistry.getCredential(credentialId);
  const isValid = !cred.revoked && cred.issuer === issuer.address;
  
  if (isValid) {
      await (await EventLogger.connect(verifier).logVerification(credentialId, true)).wait();
      console.log("   ✅ Verification Logged (Success)");
  } else {
      console.error("   ❌ Credential Invalid!");
  }

  // 8. Holder Access Log
  console.log("\n👤 Step 5: Holder Access Log...");
  await (await EventLogger.connect(holder).logAccess(credentialId, true)).wait();
  console.log("   ✅ Access Logged");

  // 9. Revoke Credential
  console.log("\n🚫 Step 6: Revoking Credential...");
  await (await CredentialRegistry.connect(issuer).revokeCredential(credentialId)).wait();
  console.log("   ✅ Credential Revoked");

  // 10. Verify Revocation
  console.log("\n🔍 Step 7: Verifying Revocation...");
  const revokedCred = await CredentialRegistry.getCredential(credentialId);
  if (revokedCred.revoked) {
      await (await EventLogger.connect(verifier).logVerification(credentialId, false)).wait();
      console.log("   ✅ Verification Logged (Revoked)");
  } else {
      console.error("   ❌ Credential should be revoked!");
  }

  // 11. Check Audit Trail
  console.log("\n📊 Step 8: Checking Audit Trail...");
  const verificationCount = await EventLogger.getVerificationCount(credentialId);
  const accessCount = await EventLogger.getAccessLogCount();
  
  console.log(`   Verifications: ${verificationCount} (Expected: 2)`);
  console.log(`   Access Logs:   ${accessCount} (Global count)`); 

  if (verificationCount == 2n) {
      console.log("\n✅ PIPELINE TEST PASSED SUCCESSFULLY!");
  } else {
      console.error("\n❌ PIPELINE TEST FAILED: Verification count mismatch");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

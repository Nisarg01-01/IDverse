import { ethers } from "hardhat";

async function main() {
  console.log("Deploying contracts and preparing accounts...");
  const [deployer, issuer, holder, verifier] = await ethers.getSigners();

  // Deploy DIDRegistry first
  const DIDRegistryFactory = await ethers.getContractFactory("DIDRegistry");
  const didRegistry = await DIDRegistryFactory.connect(deployer).deploy();
  await didRegistry.waitForDeployment();
  const didRegistryAddress = await didRegistry.getAddress();
  console.log(`DIDRegistry deployed at: ${didRegistryAddress}`);

  // Deploy CredentialRegistry with DIDRegistry address
  const CredentialRegistryFactory = await ethers.getContractFactory("CredentialRegistry");
  const credentialRegistry = await CredentialRegistryFactory.connect(deployer).deploy(didRegistryAddress);
  await credentialRegistry.waitForDeployment();
  const credentialRegistryAddress = await credentialRegistry.getAddress();
  console.log(`CredentialRegistry deployed at: ${credentialRegistryAddress}`);
  console.log("----------------------------------------------------");

  // --- 1. Register a DID for the issuer (required before issuing credentials) ---
  console.log("1. Testing 'registerDID' for issuer...");
  const issuerDid = ethers.id("did:idverse:issuer:" + issuer.address);
  const issuerDocPointer = "ipfs://QmIssuerDocPointer";

  const registerTx = await didRegistry.connect(issuer).registerDID(issuerDid, issuer.address, issuerDocPointer);
  const registerReceipt = await registerTx.wait();
  const registerGasUsed = registerReceipt ? registerReceipt.gasUsed.toString() : "N/A";

  console.log(`   - Issuer DID: ${issuerDid}`);
  console.log(`   - Transaction successful.`);
  console.log(`   - Gas Used: ${registerGasUsed}`);
  console.log("----------------------------------------------------");

  // --- 2. Measure issueCredential Gas Cost ---
  console.log("2. Testing 'issueCredential'...");
  const credentialData = {
    name: "Proof of Enrollment",
    studentId: "12345",
    university: "Blockchain University",
    issueDate: new Date().toISOString(),
  };
  const credentialString = JSON.stringify(credentialData);
  const credentialHash = ethers.id(credentialString);
  const credentialId = ethers.id("credential:" + Date.now());
  const ipfsCid = "ipfs://QmZ2bH6pGMo9ug29tb1E2n2g5a5EmC5s5aE3mC";

  const issueTx = await credentialRegistry.connect(issuer).issueCredential(
    credentialId,
    holder.address,
    credentialHash,
    ipfsCid
  );
  const issueReceipt = await issueTx.wait();
  const issueGasUsed = issueReceipt ? issueReceipt.gasUsed.toString() : "N/A";

  console.log(`   - Credential ID: ${credentialId}`);
  console.log(`   - Credential Hash: ${credentialHash}`);
  console.log(`   - Holder Address: ${holder.address}`);
  console.log(`   - Transaction successful.`);
  console.log(`   - Gas Used: ${issueGasUsed}`);
  console.log("----------------------------------------------------");

  // --- 3. Measure getCredential Gas Cost (view function - no gas for call) ---
  console.log("3. Testing 'getCredential' (view function)...");
  const credential = await credentialRegistry.getCredential(credentialId);
  console.log(`   - Issuer: ${credential.issuer}`);
  console.log(`   - Holder: ${credential.holder}`);
  console.log(`   - Revoked: ${credential.revoked}`);
  console.log(`   - (View functions don't consume gas when called off-chain)`);
  console.log("----------------------------------------------------");

  // --- 4. Measure revokeCredential Gas Cost ---
  console.log("4. Testing 'revokeCredential'...");
  const revokeTx = await credentialRegistry.connect(issuer).revokeCredential(credentialId);
  const revokeReceipt = await revokeTx.wait();
  const revokeGasUsed = revokeReceipt ? revokeReceipt.gasUsed.toString() : "N/A";

  console.log(`   - Credential revoked by issuer: ${issuer.address}`);
  console.log(`   - Transaction successful.`);
  console.log(`   - Gas Used: ${revokeGasUsed}`);
  console.log("----------------------------------------------------");

  // --- 5. Measure updateController Gas Cost ---
  console.log("5. Testing 'updateController'...");
  const updateControllerTx = await didRegistry.connect(issuer).updateController(issuerDid, verifier.address);
  const updateControllerReceipt = await updateControllerTx.wait();
  const updateControllerGasUsed = updateControllerReceipt ? updateControllerReceipt.gasUsed.toString() : "N/A";

  console.log(`   - DID control transferred from ${issuer.address} to ${verifier.address}`);
  console.log(`   - Transaction successful.`);
  console.log(`   - Gas Used: ${updateControllerGasUsed}`);
  console.log("----------------------------------------------------");

  console.log("\nGas Cost Summary:");
  console.log("===========================================");
  console.log(`registerDID:        ${registerGasUsed} gas`);
  console.log(`issueCredential:    ${issueGasUsed} gas`);
  console.log(`revokeCredential:   ${revokeGasUsed} gas`);
  console.log(`updateController:   ${updateControllerGasUsed} gas`);
  console.log("===========================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

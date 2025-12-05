import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const { ethers, network } = hre;
  console.log("Starting IDverse Contract Deployment...\n");
  console.log("Network:", network.name);

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy DIDRegistry
  const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
  const didRegistry = await DIDRegistry.deploy();
  await didRegistry.waitForDeployment();
  const didRegistryAddress = await didRegistry.getAddress();
  console.log("DIDRegistry deployed to:", didRegistryAddress);

  // Deploy CredentialRegistry
  const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
  const credentialRegistry = await CredentialRegistry.deploy(didRegistryAddress);
  await credentialRegistry.waitForDeployment();
  const credentialRegistryAddress = await credentialRegistry.getAddress();
  console.log("CredentialRegistry deployed to:", credentialRegistryAddress);

  // Deploy EventLogger
  const EventLogger = await ethers.getContractFactory("EventLogger");
  const eventLogger = await EventLogger.deploy();
  await eventLogger.waitForDeployment();
  const eventLoggerAddress = await eventLogger.getAddress();
  console.log("EventLogger deployed to:", eventLoggerAddress);

  // Save addresses to frontend
  const addressFile = path.join(__dirname, "../client/src/services/contract-addresses.json");
  const addresses = {
    DIDRegistry: didRegistryAddress,
    CredentialRegistry: credentialRegistryAddress,
    EventLogger: eventLoggerAddress,
  };

  fs.writeFileSync(addressFile, JSON.stringify(addresses, null, 2));
  console.log("\nSaved contract addresses to client/src/services/contract-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

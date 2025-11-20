import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function main({ ethers, network }) {
  console.log("🚀 Starting IDverse Contract Deployment...\n");
  console.log("Network:", network.name);

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(
    "💰 Account balance:",
    ethers.formatEther(balance),
    "ETH\n"
  );

  // Deploy DIDRegistry
  console.log("📦 Deploying DIDRegistry...");
  const didRegistry = await ethers.deployContract("DIDRegistry");
  const didRegistryAddress = await didRegistry.getAddress();
  console.log("✅ DIDRegistry deployed to:", didRegistryAddress);

  // Deploy CredentialRegistry
  console.log("\n📦 Deploying CredentialRegistry...");
  const credentialRegistry = await ethers.deployContract("CredentialRegistry");
  const credentialRegistryAddress = await credentialRegistry.getAddress();
  console.log(
    "✅ CredentialRegistry deployed to:",
    credentialRegistryAddress
  );

  // Deploy EventLogger
  console.log("\n📦 Deploying EventLogger...");
  const eventLogger = await ethers.deployContract("EventLogger");
  const eventLoggerAddress = await eventLogger.getAddress();
  console.log("✅ EventLogger deployed to:", eventLoggerAddress);

  // Prepare deployment data
  const deploymentData = {
    network: "localhost",
    chainId: 31337,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      DIDRegistry: {
        address: didRegistryAddress,
        transactionHash: didRegistry.deploymentTransaction()?.hash,
      },
      CredentialRegistry: {
        address: credentialRegistryAddress,
        transactionHash: credentialRegistry.deploymentTransaction()?.hash,
      },
      EventLogger: {
        address: eventLoggerAddress,
        transactionHash: eventLogger.deploymentTransaction()?.hash,
      },
    },
  };

  // Save deployment addresses
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentPath = path.join(deploymentsDir, "localhost.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
  console.log("\n💾 Deployment data saved to:", deploymentPath);

  // Export ABIs
  console.log("\n📄 Exporting contract ABIs...");
  const abisDir = path.join(__dirname, "..", "deployments", "abis");
  if (!fs.existsSync(abisDir)) {
    fs.mkdirSync(abisDir, { recursive: true });
  }

  // Read ABIs from artifacts
  const artifactsDir = path.join(__dirname, "..", "artifacts", "contracts");
  
  // Copy DIDRegistry ABI
  const didArtifact = JSON.parse(
    fs.readFileSync(
      path.join(artifactsDir, "IDverse.sol", "DIDRegistry.json"),
      "utf8"
    )
  );
  fs.writeFileSync(
    path.join(abisDir, "DIDRegistry.json"),
    JSON.stringify(didArtifact.abi, null, 2)
  );

  // Copy CredentialRegistry ABI
  const credArtifact = JSON.parse(
    fs.readFileSync(
      path.join(artifactsDir, "IDverse.sol", "CredentialRegistry.json"),
      "utf8"
    )
  );
  fs.writeFileSync(
    path.join(abisDir, "CredentialRegistry.json"),
    JSON.stringify(credArtifact.abi, null, 2)
  );

  // Copy EventLogger ABI
  const logArtifact = JSON.parse(
    fs.readFileSync(
      path.join(artifactsDir, "EventLogger.sol", "EventLogger.json"),
      "utf8"
    )
  );
  fs.writeFileSync(
    path.join(abisDir, "EventLogger.json"),
    JSON.stringify(logArtifact.abi, null, 2)
  );
  console.log("✅ ABIs exported to:", abisDir);

  // Create a simple addresses file for frontend
  const addressesPath = path.join(deploymentsDir, "addresses.json");
  const addresses = {
    DIDRegistry: didRegistryAddress,
    CredentialRegistry: credentialRegistryAddress,
    EventLogger: eventLoggerAddress,
  };
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log("✅ Contract addresses saved to:", addressesPath);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 Deployment Summary");
  console.log("=".repeat(60));
  console.log("Network:              localhost (Chain ID: 31337)");
  console.log("Deployer:            ", deployer.address);
  console.log("\nDeployed Contracts:");
  console.log("  DIDRegistry:       ", didRegistryAddress);
  console.log("  CredentialRegistry:", credentialRegistryAddress);
  console.log("  EventLogger:       ", eventLoggerAddress);
  console.log("\nFiles Created:");
  console.log("  Deployment Data:   ", deploymentPath);
  console.log("  Contract Addresses:", addressesPath);
  console.log("  Contract ABIs:     ", abisDir);
  console.log("=".repeat(60));

  // Verify deployments
  console.log("\n🔍 Verifying deployments...");
  const didCode = await ethers.provider.getCode(didRegistryAddress);
  const credCode = await ethers.provider.getCode(credentialRegistryAddress);
  const logCode = await ethers.provider.getCode(eventLoggerAddress);

  if (didCode === "0x" || credCode === "0x" || logCode === "0x") {
    console.error("❌ Deployment verification failed!");
    process.exit(1);
  }
  console.log("✅ All contracts verified successfully!");

  console.log("\n✨ Deployment complete! You can now:");
  console.log("  1. Run tests: npx hardhat test");
  console.log("  2. Interact with contracts using the deployed addresses");
  console.log("  3. Use the ABIs in your frontend application\n");
}

// If running directly, import hardhat and call main
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { default: hre } = await import("hardhat");
  main(hre)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("\n❌ Deployment failed:");
      console.error(error);
      process.exit(1);
    });
}

// scripts/deploy-local.mjs
import fs from "fs";
import path from "path";
import { JsonRpcProvider, Wallet, ContractFactory } from "ethers";
import "dotenv/config";

// CONFIG: provider URL and deployer private key.
// For local node use http://127.0.0.1:8545 and one of the printed dev private keys.
// You can set PRIVATE_KEY in .env or leave it blank to use the first Hardhat dev key below.
const RPC = process.env.RPC_URL || "http://127.0.0.1:8545";
const PRIVATE_KEY =
  process.env.PRIVATE_KEY ||
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // default dev key from Hardhat node

async function main() {
  console.log("RPC ->", RPC);
  console.log("Using private key ->", PRIVATE_KEY ? "[SET]" : "[MISSING]");

  const provider = new JsonRpcProvider(RPC);
  const wallet = new Wallet(PRIVATE_KEY, provider);

  // Load compiled artifact produced by Hardhat
  const artifactPath = path.join(
    process.cwd(),
    "artifacts",
    "contracts",
    "Counter.sol",
    "Counter.json"
  );

  if (!fs.existsSync(artifactPath)) {
    console.error("Artifact not found:", artifactPath);
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abi = artifact.abi;
  const bytecode = artifact.bytecode;

  console.log("Deploying contract with account:", await wallet.getAddress());
  const factory = new ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy(); // v6: deploy() returns contract with waitForDeployment available sometimes; we wait for tx
  // Wait for deployment tx to be mined (factory.deploy returns Contract type, wait for tx)
  const tx = await contract.deploymentTransaction(); // get the tx (v6)
  if (tx) {
    console.log("Tx hash:", tx.hash);
    await provider.waitForTransaction(tx.hash);
  }

  // The deployed address:
  console.log("Deployed at:", contract.target || contract.address || contract.getAddress?.());
  // show example call if present
  try {
    if (contract.getCount) {
      const v = await contract.getCount();
      console.log("getCount() ->", v.toString());
    }
  } catch (e) {
    // ignore
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

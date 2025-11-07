// scripts/sample-script.ts
import hre from "hardhat";

async function main() {
  const { ethers } = hre;
  const Factory = await ethers.getContractFactory("Counter");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  console.log("Deployed Counter at:", await contract.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

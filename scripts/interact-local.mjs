// scripts/interact-local.mjs
import fs from "fs";
import { JsonRpcProvider, Wallet, Contract } from "ethers";

const RPC = process.env.RPC_URL || "http://127.0.0.1:8545";
const PK  = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const ADDR = "0x850EC3780CeDfdb116E38B009d0bf7a1ef1b8b38"; // your deployed address

async function main(){
  const provider = new JsonRpcProvider(RPC);
  const wallet = new Wallet(PK, provider);

  const artifactPath = './artifacts/contracts/Counter.sol/Counter.json';
  if (!fs.existsSync(artifactPath)) throw new Error('Artifact not found: ' + artifactPath);
  const artifact = JSON.parse(fs.readFileSync(artifactPath,'utf8'));
  const c = new Contract(ADDR, artifact.abi, wallet);

  console.log("caller:", await wallet.getAddress());

  // READ: call view function `x`
  const current = await c.x();
  console.log("x() ->", current.toString());

  // TX: call inc()
  console.log("Calling inc()...");
  const tx1 = await c.inc();
  await tx1.wait();
  console.log("inc tx:", tx1.hash);
  console.log("x() after inc ->", (await c.x()).toString());

  // TX: call incBy(5) as example
  console.log("Calling incBy(5)...");
  const tx2 = await c.incBy(5);
  await tx2.wait();
  console.log("incBy tx:", tx2.hash);
  console.log("x() after incBy(5) ->", (await c.x()).toString());
}

main().catch(e=>{ console.error(e); process.exitCode = 1; });

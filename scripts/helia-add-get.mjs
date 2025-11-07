// scripts/helia-add-get.mjs
import { createHelia } from "helia";
import { unixfs } from "@helia/unixfs";
import { toString as uint8ToString } from "uint8arrays/to-string";
import { concat as uint8Concat } from "uint8arrays/concat";

async function main() {
  const node = await createHelia();
  const fs = unixfs(node);

  const credential = {
    id: "did:example:alice",
    name: "Alice Example",
    issuedAt: new Date().toISOString(),
  };
  const content = new TextEncoder().encode(JSON.stringify(credential));

  // addBytes returns a CID object
  const cid = await fs.addBytes(content);
  console.log("Stored CID:", cid.toString());

  // read back bytes using the async iterator returned by fs.cat(cid)
  const chunks = [];
  for await (const chunk of fs.cat(cid)) {
    chunks.push(chunk);
  }
  const bytes = uint8Concat(chunks);
  console.log("Read back:", uint8ToString(bytes));

  await node.stop();
}

main().catch((err) => {
  console.error("Helia error:", err);
  process.exit(1);
});


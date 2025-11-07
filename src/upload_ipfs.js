// src/upload_ipfs.js
import { create } from "ipfs-http-client";
import fs from "fs";
import path from "path";

// IPFS node endpoint (local or public gateway)
const ipfs = create({ url: "https://cloudflare-ipfs.com/api/v0" });

async function uploadFile(filePath) {
  try {
    const fileName = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);

    const result = await ipfs.add({
      path: fileName,
      content: fileContent,
    });

    console.log("✅ File uploaded to IPFS");
    console.log("CID:", result.cid.toString());
  } catch (err) {
    console.error("❌ Upload failed:", err);
  }
}

// Example: upload a model or metrics file
// Run with: node src/upload_ipfs.js ./models/model1.json
const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node src/upload_ipfs.js <file>");
  process.exit(1);
}
uploadFile(filePath);

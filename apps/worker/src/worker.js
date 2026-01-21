import { BlobServiceClient } from "@azure/storage-blob";
import { QueueClient } from "@azure/storage-queue";

function mustGetEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

/**
 * Normalize Azure Storage connection string so the SDK can parse it reliably.
 * - trims whitespace
 * - strips surrounding quotes
 * - removes newlines
 * - ensures EndpointSuffix exists if no explicit endpoints are present
 */
function normalizeConnStr(raw) {
  let cs = raw.trim();

  // strip surrounding quotes if present
  if (
    (cs.startsWith('"') && cs.endsWith('"')) ||
    (cs.startsWith("'") && cs.endsWith("'"))
  ) {
    cs = cs.slice(1, -1);
  }

  // remove hidden newlines
  cs = cs.replace(/\r?\n/g, "");

  const hasEndpointSuffix = cs.includes("EndpointSuffix=");
  const hasQueueEndpoint = cs.includes("QueueEndpoint=");
  const hasBlobEndpoint = cs.includes("BlobEndpoint=");

  // If this looks like a normal account connection string but is missing endpoints,
  // add the default Azure endpoint suffix.
  if (!hasEndpointSuffix && !hasQueueEndpoint && !hasBlobEndpoint) {
    cs += ";EndpointSuffix=core.windows.net";
  }

  return cs;
}

// ---- boot diagnostics (safe, no secrets) ----
const rawConnStr = mustGetEnv("AZURE_STORAGE_CONNECTION_STRING");
const connStr = normalizeConnStr(rawConnStr);

console.log(
  "[worker] AZURE_STORAGE_CONNECTION_STRING length:",
  connStr.length
);
console.log(
  "[worker] has EndpointSuffix?",
  connStr.includes("EndpointSuffix=")
);
console.log(
  "[worker] has QueueEndpoint?",
  connStr.includes("QueueEndpoint=")
);
console.log(
  "[worker] has BlobEndpoint?",
  connStr.includes("BlobEndpoint=")
);

// ---- required config ----
const containerName = mustGetEnv("AZURE_STORAGE_CONTAINER");
const queueName = mustGetEnv("AZURE_QUEUE_NAME");

// ---- Azure clients ----
const queueClient = new QueueClient(connStr, queueName);
const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
const containerClient =
  blobServiceClient.getContainerClient(containerName);

// ---- helpers ----
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function streamToBuffer(readable) {
  const chunks = [];
  for await (const chunk of readable) chunks.push(chunk);
  return Buffer.concat(chunks);
}

// ---- worker logic ----
async function processMessage(msg) {
  const payloadJson = Buffer.from(msg.messageText, "base64").toString("utf8");
  const payload = JSON.parse(payloadJson);

  const { applicationId, blobName } = payload;
  console.log("Processing job:", payload);

  const blobClient = containerClient.getBlobClient(blobName);
  const exists = await blobClient.exists();
  if (!exists) throw new Error(`Blob not found: ${blobName}`);

  const download = await blobClient.download();
  const buffer = await streamToBuffer(download.readableStreamBody);

  const analysis = {
    applicationId,
    blobName,
    byteLength: buffer.length,
    note: "MVP placeholder analysis. Next step: extract text and call AI.",
    processedAt: new Date().toISOString(),
  };

  console.log("Analysis complete:", analysis);
}

// TODO: message loop / receiveMessages logic goes here

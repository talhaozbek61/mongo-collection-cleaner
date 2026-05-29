#!/usr/bin/env node
import readline from "readline";
import { MongoClient } from "mongodb";
import { resolve } from "path";
import { fileURLToPath } from "url";

// Load .env from the same directory as this script (works when run globally via npm link)
const __dirname = fileURLToPath(new URL(".", import.meta.url));
try {
  process.loadEnvFile(resolve(__dirname, ".env"));
} catch {
  // .env not found — fall back to hardcoded defaults below
}

// ─── Default values — loaded from .env file ───────────────────────────────────
const DEFAULT_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017";
const DEFAULT_DB = process.env.MONGO_DB ?? "";
const DEFAULT_COLLECTIONS = process.env.MONGO_COLLECTIONS
  ? process.env.MONGO_COLLECTIONS.split(",").map((c) => c.trim())
  : [];

// ─── Readline interface ───────────────────────────────────────────────────────
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Asks a question and returns the user's answer as a Promise
function ask(question) {
  return new Promise((resolve) =>
    rl.question(question, (answer) => resolve(answer.trim())),
  );
}

// Shows the current value and asks the user to confirm or enter a new one
async function confirmDefault(label, currentVal) {
  console.log(`\n  ${label}: ${currentVal || "(empty)"}`);
  const choice = await ask("  Use this? (Y/n): ");
  if (choice.toLowerCase() === "n") {
    return await ask(`  Enter ${label}: `);
  }
  return currentVal;
}

// Shows the default collection list and asks user to confirm or enter a custom comma-separated list
// If no defaults are defined in .env, skips straight to manual entry
async function getCollections() {
  if (DEFAULT_COLLECTIONS.length === 0) {
    const input = await ask("\n  Enter collection names (comma-separated): ");
    return input.split(",").map((c) => c.trim()).filter(Boolean);
  }

  console.log("\n  Default collections:");
  DEFAULT_COLLECTIONS.forEach((c) => console.log(`    • ${c}`));
  const choice = await ask("  Use this list? (Y/n): ");

  if (choice.toLowerCase() === "n") {
    const input = await ask("  Enter collection names (comma-separated): ");
    return input.split(",").map((c) => c.trim()).filter(Boolean);
  }

  return [...DEFAULT_COLLECTIONS];
}

// Prints a formatted summary of everything the user configured before final confirmation
function printSummary(uri, dbName, collections) {
  const line = "─".repeat(50);
  console.log(`\n${line}`);
  console.log(`  URI:        ${uri}`);
  console.log(`  Database:   ${dbName}`);
  console.log(`  Collections to DROP (${collections.length}):`);
  collections.forEach((c) => console.log(`    • ${c}`));
  console.log(line);
  console.log("  ⚠  This will PERMANENTLY delete the above collections.");
  console.log(line);
}

// Connects to MongoDB and drops each collection; logs success or failure per collection
async function connectAndDrop(uri, dbName, collections) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("\n  Connected to MongoDB.\n");

    const db = client.db(dbName);

    for (const name of collections) {
      try {
        await db.collection(name).drop();
        console.log(`  ✓ Dropped: ${name}`);
      } catch (err) {
        // Collection may not exist — treat as a warning, not a fatal error
        console.log(`  ✗ Skipped: ${name} (${err.message})`);
      }
    }
  } finally {
    await client.close();
    console.log("\n  Disconnected. Done.\n");
  }
}

// Main flow: gathers all user input, shows summary, and runs the drop if confirmed
async function main() {
  console.log("\n══════════════════════════════════════════════════");
  console.log("       MongoDB Collection Cleaner");
  console.log("══════════════════════════════════════════════════\n");

  // Step 1 — MongoDB URI
  console.log("Step 1 — MongoDB URI");
  const uri = await confirmDefault("URI", DEFAULT_URI);

  // Step 2 — Database name
  console.log("\nStep 2 — Database Name");
  let dbName = await confirmDefault("Database", DEFAULT_DB);
  while (!dbName) {
    console.log("  Database name cannot be empty.");
    dbName = await ask("  Enter database name: ");
  }

  // Step 3 — Collections
  console.log("\nStep 3 — Collections to Drop");
  const collections = await getCollections();

  if (collections.length === 0) {
    console.log("\n  No collections selected. Exiting.");
    rl.close();
    return;
  }

  // Step 4 — Summary & final confirmation
  printSummary(uri, dbName, collections);
  const confirm = await ask('\n  Type "yes" to confirm and proceed: ');

  if (confirm !== "yes") {
    console.log("\n  Aborted. No changes were made.\n");
    rl.close();
    return;
  }

  rl.close();

  // Step 5 — Execute
  await connectAndDrop(uri, dbName, collections);
}

main().catch((err) => {
  console.error("\n  Fatal error:", err.message);
  process.exit(1);
});

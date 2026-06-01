import readline from "readline";
import { resolve } from "path";
import { fileURLToPath } from "url";

import { cyan, boldCyan, dim, red, boldRed } from "./colors.js";
import { fetchCollections, connectAndDrop } from "./db.js";
import { checkForUpdate, promptUpdate } from "./updater.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
try {
  process.loadEnvFile(resolve(__dirname, "../.env"));
} catch {
  // .env not found — fall back to hardcoded defaults below
}

const DEFAULT_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017";
const DEFAULT_DB = process.env.MONGO_DB ?? "";
const DEFAULT_COLLECTIONS = process.env.MONGO_COLLECTIONS
  ? process.env.MONGO_COLLECTIONS.split(",").map((c) => c.trim())
  : [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) =>
    rl.question(question, (answer) => resolve(answer.trim())),
  );
}

async function confirmDefault(label, currentVal) {
  console.log(`\n  ${dim(label + ":")} ${currentVal || dim("(empty)")}`);
  const choice = await ask("  Use this? (Y/n): ");
  if (choice.toLowerCase() === "n") {
    return await ask(`  Enter ${label}: `);
  }
  return currentVal;
}

function parseSelection(input, cols) {
  const trimmed = input.trim().toLowerCase();

  if (trimmed === "all" || trimmed === "*" || trimmed === "_") {
    return [...cols];
  }

  const indices = trimmed.split(",").map((s) => parseInt(s.trim(), 10));
  const valid = indices.filter((n) => !isNaN(n) && n >= 1 && n <= cols.length);

  return [...new Set(valid)].map((n) => cols[n - 1]);
}

async function getCollections(uri, dbName) {
  const hasDefaults = DEFAULT_COLLECTIONS.length > 0;

  console.log(`\n  ${dim("How would you like to select collections?")}`);
  console.log(`    ${boldCyan("1)")} Drop ALL collections in the database`);

  if (hasDefaults) {
    const preview =
      DEFAULT_COLLECTIONS.slice(0, 2).join(", ") +
      (DEFAULT_COLLECTIONS.length > 2 ? "..." : "");
    console.log(
      `    ${boldCyan("2)")} Use default list from .env ${dim("(" + preview + ")")}`,
    );
    console.log(`    ${boldCyan("3)")} Enter manually`);
  } else {
    console.log(`    ${boldCyan("2)")} Enter manually`);
  }

  const validOptions = hasDefaults ? ["1", "2", "3"] : ["1", "2"];
  let choice = "";
  while (!validOptions.includes(choice)) {
    choice = await ask(`\n  Enter option (1/${hasDefaults ? "2/3" : "2"}): `);
    if (!validOptions.includes(choice)) {
      console.log(
        `  ${red("Invalid option. Please enter " + validOptions.join(", ") + ".")}`,
      );
    }
  }

  if (choice === "1") {
    console.log(`\n  ${dim("Fetching collections from database...")}`);

    try {
      const cols = await fetchCollections(uri, dbName);
      if (cols.length === 0) {
        console.log(`  ${red("No collections found in database.")}`);
        return [];
      }

      console.log(`\n  ${dim("Found " + cols.length + " collection(s):")}`);
      cols.forEach((c, i) => console.log(`    ${boldCyan(i + 1 + ")")} ${c}`));
      console.log(
        `\n  ${dim('Enter numbers to drop (e.g. 1,3,5) or "all" / "*" / "_" for all:')}`,
      );

      let selected = [];
      while (selected.length === 0) {
        const input = await ask("  Your selection: ");
        selected = parseSelection(input, cols);
        if (selected.length === 0) {
          console.log(`  ${red("Invalid selection. Try again.")}`);
        }
      }

      return selected;
    } catch (err) {
      console.log(
        `  ${red("Could not connect to fetch collections:")} ${dim(err.message)}`,
      );
      console.log(`  ${dim("Falling back to manual entry.")}`);

      const input = await ask("\n  Enter collection names (comma-separated): ");
      return input
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
    }
  }

  if (hasDefaults && choice === "2") {
    console.log(`\n  ${dim("Default collections:")}`);

    DEFAULT_COLLECTIONS.forEach((c) => console.log(`    ${dim("•")} ${c}`));
    return [...DEFAULT_COLLECTIONS];
  }

  const input = await ask("\n  Enter collection names (comma-separated): ");
  return input
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

function printSummary(uri, dbName, collections) {
  const line = cyan("─".repeat(50));
  console.log(`\n${line}`);
  console.log(`  ${dim("URI:")}        ${uri}`);
  console.log(`  ${dim("Database:")}   ${dbName}`);
  console.log(
    `  ${dim("Collections to DROP")} ${dim("(" + collections.length + ")")}:`,
  );
  collections.forEach((c) => console.log(`    ${red("•")} ${c}`));
  console.log(line);
  console.log(
    `  ${boldRed("⚠")}  ${boldRed("This will PERMANENTLY delete the above collections.")}`,
  );
  console.log(line);
}

export async function main() {
  const border = cyan("══════════════════════════════════════════════════");
  console.log(`\n${border}`);
  console.log(boldCyan("       MongoDB Collection Cleaner"));
  console.log(`${border}\n`);

  const update = await checkForUpdate();
  if (update) await promptUpdate(update, ask, rl);

  console.log(boldCyan("Step 1 — MongoDB URI"));
  const uri = await confirmDefault("URI", DEFAULT_URI);

  console.log(`\n${boldCyan("Step 2 — Database Name")}`);
  let dbName = await confirmDefault("Database", DEFAULT_DB);
  while (!dbName) {
    console.log(red("  Database name cannot be empty."));
    dbName = await ask("  Enter database name: ");
  }

  console.log(`\n${boldCyan("Step 3 — Collections to Drop")}`);
  const collections = await getCollections(uri, dbName);

  if (collections.length === 0) {
    console.log(`\n  ${red("No collections selected. Exiting.")}`);
    rl.close();
    return;
  }

  printSummary(uri, dbName, collections);
  const confirm = await ask(
    `\n  Type ${boldCyan('"yes"')} to confirm and proceed: `,
  );

  if (confirm !== "yes") {
    console.log(`\n  ${dim("Aborted. No changes were made.")}\n`);
    rl.close();
    return;
  }

  rl.close();
  await connectAndDrop(uri, dbName, collections);
}

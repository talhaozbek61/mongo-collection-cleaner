import { MongoClient } from "mongodb";

import { green, red, dim } from "./colors.js";

export async function fetchCollections(uri, dbName) {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const cols = await client.db(dbName).listCollections().toArray();
    return cols.map((c) => c.name);
  } finally {
    await client.close();
  }
}

export async function connectAndDrop(uri, dbName, collections) {
  const client = new MongoClient(uri);
  let connected = false;
  try {
    await client.connect();
    connected = true;
    console.log(`\n  ${dim("Connected to MongoDB.")}\n`);

    const db = client.db(dbName);

    for (const name of collections) {
      try {
        await db.collection(name).drop();
        console.log(`  ${green("✓ Dropped:")} ${name}`);
      } catch (err) {
        // Collection may not exist — treat as a warning, not a fatal error
        console.log(
          `  ${red("✗ Skipped:")} ${name} ${dim("(" + err.message + ")")}`,
        );
      }
    }
  } finally {
    await client.close();
    if (connected) console.log(`\n  ${dim("Disconnected. Done.")}\n`);
  }
}

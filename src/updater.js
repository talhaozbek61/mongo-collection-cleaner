import { execSync } from "child_process";
import { readFileSync } from "fs";
import https from "https";
import { resolve as resolvePath } from "path";
import { fileURLToPath } from "url";

import { boldCyan, dim, green, red } from "./colors.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const pkgVersion = JSON.parse(
  readFileSync(resolvePath(__dirname, "../package.json"), "utf8"),
).version;

export function checkForUpdate() {
  return new Promise((resolve) => {
    const current = pkgVersion;
    const url = "https://registry.npmjs.org/mongo-collection-cleaner/latest";
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          resolve(null);
          return;
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const { version: latest } = JSON.parse(data);
            resolve(latest !== current ? { current, latest } : null);
          } catch {
            resolve(null);
          }
        });
      })
      .on("error", () => resolve(null));
  });
}

export async function promptUpdate({ current, latest }, ask, rl) {
  console.log(
    `\n  ${boldCyan("Update available!")} ${dim("v" + current)} → ${green("v" + latest)}`,
  );

  const answer = await ask("  ? Would you like to upgrade now? (Y/n): ");

  if (answer.toLowerCase() !== "n") {
    console.log(`\n  ${dim("Upgrading mcc...")}`);
    try {
      execSync("npm install -g mongo-collection-cleaner", { stdio: "inherit" });
      console.log(
        `\n  ${green("✓ Upgraded successfully!")} Please re-run ${boldCyan("mcc")}.\n`,
      );
      rl.close();
      process.exit(0);
    } catch {
      console.log(
        `  ${red("Upgrade failed.")} Run manually: ${dim("npm install -g mongo-collection-cleaner")}`,
      );
      console.log(`  ${dim("Continuing with current version...")}\n`);
    }
  }
}

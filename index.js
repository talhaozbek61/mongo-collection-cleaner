#!/usr/bin/env node
import { main } from "./src/cli.js";
import { red } from "./src/colors.js";

main().catch((err) => {
  console.error(red("\n  Fatal error:"), err.message);
  process.exit(1);
});

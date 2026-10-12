#!/usr/bin/env node

import { program } from "commander";
import { runInit } from "./command/init";
import pkg from "../package.json";

program
  .name("nextauthforge")
  .description("Plug-and-play authentication scaffolding for Next.js App Router")
  .version(pkg.version);

program
  .command("init")
  .description("Scaffold authentication into your Next.js project")
  .option("-y, --yes", "skip all prompts and use defaults")
  .option("--force", "overwrite existing files (a .bak backup is written first)")
  .option("--dry-run", "print what would happen without changing anything")
  .option("--no-install", "don't install dependencies")
  .option("--name <name>", "project name")
  .option("--db <database>", "database to use (mongodb)")
  .option("--ui", "include login & signup pages")
  .option("--no-ui", "skip login & signup pages")
  .option("--dashboard", "include the example dashboard")
  .option("--no-dashboard", "skip the example dashboard")
  .action(runInit);

program.parseAsync(process.argv).catch((err: Error) => {
  if (err.name === "ExitPromptError") {
    console.error("\nCancelled. Nothing further was changed.");
    process.exit(130);
  }
  console.error(`✖ ${err.message}`);
  process.exit(1);
});

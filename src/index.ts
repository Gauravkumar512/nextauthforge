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
  .action(runInit);

program.parse(process.argv);
#!/usr/bin/env node

import { program } from "commander";
import { runInit } from "./command/init";

program
  .name("authforge")
  .description("Plug-and-play authentication scaffolding for Next.js App Router")
  .version("1.0.0");

program
  .command("init")
  .description("Scaffold authentication into your Next.js project")
  .action(runInit);

program.parse(process.argv);
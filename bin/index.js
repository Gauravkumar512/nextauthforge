#!/usr/bin/env node
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 18 || (major === 18 && minor < 18)) {
  console.error(
    `nextauthforge requires Node.js >= 18.18 (you are running ${process.versions.node}).`
  );
  process.exit(1);
}

require("../dist/index.js");

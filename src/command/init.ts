import path from "path";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import fs from "fs-extra";
import { resolveChoices, UserChoices } from "../prompt";
import { envExampleDirs, generateFiles } from "../generator";
import {
  installCommands,
  installDependencies,
  missingDependencies,
  postInstallCommands,
  runPostInstall,
} from "../installer";
import { detectProject, DetectError, ProjectInfo } from "../detect";
import { patchLayout, ManualStep } from "../layout-patch";
import { writeEnvFiles, ensureGeneratedIgnored } from "../env-files";
import { FileContext, FileResult } from "../fileops";
import { InstallOutcome, PostInstall, printSummary } from "../summary";

export interface InitOptions {
  yes?: boolean;
  force?: boolean;
  dryRun?: boolean;
  /** `--no-install` sets this to false. */
  install?: boolean;
  name?: string;
  db?: string;
  email?: string;
  verifyEmail?: boolean;
  ui?: boolean;
  landing?: boolean;
  dashboard?: boolean;
}

function fail(message: string): never {
  console.error(chalk.red(`✖ ${message}`));
  process.exit(1);
}

function describe(project: ProjectInfo): string {
  return [
    `Next.js ${project.nextVersion}`,
    project.layout === "src" ? "src/ layout" : "root app/ layout",
    project.tailwind ? "Tailwind" : "no Tailwind",
    project.packageManager,
  ].join(" · ");
}

export async function runInit(options: InitOptions): Promise<void> {
  console.log(`\n${chalk.bold.hex("#e8ff47")("◆ NEXTAUTHFORGE")} ${chalk.white("— Next.js Auth Scaffolder")}\n`);

  const yes = options.yes === true;
  const dryRun = options.dryRun === true;

  let project: ProjectInfo;
  try {
    project = detectProject(process.cwd());
  } catch (err) {
    if (err instanceof DetectError) fail(err.message);
    throw err;
  }
  console.log(chalk.dim(`Detected: ${describe(project)}`));
  for (const w of project.warnings) console.log(chalk.yellow(`⚠ ${w}`));
  console.log("");

  let defaultName = path.basename(project.root);
  try {
    defaultName = fs.readJsonSync(path.join(project.root, "package.json")).name ?? defaultName;
  } catch {}

  let choices: UserChoices;
  try {
    choices = await resolveChoices(
      {
        name: options.name,
        db: options.db,
        email: options.email,
        verifyEmail: options.verifyEmail,
        ui: options.ui,
        landing: options.landing,
        dashboard: options.dashboard,
        yes,
      },
      defaultName
    );
  } catch (err: any) {
    if (err?.name === "ExitPromptError") throw err;
    fail(err.message);
  }

  // mongoose 9 and Prisma 7 (the pinned database packages) need Node 20.19+.
  const [nodeMajor, nodeMinor] = process.versions.node.split(".").map(Number);
  if (nodeMajor < 20 || (nodeMajor === 20 && nodeMinor < 19)) {
    console.log(
      chalk.yellow(
        `⚠ You are running Node ${process.versions.node}. The ${choices.database === "postgresql" ? "Prisma 7" : "mongoose 9"} package this template installs needs Node 20.19 or newer, so the generated app won't run on this Node version.`
      )
    );
  }

  if (!project.tailwind && (choices.includeUI || choices.includeLanding || choices.includeDashboard)) {
    console.log(
      chalk.yellow(
        "⚠ Tailwind CSS was not detected. The generated pages are styled with Tailwind and will look unstyled without it."
      )
    );
    if (!yes) {
      const { proceed } = await inquirer.prompt([
        { type: "confirm", name: "proceed", message: "Continue anyway?", default: true },
      ]);
      if (!proceed) fail("Cancelled. Nothing was changed.");
    }
  }

  const ctx: FileContext = {
    root: project.root,
    dryRun,
    yes,
    force: options.force === true,
  };

  const results: FileResult[] = [];
  let manual: ManualStep | undefined;
  try {
    results.push(...(await generateFiles(ctx, project, choices)));
    const layout = await patchLayout(ctx, project);
    results.push(layout.result);
    manual = layout.manual;
    results.push(...(await writeEnvFiles(ctx, envExampleDirs(choices), choices)));
    if (choices.database === "postgresql") {
      results.push(await ensureGeneratedIgnored(ctx, project.baseDir));
    }
  } catch (err: any) {
    if (err?.name === "ExitPromptError") throw err;
    fail(`Failed to scaffold files: ${err.message}`);
  }

  const plan = missingDependencies(project.root, choices);
  const commands = installCommands(project.packageManager, plan);
  let install: InstallOutcome;
  if (commands.length === 0) {
    install = { kind: "already" };
  } else {
    if (dryRun) {
      install = { kind: "dry-run", commands };
    } else if (options.install === false) {
      install = { kind: "skipped", commands };
    } else {
      const spinner = ora(`Installing dependencies (${commands.join(" && ")})...`).start();
      try {
        installDependencies(project.root, project.packageManager, plan);
        spinner.succeed(chalk.green("Dependencies installed"));
        install = { kind: "installed", commands };
      } catch (err: any) {
        spinner.fail(chalk.red("Failed to install dependencies"));
        console.error(err.message);
        console.error(chalk.dim(`Files were scaffolded. Install manually with: ${commands.join(" && ")}`));
        process.exit(1);
      }
    }
  }

  // `prisma generate` needs no database; it just builds the typed client.
  const generate = postInstallCommands(choices);
  let generated: PostInstall = generate.length === 0 ? { kind: "none" } : { kind: "pending", commands: generate };
  if (generate.length > 0 && !dryRun && options.install !== false) {
    const spinner = ora(`Running ${generate.join(" && ")}...`).start();
    try {
      runPostInstall(project.root, generate);
      spinner.succeed(chalk.green("Prisma client generated"));
      generated = { kind: "done", commands: generate };
    } catch (err: any) {
      spinner.fail(chalk.red("Failed to generate the Prisma client"));
      console.error(err.message);
      console.error(chalk.dim(`Run it manually: ${generate.join(" && ")}`));
      process.exit(1);
    }
  }

  printSummary({ project, choices, results, manual, install, generated, dryRun });
}

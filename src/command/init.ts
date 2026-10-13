import path from "path";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import fs from "fs-extra";
import { resolveChoices, UserChoices } from "../prompt";
import { envExampleDirs, generateFiles } from "../generator";
import { installCommands, installDependencies, missingDependencies } from "../installer";
import { detectProject, DetectError, ProjectInfo } from "../detect";
import { patchLayout, ManualStep } from "../layout-patch";
import { writeEnvFiles } from "../env-files";
import { FileContext, FileResult } from "../fileops";
import { InstallOutcome, printSummary } from "../summary";

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
        dashboard: options.dashboard,
        yes,
      },
      defaultName
    );
  } catch (err: any) {
    if (err?.name === "ExitPromptError") throw err;
    fail(err.message);
  }

  if (!project.tailwind && (choices.includeUI || choices.includeDashboard)) {
    console.log(
      chalk.yellow(
        "⚠ Tailwind CSS was not detected. The login, signup and dashboard templates are styled with Tailwind and will look unstyled without it."
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

  printSummary({ project, choices, results, manual, install, dryRun });
}

import inquirer from "inquirer";

export interface UserChoices {
  // Collected but not used yet; will be used for branding in Step 5.
  projectName: string;
  database: string;
  includeUI: boolean;
  includeDashboard: boolean;
}

export const DATABASES = ["mongodb"] as const;

export interface ChoiceFlags {
  name?: string;
  db?: string;
  ui?: boolean;
  dashboard?: boolean;
  /** Non-interactive: take defaults instead of prompting. */
  yes?: boolean;
}

/**
 * Resolves each choice from its flag when given; otherwise prompts for it,
 * or takes the default when running with --yes.
 */
export async function resolveChoices(
  flags: ChoiceFlags,
  defaultName: string
): Promise<UserChoices> {
  if (flags.db !== undefined && !(DATABASES as readonly string[]).includes(flags.db)) {
    throw new Error(
      `Unsupported --db "${flags.db}". Supported: ${DATABASES.join(", ")}.`
    );
  }
  if (flags.name !== undefined && flags.name.trim() === "") {
    throw new Error("--name cannot be empty.");
  }

  const defaults: UserChoices = {
    projectName: defaultName,
    database: "mongodb",
    includeUI: true,
    includeDashboard: true,
  };

  const questions: any[] = [];
  if (flags.name === undefined) {
    questions.push({
      type: "input",
      name: "projectName",
      message: "What is your project name?",
      default: defaults.projectName,
      validate: (input: string) =>
        input.trim().length > 0 ? true : "Project name cannot be empty",
    });
  }
  if (flags.db === undefined) {
    questions.push({
      type: "list",
      name: "database",
      message: "Which database are you using?",
      choices: [{ name: "MongoDB", value: "mongodb" }],
      default: defaults.database,
    });
  }
  if (flags.ui === undefined) {
    questions.push({
      type: "confirm",
      name: "includeUI",
      message: "Include login & signup pages?",
      default: defaults.includeUI,
    });
  }
  if (flags.dashboard === undefined) {
    questions.push({
      type: "confirm",
      name: "includeDashboard",
      message: "Include example dashboard?",
      default: defaults.includeDashboard,
    });
  }

  const answers = flags.yes || questions.length === 0 ? {} : await inquirer.prompt(questions);

  return {
    projectName: flags.name ?? answers.projectName ?? defaults.projectName,
    database: flags.db ?? answers.database ?? defaults.database,
    includeUI: flags.ui ?? answers.includeUI ?? defaults.includeUI,
    includeDashboard: flags.dashboard ?? answers.includeDashboard ?? defaults.includeDashboard,
  };
}

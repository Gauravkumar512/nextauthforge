import inquirer from "inquirer";

export interface UserChoices {
  // The brand shown in emails (and, from Step 5, in the UI).
  projectName: string;
  database: string;
  emailProvider: EmailProvider;
  requireEmailVerification: boolean;
  /** Login, signup, password and verification pages, error/not-found and legal pages. */
  includeUI: boolean;
  includeLanding: boolean;
  includeDashboard: boolean;
}

export const DATABASES = ["mongodb"] as const;
export const EMAIL_PROVIDERS = ["console", "smtp", "resend"] as const;
export type EmailProvider = (typeof EMAIL_PROVIDERS)[number];

export interface ChoiceFlags {
  name?: string;
  db?: string;
  email?: string;
  verifyEmail?: boolean;
  ui?: boolean;
  landing?: boolean;
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
  if (flags.email !== undefined && !(EMAIL_PROVIDERS as readonly string[]).includes(flags.email)) {
    throw new Error(
      `Unsupported --email "${flags.email}". Supported: ${EMAIL_PROVIDERS.join(", ")}.`
    );
  }
  if (flags.name !== undefined && flags.name.trim() === "") {
    throw new Error("--name cannot be empty.");
  }

  const defaults: UserChoices = {
    projectName: defaultName,
    database: "mongodb",
    emailProvider: "console",
    requireEmailVerification: false,
    includeUI: true,
    includeLanding: true,
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
  if (flags.email === undefined) {
    questions.push({
      type: "list",
      name: "emailProvider",
      message: "How should emails be sent?",
      choices: [
        { name: "Console (development only: prints emails to the server log)", value: "console" },
        { name: "SMTP (nodemailer)", value: "smtp" },
        { name: "Resend", value: "resend" },
      ],
      default: defaults.emailProvider,
    });
  }
  if (flags.verifyEmail === undefined) {
    questions.push({
      type: "confirm",
      name: "requireEmailVerification",
      message: "Require users to verify their email before they can sign in?",
      default: defaults.requireEmailVerification,
    });
  }
  if (flags.ui === undefined) {
    questions.push({
      type: "confirm",
      name: "includeUI",
      message: "Include the sign-in, sign-up and password pages (plus error and legal pages)?",
      default: defaults.includeUI,
    });
  }
  if (flags.landing === undefined) {
    questions.push({
      type: "confirm",
      name: "includeLanding",
      message: "Include a landing page?",
      default: defaults.includeLanding,
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
    emailProvider: (flags.email ?? answers.emailProvider ?? defaults.emailProvider) as EmailProvider,
    requireEmailVerification:
      flags.verifyEmail ?? answers.requireEmailVerification ?? defaults.requireEmailVerification,
    includeUI: flags.ui ?? answers.includeUI ?? defaults.includeUI,
    includeLanding: flags.landing ?? answers.includeLanding ?? defaults.includeLanding,
    includeDashboard: flags.dashboard ?? answers.includeDashboard ?? defaults.includeDashboard,
  };
}

import chalk from "chalk";
import ora from "ora";
import { askQuestions } from "../prompt";
import { generateFiles } from "../generator";
import { installDependencies } from "../installer";

export async function runInit(): Promise<void> {
  console.log(`\n${chalk.bold.hex("#e8ff47")("◆ AUTHFORGE")} ${chalk.white("— Next.js Auth Scaffolder")}\n`);

  // Step 1 — Ask questions
  const choices = await askQuestions();
  const targetDir = process.cwd();

  console.log("");

  // Step 2 — Copy template files
  const fileSpinner = ora("Scaffolding auth files...").start();
  try {
    await generateFiles(targetDir, choices);
    fileSpinner.succeed(chalk.green("Auth files scaffolded"));
  } catch (err: any) {
    fileSpinner.fail(chalk.red("Failed to scaffold files"));
    console.error(err.message);
    process.exit(1);
  }

  // Step 3 — Install dependencies
  const installSpinner = ora("Installing dependencies...").start();
  try {
    installDependencies(targetDir);
    installSpinner.succeed(chalk.green("Dependencies installed"));
  } catch (err: any) {
    installSpinner.fail(chalk.red("Failed to install dependencies"));
    console.error(err.message);
    process.exit(1);
  }

  // Step 4 — Success summary
  console.log(`
${chalk.bold.hex("#e8ff47")("✔ AuthForge setup complete!")}

${chalk.white.bold("Next steps:")}

  ${chalk.dim("1.")} Add your environment variables to ${chalk.cyan(".env.local")}:
     ${chalk.dim("MONGODB_URI=your_mongodb_connection_string")}
     ${chalk.dim("TOKEN_SECRET=your_secret_key_min_32_chars")}

  ${chalk.dim("2.")} Add ${chalk.cyan("<ToasterProvider />")} to your ${chalk.cyan("app/layout.tsx")}:

     ${chalk.dim("import ToasterProvider from '@/src/components/ToasterProvider'")}

     ${chalk.dim("export default function RootLayout({ children }) {")}
     ${chalk.dim("  return (")}
     ${chalk.dim("    <html>")}
     ${chalk.dim("      <body>")}
     ${chalk.dim("        <ToasterProvider />")}
     ${chalk.dim("        {children}")}
     ${chalk.dim("      </body>")}
     ${chalk.dim("    </html>")}
     ${chalk.dim("  )")}
     ${chalk.dim("}")}

  ${chalk.dim("3.")} Run your dev server:
     ${chalk.cyan("npm run dev")}

  ${chalk.dim("4.")} Visit ${chalk.cyan("http://localhost:3000")} to see your app

${chalk.dim("────────────────────────────────────────────────────")}
${chalk.dim("Auth routes available:")}
  ${chalk.dim("POST")} ${chalk.cyan("/api/auth/signup")}
  ${chalk.dim("POST")} ${chalk.cyan("/api/auth/login")}
  ${chalk.dim("POST")} ${chalk.cyan("/api/auth/logout")}
  ${chalk.dim("GET")}  ${chalk.cyan("/api/auth/me")}
  ${chalk.yellow("⚠ Your app/ was moved to src/app/")}
  ${chalk.dim(`Make sure your tsconfig.json has:
  "paths": { "@/*": ["./*"] }`)}
`);
}
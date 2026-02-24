import path from "path";
import fs from "fs-extra";
import { UserChoices } from "./prompt";

async function ensureSrcStructure(targetDir: string): Promise<void> {
  const srcDir = path.join(targetDir, "src");
  const rootAppDir = path.join(targetDir, "app");

  // If no src/ exists but app/ does — move app/ into src/
  if (!(await fs.pathExists(srcDir)) && await fs.pathExists(rootAppDir)) {
    await fs.ensureDir(srcDir);
    await fs.move(rootAppDir, path.join(srcDir, "app"));
    console.log("  ✓ Moved app/ into src/");
  }
}

export async function generateFiles(
  targetDir: string,
  choices: UserChoices
): Promise<void> {
  const templateDir = path.join(__dirname, "..", "templates", choices.database);

  // Move root app/ into src/ if needed — keeps all imports consistent
  await ensureSrcStructure(targetDir);

  const CORE_FILES = [
    { src: "app/api/auth/login/route.ts",        dest: "src/app/api/auth/login/route.ts" },
    { src: "app/api/auth/signup/route.ts",        dest: "src/app/api/auth/signup/route.ts" },
    { src: "app/api/auth/logout/route.ts",        dest: "src/app/api/auth/logout/route.ts" },
    { src: "app/api/auth/me/route.ts",            dest: "src/app/api/auth/me/route.ts" },
    { src: "lib/jwt.ts",                          dest: "src/lib/jwt.ts" },
    { src: "lib/session.ts",                      dest: "src/lib/session.ts" },
    { src: "lib/hash.ts",                         dest: "src/lib/hash.ts" },
    { src: "lib/dbConfig.ts",                     dest: "src/lib/dbConfig.ts" },
    { src: "models/user.models.js",               dest: "src/models/user.models.js" },
    { src: "proxy.ts",                            dest: "src/proxy.ts" },
    { src: ".env.example",                        dest: ".env.example" },
    { src: "hooks/useAuth.tsx",                    dest: "src/hooks/useAuth.tsx" },
    { src: "components/ToasterProvider.tsx",      dest: "src/components/ToasterProvider.tsx" },
  ];

  const UI_FILES = [
    { src: "app/(auth)/login/page.tsx",           dest: "src/app/(auth)/login/page.tsx" },
    { src: "app/(auth)/signup/page.tsx",          dest: "src/app/(auth)/signup/page.tsx" },
    { src: "app/page.tsx",                        dest: "src/app/page.tsx", overwrite: true },
  ];

  const DASHBOARD_FILES = [
    { src: "app/dashboard/page.tsx",              dest: "src/app/dashboard/page.tsx" },
  ];

  const filesToCopy = [
    ...CORE_FILES,
    ...(choices.includeUI ? UI_FILES : []),
    ...(choices.includeDashboard ? DASHBOARD_FILES : []),
  ];

  for (const file of filesToCopy) {
    const srcPath = path.join(templateDir, file.src);
    const destPath = path.join(targetDir, file.dest);

    if (!(await fs.pathExists(srcPath))) {
      console.warn(`⚠ Template file not found, skipping: ${file.src}`);
      continue;
    }

    await fs.ensureDir(path.dirname(destPath));
    const shouldOverwrite = (file as any).overwrite === true;
    await fs.copy(srcPath, destPath, { overwrite: shouldOverwrite });
  }
}
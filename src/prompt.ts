import inquirer from "inquirer";

export interface UserChoices {
  projectName: string;
  database: string;
  includeUI: boolean;
  includeDashboard: boolean;
}

export async function askQuestions(): Promise<UserChoices> {
  return inquirer.prompt([
    {
      type: "input",
      name: "projectName",
      message: "What is your project name?",
      default: "my-app",
      validate: (input: string) =>
        input.trim().length > 0 ? true : "Project name cannot be empty",
    },
    {
      type: "list",
      name: "database",
      message: "Which database are you using?",
      default: "mongodb",
    },
    {
      type: "confirm",
      name: "includeUI",
      message: "Include login & signup pages?",
      default: true,
    },
    {
      type: "confirm",
      name: "includeDashboard",
      message: "Include example dashboard & profile pages?",
      default: true,
    },
  ]);
}
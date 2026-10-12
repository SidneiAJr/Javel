import chalk from 'chalk';
import { Command } from 'commander';
import { generateProject } from '../stubs';
import { createDir, writeFiles } from '../utils/fs';

export function registerNewCommand(program: Command): void {
  program
    .command('new <project-name>')
    .description('Create a new Spring Boot project')
    .action(async (projectName: string) => {
      console.log(chalk.cyan(`→ Creating project ${chalk.bold(projectName)}...`));

      try {
        const files = generateProject(projectName);
        await createDir(projectName);
        await writeFiles(projectName, files);

        console.log(chalk.green(`✔ Project ${projectName} created!`));
        console.log(`\n  cd ${projectName}`);
        console.log(`  javel serve\n`);
      } catch (err: any) {
        console.error(chalk.red(`✖ Failed to create project: ${err.message}`));
        process.exit(1);
      }
    });
}
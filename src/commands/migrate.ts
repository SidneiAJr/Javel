import chalk from 'chalk';
import { spawn } from 'child_process';
import { Command } from 'commander';

function runMavenExec(goal: string, label: string): void {
  console.log(chalk.cyan(`${label}...\n`));

  const proc = spawn(
    'mvn',
    [
      'compile',
      'exec:java',
      `-Dexec.mainClass=com.javel.MigrationCLI`,
      `-Dexec.args=${goal}`,
      `-Dexec.classpathScope=runtime`,
    ],
    { stdio: 'inherit', shell: true }
  );

  proc.on('error', (err) => {
    console.error(chalk.red(`✖ Erro: ${err.message}`));
  });

  proc.on('close', (code) => {
    if (code !== 0) {
      console.log(chalk.red(`\nSaiu com código ${code}`));
    }
  });
}

export function registerMigrateCommand(program: Command): void {
  program
    .command('migrate')
    .description('Roda as migrations pendentes')
    .action(() => runMavenExec('migrate', 'Rodando migrations'));

  program
    .command('migrate:rollback')
    .description('Reverte a última migration')
    .action(() => runMavenExec('rollback', 'Revertendo última migration'));
}
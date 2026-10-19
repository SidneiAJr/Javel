import { spawn } from 'child_process';
import { Command } from 'commander';

function runMavenExec(goal: string, label: string): void {
  console.log(`${label}...\n`);

  const proc = spawn(
    'mvn',
    [
      'compile',
      'exec:java',
      '-Dexec.mainClass=com.javel.MigrationCLI',
      `-Dexec.args=${goal}`,
      '-Dexec.classpathScope=runtime',
    ],
    { stdio: 'inherit', shell: true }
  );

  proc.on('error', (err) => {
    console.error(`Erro / Error: ${err.message}`);
  });

  proc.on('close', (code) => {
    if (code !== 0) {
      console.log(`\nFalhou com codigo / Failed with code: ${code}`);
    }
  });
}

export function registerMigrateCommand(program: Command): void {
  program
    .command('migrate')
    .description('Roda as migrations pendentes / Run pending migrations')
    .action(() => runMavenExec('migrate', 'Rodando migrations / Running migrations'));

  program
    .command('migrate:rollback')
    .description('Reverte a ultima migration / Rollback last migration')
    .action(() => runMavenExec('rollback', 'Revertendo / Rolling back'));
}
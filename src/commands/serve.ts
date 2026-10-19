import { spawn } from 'child_process';
import { Command } from 'commander';

export function registerServeCommand(program: Command): void {
  program
    .command('serve')
    .description('Start the dev server (mvn spring-boot:run)')
    .action(() => {
      console.log('Starting dev server...\n');

      const proc = spawn('mvn', ['spring-boot:run'], { stdio: 'inherit', shell: true });

      proc.on('error', (err) => {
        console.error(`Failed to start server: ${err.message}`);
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          console.log(`\nServer exited with code ${code}`);
        }
      });
    });
}
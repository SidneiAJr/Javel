import { Command } from 'commander';
import { registerNewCommand } from './new';
import { registerMakeCommand } from './make';
import { registerServeCommand } from './serve';
import { registerMigrateCommand } from './migrate';

export function registerCommands(program: Command): void {
  registerNewCommand(program);
  registerMakeCommand(program);
  registerServeCommand(program);
  registerMigrateCommand(program);
}
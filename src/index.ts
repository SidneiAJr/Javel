#!/usr/bin/env node

import { Command } from 'commander';
import { registerCommands } from './commands';

const program = new Command();

program
  .name('javel')
  .description('Laravel-style CLI for Spring Boot projects')
  .version('0.1.0');

registerCommands(program);

program.parse(process.argv);

import { Command } from 'commander';
import { getStub } from '../stubs';
import { writeFile, parseApplicationProperties } from '../utils/fs';
import { extractDbConfig, createDatabase } from '../utils/db';
import { getApiStubs } from '../stubs/make';

const makeables = ['controller', 'model', 'service', 'repository', 'migration'] as const;

export function registerMakeCommand(program: Command): void {
  for (const type of makeables) {
    program
      .command(`make:${type} <name>`)
      .description(`Generate a ${type}`)
      .action(async (name: string) => {
        try {
          const { path, content } = await getStub(type, name);
          await writeFile(path, content);
          console.log(`✔ Created ${path}`);
        } catch (err: any) {
          console.error(`✖ Error: ${err.message}`);
        }
      });
  }

  program
    .command('make:db <driver>')
    .description('Generate database configuration (h2, mysql, postgres)')
    .action(async (driver: string) => {
      try {
        const { path, content } = await getStub('db', driver);
        await writeFile(path, content);
        console.log(`✔ Created ${path}`);
      } catch (err: any) {
        console.error(`✖ Error: ${err.message}`);
      }
    });

  program
    .command('make:db:create')
    .description('Create the physical database based on application.properties')
    .action(async () => {
      try {
        const props = await parseApplicationProperties();
        const config = extractDbConfig(props);

        if (config.driver === 'h2') {
          console.log('⚠ H2 não precisa de criação manual — o banco é criado automaticamente.');
          return;
        }

        console.log(`→ Creating database "${config.database}"...`);

        try {
          const { skipped } = await createDatabase(config);

          if (skipped) {
            console.log(`⚠ Banco "${config.database}" é gerenciado automaticamente.`);
          } else {
            console.log(`✔ Banco "${config.database}" criado com sucesso!`);
          }
        } catch (err: any) {
          console.error(`✖ Falha ao criar o banco: ${err.message}`);
          process.exit(1);
        }
      } catch (err: any) {
        console.error(`✖ Error: ${err.message}`);
        process.exit(1);
      }
    });

  program
    .command('make:api <name>')
    .description('Generate controller + service + repository + model + DTO')
    .action(async (name: string) => {
      try {
        const files = await getApiStubs(name);
        for (const { path, content } of files) {
          await writeFile(path, content);
          console.log(`✔ Created ${path}`);
        }
        console.log(`\n✔ API ${name} generated!\n`);
      } catch (err: any) {
        console.error(`✖ Error: ${err.message}`);
      }
    });
}
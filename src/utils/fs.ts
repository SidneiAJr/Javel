import fsExtra from 'fs-extra';
import path from 'path';

export async function createDir(dir: string): Promise<void> {
  await fsExtra.ensureDir(dir);
}

export async function writeFiles(base: string, files: Record<string, string>): Promise<void> {
  for (const [filePath, content] of Object.entries(files)) {
    await writeFile(path.join(base, filePath), content);
  }
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  await fsExtra.ensureDir(path.dirname(filePath));
  await fsExtra.writeFile(filePath, content, 'utf-8');
}

export async function readFile(filePath: string): Promise<string> {
  return fsExtra.readFile(filePath, 'utf-8');
}

export async function fileExists(filePath: string): Promise<boolean> {
  return fsExtra.pathExists(filePath);
}

export async function getProjectGroupId(): Promise<string | null> {
  const pomPath = path.join(process.cwd(), 'pom.xml');
  if (!(await fileExists(pomPath))) return null;

  const content = await readFile(pomPath);
  const matches = Array.from(content.matchAll(/<groupId>(.*?)<\/groupId>/g), m => m[1]);

  if (matches.length === 0) return null;
  return matches.length > 1 ? matches[1] : matches[0];
}

export async function parseApplicationProperties(): Promise<Record<string, string>> {
  const propsPath = path.join(
    process.cwd(),
    'src/main/resources/application.properties'
  );

  if (!(await fileExists(propsPath))) {
    throw new Error(
      'application.properties não encontrado. Rode este comando na raiz de um projeto Javel.'
    );
  }

  const content = await readFile(propsPath);
  const result: Record<string, string> = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    result[key] = value;
  }

  return result;
}

export async function parseMigrationFields(
  name: string,
  groupId: string
): Promise<string[]> {
  const migrationDir = path.join(
    process.cwd(),
    `src/main/java/${groupId.replace(/\./g, '/')}/migration`
  );

  if (!(await fileExists(migrationDir))) return [];

  // Varre todos os .java da pasta migration
  const files = await fsExtra.readdir(migrationDir);
  const tableName = name.toLowerCase() + 's';

  let content: string | null = null;

  for (const file of files) {
    if (!file.endsWith('.java')) continue;
    const raw = await readFile(path.join(migrationDir, file));
    // Procura qualquer migration que crie a tabela do model
    if (raw.includes(`"${tableName}"`) || raw.includes(`'${tableName}'`)) {
      content = raw;
      break;
    }
  }

  if (!content) return [];

  const lambdaMatch = content.match(
    /schema\.create\(\s*["'][^"']+["']\s*,\s*(?:table|\w+)\s*->\s*\{([\s\S]*?)\}\s*\)/
  );
  if (!lambdaMatch) return [];

  const body = lambdaMatch[1];

  const typeMap: Record<string, string> = {
    string:     'String',
    text:       'String',
    integer:    'Integer',
    bigInteger: 'Long',
    bool:       'Boolean',
    boolean:    'Boolean',
    decimal:    'Double',
    float:      'Float',
    date:       'java.time.LocalDate',
    dateTime:   'java.time.LocalDateTime',
    timestamp:  'java.time.LocalDateTime',
  };

  const fields: string[] = [];

  const lineRegex = /table\.(\w+)\(\s*["'](\w+)["']/g;
  let match;
  while ((match = lineRegex.exec(body)) !== null) {
    const [, method, fieldName] = match;
    const javaType = typeMap[method];
    if (!javaType) continue;

    const camel = fieldName.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
    fields.push(`  private ${javaType} ${camel};`);
  }

  return fields;
}
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

// ---- Novas funções ----

export async function readFile(filePath: string): Promise<string> {
  return fsExtra.readFile(filePath, 'utf-8');
}

export async function fileExists(filePath: string): Promise<boolean> {
  return fsExtra.pathExists(filePath);
}

/**
 * Lê o pom.xml da raiz do projeto atual e extrai o groupId.
 * Ignora o groupId do <parent> (que é do Spring Boot) e pega o do projeto.
 * Retorna null se o pom.xml não existir ou não tiver groupId.
 */
export async function getProjectGroupId(): Promise<string | null> {
  const pomPath = path.join(process.cwd(), 'pom.xml');
  if (!(await fileExists(pomPath))) return null;

  const content = await readFile(pomPath);
  const matches = Array.from(content.matchAll(/<groupId>(.*?)<\/groupId>/g), m => m[1]);

  if (matches.length === 0) return null;
  // O primeiro groupId é do <parent> (Spring Boot). O do projeto é o segundo.
  // Se só tiver um, é porque não tem parent — usa ele mesmo.
  return matches.length > 1 ? matches[1] : matches[0];
}

/**
 * Lê o application.properties da raiz do projeto atual e retorna um objeto chave/valor.
 * Ignora linhas comentadas (# ...) e linhas vazias.
 */
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
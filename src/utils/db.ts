import mysql from 'mysql2/promise';
import { Client as PgClient } from 'pg';

export interface DbConfig {
  driver: 'mysql' | 'postgres' | 'h2' | 'unknown';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

/**
 * Extrai a config do banco a partir do application.properties já parseado.
 */
export function extractDbConfig(props: Record<string, string>): DbConfig {
  const url = props['spring.datasource.url'];
  const username = props['spring.datasource.username'] || '';
  const password = props['spring.datasource.password'] || '';
  const driverClass = props['spring.datasource.driver-class-name'] || '';

  if (!url) {
    throw new Error('spring.datasource.url não encontrado no application.properties');
  }

  // Detecta o driver
  let driver: DbConfig['driver'] = 'unknown';
  if (driverClass.includes('h2') || url.startsWith('jdbc:h2')) driver = 'h2';
  else if (driverClass.includes('mysql') || url.startsWith('jdbc:mysql')) driver = 'mysql';
  else if (driverClass.includes('postgresql') || url.startsWith('jdbc:postgresql')) driver = 'postgres';

  // Parse da URL JDBC
  let host = 'localhost';
  let port = 0;
  let database = '';

  if (driver === 'mysql') {
    // jdbc:mysql://localhost:3306/meuprojeto?params
    const match = url.match(/jdbc:mysql:\/\/([^:/]+):(\d+)\/([^?]+)/);
    if (match) {
      host = match[1];
      port = parseInt(match[2], 10);
      database = match[3];
    }
  } else if (driver === 'postgres') {
    // jdbc:postgresql://localhost:5432/meuprojeto
    const match = url.match(/jdbc:postgresql:\/\/([^:/]+):(\d+)\/([^?]+)/);
    if (match) {
      host = match[1];
      port = parseInt(match[2], 10);
      database = match[3];
    }
  } else if (driver === 'h2') {
    // jdbc:h2:mem:testdb
    const match = url.match(/jdbc:h2:mem:([^;]+)/);
    if (match) database = match[1];
  }

  return { driver, host, port, database, username, password };
}

/**
 * Cria o banco físico no MySQL.
 */
async function createMySQLDatabase(config: DbConfig): Promise<void> {
  const conn = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
  });

  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);
  } finally {
    await conn.end();
  }
}

/**
 * Cria o banco físico no Postgres.
 */
async function createPostgresDatabase(config: DbConfig): Promise<void> {
  // Conecta no banco default "postgres" pra poder criar outro
  const client = new PgClient({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: 'postgres',
  });

  await client.connect();
  try {
    // Postgres não tem "IF NOT EXISTS" pra CREATE DATABASE — precisa checar antes
    const check = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [config.database]
    );
    if (check.rowCount === 0) {
      await client.query(`CREATE DATABASE "${config.database}"`);
    }
  } finally {
    await client.end();
  }
}

/**
 * Orquestra: detecta o driver e cria o banco.
 * Retorna { created: boolean, skipped: boolean }
 */
export async function createDatabase(
  config: DbConfig
): Promise<{ created: boolean; skipped: boolean }> {
  if (config.driver === 'h2') {
    return { created: false, skipped: true };
  }
  if (config.driver === 'mysql') {
    await createMySQLDatabase(config);
    return { created: true, skipped: false };
  }
  if (config.driver === 'postgres') {
    await createPostgresDatabase(config);
    return { created: true, skipped: false };
  }
  throw new Error(`Driver não suportado: ${config.driver}`);
}
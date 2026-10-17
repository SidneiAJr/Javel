import { getProjectGroupId } from '../utils/fs';

type StubType = 'controller' | 'model' | 'service' | 'repository' | 'migration' | 'db' | 'api';

interface StubResult {
  path: string;
  content: string;
}

// Helpers para montar caminho e nome do pacote
function getPackagePath(groupId: string, subPackage: string): string {
  const basePath = groupId.replace(/\./g, '/');
  return `src/main/java/${basePath}/${subPackage}`;
}

function getPackageName(groupId: string, subPackage: string): string {
  return `${groupId}.${subPackage}`;
}

export async function getStub(type: StubType, name: string): Promise<StubResult> {
  const groupId = await getProjectGroupId();

  if (!groupId && type !== 'db' && type !== 'migration') {
    throw new Error(
      'pom.xml não encontrado ou groupId ausente. Execute este comando na raiz de um projeto Javel.'
    );
  }

  const baseGroupId = groupId || 'com.example';

  const stubs: Record<StubType, () => StubResult> = {
    controller: () => {
      const pkg = getPackageName(baseGroupId, 'controller');
      const path = `${getPackagePath(baseGroupId, 'controller')}/${name}Controller.java`;
      return { path, content: controllerStub(name, pkg, baseGroupId) };
    },
    model: () => {
      const pkg = getPackageName(baseGroupId, 'model');
      const path = `${getPackagePath(baseGroupId, 'model')}/${name}.java`;
      return { path, content: modelStub(name, pkg) };
    },
    service: () => {
      const pkg = getPackageName(baseGroupId, 'service');
      const path = `${getPackagePath(baseGroupId, 'service')}/${name}Service.java`;
      return { path, content: serviceStub(name, pkg, baseGroupId) };
    },
    repository: () => {
      const pkg = getPackageName(baseGroupId, 'repository');
      const path = `${getPackagePath(baseGroupId, 'repository')}/${name}Repository.java`;
      return { path, content: repositoryStub(name, pkg, baseGroupId) };
    },
    migration: () => ({
      path: `src/main/java/${baseGroupId.replace(/\./g, '/')}/migration/${name}.java`,
      content: migrationStub(name, baseGroupId),
    }),
    db: () => ({
      path: `src/main/resources/application.properties`,
      content: dbStub(name),
    }),
    api: () => ({
      path: `${getPackagePath(baseGroupId, 'controller')}/${name}Controller.java`,
      content: '',
    }),
  };

  return stubs[type]();
}

export async function getApiStubs(name: string): Promise<StubResult[]> {
  const groupId = await getProjectGroupId();
  if (!groupId) {
    throw new Error('pom.xml não encontrado ou groupId ausente.');
  }

  return [
    {
      path: `${getPackagePath(groupId, 'model')}/${name}.java`,
      content: modelStub(name, getPackageName(groupId, 'model')),
    },
    {
      path: `${getPackagePath(groupId, 'dto')}/${name}DTO.java`,
      content: dtoStub(name, getPackageName(groupId, 'dto')),
    },
    {
      path: `${getPackagePath(groupId, 'repository')}/${name}Repository.java`,
      content: repositoryStub(name, getPackageName(groupId, 'repository'), groupId),
    },
    {
      path: `${getPackagePath(groupId, 'service')}/${name}Service.java`,
      content: serviceStub(name, getPackageName(groupId, 'service'), groupId),
    },
    {
      path: `${getPackagePath(groupId, 'controller')}/${name}Controller.java`,
      content: controllerStub(name, getPackageName(groupId, 'controller'), groupId),
    },
  ];
}

// ---- Stubs com Lombok e imports corretos ----

function controllerStub(name: string, pkg: string, baseGroupId: string): string {
  const serviceImport = `${baseGroupId}.service.${name}Service`;
  const dtoImport = `${baseGroupId}.dto.${name}DTO`;

  return `package ${pkg};

import ${serviceImport};
import ${dtoImport};
import lombok.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.List;

@RestController
@RequestMapping("/api/${name.toLowerCase()}s")
@RequiredArgsConstructor
public class ${name}Controller {

  private final ${name}Service ${name.toLowerCase()}Service;

  @GetMapping
  public ResponseEntity<List<${name}DTO>> findAll() {
    return ResponseEntity.ok(${name.toLowerCase()}Service.findAll());
  }

  @GetMapping("/{id}")
  public ResponseEntity<${name}DTO> findById(@PathVariable Long id) {
    return ResponseEntity.ok(${name.toLowerCase()}Service.findById(id));
  }

  @PostMapping
  public ResponseEntity<${name}DTO> create(@RequestBody ${name}DTO dto) {
    return ResponseEntity.ok(${name.toLowerCase()}Service.create(dto));
  }

  @PutMapping("/{id}")
  public ResponseEntity<${name}DTO> update(@PathVariable Long id, @RequestBody ${name}DTO dto) {
    return ResponseEntity.ok(${name.toLowerCase()}Service.update(id, dto));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    ${name.toLowerCase()}Service.delete(id);
    return ResponseEntity.noContent().build();
  }
}`;
}

function modelStub(name: string, pkg: string): string {
  return `package ${pkg};

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "${name.toLowerCase()}s")
public class ${name} {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  // TODO: add fields
}`;
}

function dtoStub(name: string, pkg: string): string {
  return `package ${pkg};

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ${name}DTO {

  private Long id;

  // TODO: add fields
}`;
}

function serviceStub(name: string, pkg: string, baseGroupId: string): string {
  const repoImport = `${baseGroupId}.repository.${name}Repository`;
  const dtoImport = `${baseGroupId}.dto.${name}DTO`;

  return `package ${pkg};

import ${repoImport};
import ${dtoImport};
import lombok.*;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ${name}Service {

  private final ${name}Repository ${name.toLowerCase()}Repository;

  public List<${name}DTO> findAll() {
    // TODO: implement
    return List.of();
  }

  public ${name}DTO findById(Long id) {
    // TODO: implement
    return new ${name}DTO();
  }

  public ${name}DTO create(${name}DTO dto) {
    // TODO: implement
    return dto;
  }

  public ${name}DTO update(Long id, ${name}DTO dto) {
    // TODO: implement
    return dto;
  }

  public void delete(Long id) {
    // TODO: implement
  }
}`;
}

function repositoryStub(name: string, pkg: string, baseGroupId: string): string {
  const modelImport = `${baseGroupId}.model.${name}`;

  return `package ${pkg};

import ${modelImport};
import org.springframework.data.jpa.repository.JpaRepository;

public interface ${name}Repository extends JpaRepository<${name}, Long> {
}`;
}

function migrationStub(name: string, groupId: string): string {
  const tableName = name
    .replace(/^Create/i, '')
    .replace(/Table$/i, '')
    .toLowerCase();

  const tableNamePlural = tableName.endsWith('s') ? tableName : tableName + 's';

  return `package ${groupId}.migration;

import com.javel.Migration;
import com.javel.Schema;
import com.javel.History;

public class ${name} extends Migration {

    @Override
    public void up(Schema schema) {
        schema.create("${tableNamePlural}", table -> {
            table.id();
            // TODO: add columns
        });
    }

    @Override
    public void down(Schema schema) {
        schema.drop("${tableNamePlural}");
    }

    @Override
    public History history() {
        return History.of(
            // "2026-10-12 - seu nome - Criou tabela ${tableNamePlural}"
        );
    }
}`;
}

function dbStub(driver: string): string {
  const configs: Record<string, string> = {
    h2: `# App
spring.application.name=app
server.port=8080

# H2 (in-memory)
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

# JPA
spring.jpa.show-sql=true
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.jpa.open-in-view=false

# H2 Console
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console

# Flyway
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration`,

    mysql: `# App
spring.application.name=app
server.port=8080

# MySQL
spring.datasource.url=jdbc:mysql://localhost:3306/db_name?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.username=root
spring.datasource.password=

# JPA
spring.jpa.show-sql=true
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect
spring.jpa.open-in-view=false

# Flyway
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration`,

    postgres: `# App
spring.application.name=app
server.port=8080

# PostgreSQL
spring.datasource.url=jdbc:postgresql://localhost:5432/db_name
spring.datasource.driver-class-name=org.postgresql.Driver
spring.datasource.username=postgres
spring.datasource.password=

# JPA
spring.jpa.show-sql=true
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.open-in-view=false

# Flyway
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration`,
  };

  const config = configs[driver.toLowerCase()];
  if (!config) {
    throw new Error(`Unknown driver "${driver}". Use: h2, mysql or postgres`);
  }
  return config;
}
import { getProjectGroupId, parseMigrationFields } from '../utils/fs';

type StubType = 'controller' | 'model' | 'service' | 'repository' | 'migration' | 'db' | 'api';

interface StubResult {
  path: string;
  content: string;
}

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

  if (type === 'model') {
    const pkg = getPackageName(baseGroupId, 'model');
    const path = `${getPackagePath(baseGroupId, 'model')}/${name}.java`;
    const fields = await parseMigrationFields(name, baseGroupId);
    return { path, content: modelStub(name, pkg, fields) };
  }

  if (type === 'service') {
    const pkg = getPackageName(baseGroupId, 'service');
    const path = `${getPackagePath(baseGroupId, 'service')}/${name}Service.java`;
    const fields = await parseMigrationFields(name, baseGroupId);
    return { path, content: serviceStub(name, pkg, baseGroupId, fields) };
  }

  const stubs: Record<Exclude<StubType, 'model' | 'service'>, () => StubResult> = {
    controller: () => {
      const pkg = getPackageName(baseGroupId, 'controller');
      const path = `${getPackagePath(baseGroupId, 'controller')}/${name}Controller.java`;
      return { path, content: controllerStub(name, pkg, baseGroupId) };
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

  return stubs[type as Exclude<StubType, 'model' | 'service'>]();
}

export async function getApiStubs(name: string): Promise<StubResult[]> {
  const groupId = await getProjectGroupId();
  if (!groupId) {
    throw new Error('pom.xml não encontrado ou groupId ausente.');
  }

  const fields = await parseMigrationFields(name, groupId);

  return [
    {
      path: `${getPackagePath(groupId, 'model')}/${name}.java`,
      content: modelStub(name, getPackageName(groupId, 'model'), fields),
    },
    {
      path: `${getPackagePath(groupId, 'dto')}/${name}DTO.java`,
      content: dtoStub(name, getPackageName(groupId, 'dto'), fields),
    },
    {
      path: `${getPackagePath(groupId, 'repository')}/${name}Repository.java`,
      content: repositoryStub(name, getPackageName(groupId, 'repository'), groupId),
    },
    {
      path: `${getPackagePath(groupId, 'service')}/${name}Service.java`,
      content: serviceStub(name, getPackageName(groupId, 'service'), groupId, fields),
    },
    {
      path: `${getPackagePath(groupId, 'controller')}/${name}Controller.java`,
      content: controllerStub(name, getPackageName(groupId, 'controller'), groupId),
    },
  ];
}

// ---- Stubs ----

function controllerStub(name: string, pkg: string, baseGroupId: string): string {
  const serviceImport = `${baseGroupId}.service.${name}Service`;
  const dtoImport = `${baseGroupId}.dto.${name}DTO`;
  const varName = name.toLowerCase();

  return `package ${pkg};

import ${serviceImport};
import ${dtoImport};
import lombok.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.List;

@RestController
@RequestMapping("/api/${varName}s")
@RequiredArgsConstructor
public class ${name}Controller {

  private final ${name}Service ${varName}Service;

  @GetMapping
  public ResponseEntity<List<${name}DTO>> findAll() {
    return ResponseEntity.ok(${varName}Service.findAll());
  }

  @GetMapping("/{id}")
  public ResponseEntity<${name}DTO> findById(@PathVariable Long id) {
    return ResponseEntity.ok(${varName}Service.findById(id));
  }

  @PostMapping
  public ResponseEntity<${name}DTO> create(@RequestBody ${name}DTO dto) {
    return ResponseEntity.status(201).body(${varName}Service.create(dto));
  }

  @PutMapping("/{id}")
  public ResponseEntity<${name}DTO> update(@PathVariable Long id, @RequestBody ${name}DTO dto) {
    return ResponseEntity.ok(${varName}Service.update(id, dto));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    ${varName}Service.delete(id);
    return ResponseEntity.noContent().build();
  }
}`;
}

function modelStub(name: string, pkg: string, fields: string[] = []): string {
  const body = fields.length > 0
    ? fields.join('\n\n')
    : '  // TODO: add fields';

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

${body}
}`;
}

function dtoStub(name: string, pkg: string, fields: string[] = []): string {
  const body = fields.length > 0
    ? fields.join('\n\n')
    : '  // TODO: add fields';

  return `package ${pkg};

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ${name}DTO {

  private Long id;

${body}
}`;
}

function serviceStub(name: string, pkg: string, baseGroupId: string, fields: string[] = []): string {
  const repoImport = `${baseGroupId}.repository.${name}Repository`;
  const modelImport = `${baseGroupId}.model.${name}`;
  const dtoImport = `${baseGroupId}.dto.${name}DTO`;
  const varName = name.toLowerCase();

  // Gera o toDTO() mapeando campo a campo
  const toDTOLines = fields.map(f => {
    const fieldName = f.trim().split(' ')[2].replace(';', '');
    const cap = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    return `    dto.set${cap}(${varName}.get${cap}());`;
  }).join('\n');

  // Gera o toEntity() mapeando campo a campo
  const toEntityLines = fields.map(f => {
    const fieldName = f.trim().split(' ')[2].replace(';', '');
    const cap = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
    return `    entity.set${cap}(dto.get${cap}());`;
  }).join('\n');

  return `package ${pkg};

import ${repoImport};
import ${modelImport};
import ${dtoImport};
import lombok.*;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ${name}Service {

  private final ${name}Repository ${varName}Repository;

  public List<${name}DTO> findAll() {
    return ${varName}Repository.findAll()
      .stream()
      .map(this::toDTO)
      .collect(Collectors.toList());
  }

  public ${name}DTO findById(Long id) {
    ${name} ${varName} = ${varName}Repository.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "${name} not found"));
    return toDTO(${varName});
  }

  public ${name}DTO create(${name}DTO dto) {
    ${name} ${varName} = toEntity(dto);
    return toDTO(${varName}Repository.save(${varName}));
  }

  public ${name}DTO update(Long id, ${name}DTO dto) {
    ${varName}Repository.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "${name} not found"));
    ${name} ${varName} = toEntity(dto);
    ${varName}.setId(id);
    return toDTO(${varName}Repository.save(${varName}));
  }

  public void delete(Long id) {
    ${varName}Repository.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "${name} not found"));
    ${varName}Repository.deleteById(id);
  }

  private ${name}DTO toDTO(${name} ${varName}) {
    ${name}DTO dto = new ${name}DTO();
    dto.setId(${varName}.getId());
${toDTOLines}
    return dto;
  }

  private ${name} toEntity(${name}DTO dto) {
    ${name} entity = new ${name}();
${toEntityLines}
    return entity;
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
spring.h2.console.path=/h2-console`,

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
spring.jpa.open-in-view=false`,

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
spring.jpa.open-in-view=false`,
  };

  const config = configs[driver.toLowerCase()];
  if (!config) {
    throw new Error(`Unknown driver "${driver}". Use: h2, mysql or postgres`);
  }
  return config;
}
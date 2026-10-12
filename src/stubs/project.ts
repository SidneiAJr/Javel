export function generateProject(name: string): Record<string, string> {
  const safeName = sanitizePackageName(name);
  const groupId = `com.${safeName}`;
  const mainClass = capitalize(safeName);
  const packagePath = groupId.replace(/\./g, '/');

  return {
    'pom.xml': pomXml(name, groupId),
    [`src/main/java/${packagePath}/${mainClass}Application.java`]: applicationClass(mainClass, groupId),
    [`src/main/java/${packagePath}/config/JavelConfig.java`]: javelConfig(mainClass, groupId),
    'src/main/resources/application.properties': applicationProperties(name),
    [`src/main/java/${packagePath}/controller/.gitkeep`]: '',
    [`src/main/java/${packagePath}/model/.gitkeep`]: '',
    [`src/main/java/${packagePath}/service/.gitkeep`]: '',
    [`src/main/java/${packagePath}/repository/.gitkeep`]: '',
    [`src/main/java/${packagePath}/dto/.gitkeep`]: '',
    [`src/main/java/${packagePath}/migration/.gitkeep`]: '',
    '.gitignore': gitignore(),
  };
}

function sanitizePackageName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function pomXml(name: string, groupId: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.0</version>
  </parent>

  <groupId>${groupId}</groupId>
  <artifactId>${name}</artifactId>
  <version>0.0.1-SNAPSHOT</version>
  <name>${name}</name>

  <properties>
    <java.version>17</java.version>
  </properties>

  <dependencies>

    <!-- Web -->
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- JPA -->
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>

    <!-- Validation -->
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- Actuator -->
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>

    <!-- Lombok -->
    <dependency>
      <groupId>org.projectlombok</groupId>
      <artifactId>lombok</artifactId>
      <optional>true</optional>
    </dependency>

    <!-- Jackson JSON -->
    <dependency>
      <groupId>com.fasterxml.jackson.core</groupId>
      <artifactId>jackson-databind</artifactId>
    </dependency>

    <!-- DevTools -->
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-devtools</artifactId>
      <scope>runtime</scope>
      <optional>true</optional>
    </dependency>

    <!-- H2 (dev) -->
    <dependency>
      <groupId>com.h2database</groupId>
      <artifactId>h2</artifactId>
      <scope>runtime</scope>
    </dependency>

    <!-- javel-migration -->
    <dependency>
      <groupId>com.javel</groupId>
      <artifactId>javel-migration</artifactId>
      <version>0.0.1</version>
    </dependency>

    <!-- Test -->
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>

  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
        <configuration>
          <excludes>
            <exclude>
              <groupId>org.projectlombok</groupId>
              <artifactId>lombok</artifactId>
            </exclude>
          </excludes>
        </configuration>
      </plugin>
    </plugins>
  </build>

</project>`;
}

function applicationClass(mainClass: string, groupId: string): string {
  return `package ${groupId};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ${mainClass}Application {
  public static void main(String[] args) {
    SpringApplication.run(${mainClass}Application.class, args);
  }
}`;
}

function javelConfig(mainClass: string, groupId: string): string {
  return `package ${groupId}.config;

import com.javel.MigrationRunner;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.util.List;

@Configuration
public class JavelConfig {

    @Bean
    public MigrationRunner migrationRunner(DataSource dataSource) {
        return new MigrationRunner(dataSource, List.of(
            // Registre suas migrations aqui em ordem:
            // new CreateUsersTable()
        ));
    }

    @EventListener(ApplicationReadyEvent.class)
    public void migrate() throws SQLException {
        migrationRunner(null).run();
    }
}`;
}

function applicationProperties(name: string): string {
  return `# App
spring.application.name=${name}
server.port=8080

# H2 (in-memory — dev)
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

# JPA
spring.jpa.show-sql=true
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.jpa.open-in-view=false
spring.jpa.hibernate.ddl-auto=none

# H2 Console
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console`;
}

function gitignore(): string {
  return `target/
.idea/
*.iml
.env`;
}
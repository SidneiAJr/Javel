# Javel 🚀

Laravel-style CLI framework for Spring Boot projects.

> Build Java APIs the Laravel way.

![license](https://img.shields.io/github/license/seu-usuario/javel)
![node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![java](https://img.shields.io/badge/java-%3E%3D17-orange)
![maven](https://img.shields.io/badge/maven-%3E%3D3.8-blue)

## Requirements

- Node.js 18+
- Java 17+
- Maven 3.8+

## Installation

```bash
npm install -g javel
```

## Creating a project

```bash
javel new my-project
cd my-project
javel serve
```

## Generators

```bash
# Controller + Service + Repository
javel make:controller User

# Model (Entity)
javel make:model User

# Service only
javel make:service User

# Repository only
javel make:repository User

# Migration
javel make:migration CreateUsersTable
```

## Running

```bash
# Start dev server
javel serve

# Build for production
javel build

# Run migrations
javel migrate

# Rollback migrations
javel migrate:rollback
```

## Project Structure

```
my-project/
  src/
    main/
      java/com/my-project/
        controller/
        model/
        service/
        repository/
        migration/
      resources/
        application.properties
  pom.xml
```

## Philosophy

Javel brings the simplicity and elegance of Laravel to the
Java/Spring Boot ecosystem. No more boilerplate — just build.

## License

MIT
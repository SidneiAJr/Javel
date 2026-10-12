# Javel 🚀

Laravel-style CLI framework for Spring Boot projects.

> Build Java APIs the Laravel way.

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
      resources/
        application.properties
        db/migration/
  pom.xml
```

## Philosophy

Javel brings the simplicity and elegance of Laravel to the
Java/Spring Boot ecosystem. No more boilerplate — just build.

## License

MIT
# Twenty Mago Chic — Fork

Fork de [twentyhq/twenty](https://github.com/twentyhq/twenty) customizado para Mago Chic.  
**Rama de trabajo:** `magochic/dev`  
**Repo:** https://github.com/sebastianbochettiv-code/twenty-magochic

---

## Contexto del proyecto

Twenty es un CRM open source, API-first, construido en monorepo. Este fork agrega funcionalidades para Mago Chic (empresa de limpieza industrial en Chile):
- Campos con validación chilena (RUT con Módulo 11 en tiempo real)
- Integración Google Maps en campos de dirección con mapa embebido
- Módulos de negocio: Licitaciones, Servicios, Cotizaciones, Órdenes de Trabajo

La instancia de producción local corre en Docker en `C:\Users\sebas\Documents\apps\Mago Chic\twenty\`.  
Este repositorio es el código fuente que se compila para reemplazar la imagen upstream.

---

## Monorepo — paquetes relevantes

```
packages/
  twenty-front/     → Frontend React 19 + TypeScript (Vite) ← PRINCIPAL
  twenty-server/    → Backend NestJS + TypeScript ← SECUNDARIO
  twenty-ui/        → Design system (componentes base)
  twenty-shared/    → Tipos compartidos front/back
  twenty-docker/    → Dockerfiles
```

---

## Frontend — dónde vive cada cosa

```
packages/twenty-front/src/
  modules/
    object-record/
      record-field/
        components/    ← ★ AQUÍ van los field types custom (RUT, Dirección+Mapa)
        types/
      record-show/     ← Vista detalle ← aquí va el mapa embebido en Instalación
      record-form/     ← Formulario creación/edición
    metadata/          ← Sincronización con Metadata API
    workflow/          ← UI de workflows
  pages/               ← Rutas (React Router)
```

### Patrón de field type

Cada campo tiene dos componentes:
- `Field{Type}Display.tsx` — modo lectura
- `Field{Type}Edit.tsx` — modo edición

Para campo custom: crear ambos + registrar en el mapper de tipos.

---

## Data Model en producción (instancia local)

| Objeto | Object ID |
|---|---|
| Empresa (Company) | `9e32abcb-7b29-4403-bf87-a8b4959d5c5d` |
| Instalación | `f9258260-cfbd-4c90-9c4f-59da34138142` |
| Producto | `fe2d6ec9-c474-46ef-881a-d7ef2900f851` |

Campos Empresa: `rut`, `razonSocial`, `giroComercial`, `estado`, `ofPisoDpto`, `proximaLicitacion`  
Campos Instalación: `name`, `direccion`, `estado`, `comuna` (56 comunas), `relojControl`, `cliente`→Empresa  
Campos Producto: `name`, `categoria`, `precioUnitario`, `costoUnitario`, `tipo`, `estado`, `instalacion`→Instalación

Workflows activos: Validar RUT Empresa (company.created + company.updated) — Módulo 11.

---

## Instancia Docker local

```
URL:      http://localhost:3100
Usuario:  sebastian@magochic.cl
DB:       postgres://twenty:TwentyMago2024!@localhost:5432/twenty
MCP:      http://localhost:3100/mcp
```

`C:\Users\sebas\Documents\apps\Mago Chic\twenty\` — docker-compose.yml de producción local.

---

## Desarrollo

```bash
yarn install

# Dev sin Docker
cd packages/twenty-server && yarn start:dev   # Terminal 1
cd packages/twenty-front  && yarn dev         # Terminal 2

# Build imagen Docker desde fork
docker build -t magochic/twenty:local -f packages/twenty-docker/Dockerfile .
```

### Conectar fork al docker-compose de producción

En `docker-compose.yml` cambiar `image: twentycrm/twenty:latest` por:
```yaml
build:
  context: C:\mgc\twenty-magochic
  dockerfile: packages/twenty-docker/Dockerfile
```

---

## Git

```bash
# Rama de trabajo
magochic/dev   ← todos los cambios Mago Chic van aquí, nunca en main

# Recibir updates de Twenty upstream
git fetch upstream
git merge upstream/main
git push origin magochic/dev
```

---

## Roadmap

| Prioridad | Feature | Dónde |
|---|---|---|
| 🔴 1 | RUT con Módulo 11 en tiempo real | `record-field/components/` (nuevo FieldRutEdit) |
| 🔴 2 | Dirección con Google Places autocomplete | `record-field/components/` |
| 🔴 3 | Mapa embebido en detalle de Instalación | `record-show/` (nuevo panel) |
| 🟡 4 | Módulo Licitaciones | Metadata API (sin fork) |
| 🟡 5 | Módulo Servicios | Metadata API (sin fork) |
| 🟢 6 | Cotizaciones PDF | nueva página |
| 🟢 7 | Órdenes de trabajo | nueva página |

---

## Referencias

- Arquitectura completa: `C:\Users\sebas\Documents\apps\Mago Chic\twenty\ARCHITECTURE.md`
- Backup DB: `C:\Users\sebas\Documents\apps\Mago Chic\twenty-backup-2026-05-17\`
- Twenty docs: https://twenty.com/developers

## Project Overview

Twenty is an open-source CRM built with modern technologies in a monorepo structure. The codebase is organized as an Nx workspace with multiple packages.

## Key Commands

### Development
```bash
# Start development environment (frontend + backend + worker)
yarn start

# Individual package development
npx nx start twenty-front     # Start frontend dev server
npx nx start twenty-server    # Start backend server
npx nx run twenty-server:worker  # Start background worker
```

### Testing
```bash
# Preferred: run a single test file (fast)
npx jest path/to/test.test.ts --config=packages/PROJECT/jest.config.mjs

# Run all tests for a package
npx nx test twenty-front      # Frontend unit tests
npx nx test twenty-server     # Backend unit tests
npx nx run twenty-server:test:integration:with-db-reset  # Integration tests with DB reset
# To run an indivual test or a pattern of tests, use the following command:
cd packages/{workspace} && npx jest "pattern or filename"

# Storybook
npx nx storybook:build twenty-front
npx nx storybook:test twenty-front

# When testing the UI end to end, click on "Continue with Email" and use the prefilled credentials.
```

### Code Quality
```bash
# Linting (diff with main - fastest, always prefer this)
npx nx lint:diff-with-main twenty-front
npx nx lint:diff-with-main twenty-server
npx nx lint:diff-with-main twenty-front --configuration=fix  # Auto-fix

# Linting (full project - slower, use only when needed)
npx nx lint twenty-front
npx nx lint twenty-server

# Type checking
npx nx typecheck twenty-front
npx nx typecheck twenty-server

# Format code
npx nx fmt twenty-front
npx nx fmt twenty-server
```

### Build
```bash
# Build packages (twenty-shared must be built first)
npx nx build twenty-shared
npx nx build twenty-front
npx nx build twenty-server
```

### Database Operations
```bash
# Database management
npx nx database:reset twenty-server         # Reset database
npx nx run twenty-server:database:init:prod # Initialize database
npx nx run twenty-server:database:migrate:prod # Run instance commands (fast only)

# Generate an instance command (fast or slow)
npx nx run twenty-server:database:migrate:generate --name <name> --type <fast|slow>
```

### Database Inspection (Postgres MCP)

A read-only Postgres MCP server is configured in `.mcp.json`. Use it to:
- Inspect workspace data, metadata, and object definitions while developing
- Verify migration results (columns, types, constraints) after running migrations
- Explore the multi-tenant schema structure (core, metadata, workspace-specific schemas)
- Debug issues by querying raw data to confirm whether a bug is frontend, backend, or data-level
- Inspect metadata tables to debug GraphQL schema generation issues

This server is read-only — for write operations (reset, migrations, sync), use the CLI commands above.

### GraphQL
```bash
# Generate GraphQL types (run after schema changes)
npx nx run twenty-front:graphql:generate
npx nx run twenty-front:graphql:generate --configuration=metadata
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 18, TypeScript, Jotai (state management), Linaria (styling), Vite
- **Backend**: NestJS, TypeORM, PostgreSQL, Redis, GraphQL (with GraphQL Yoga)
- **Monorepo**: Nx workspace managed with Yarn 4

### Package Structure
```
packages/
├── twenty-front/          # React frontend application
├── twenty-server/         # NestJS backend API
├── twenty-ui/             # Shared UI components library
├── twenty-shared/         # Common types and utilities
├── twenty-emails/         # Email templates with React Email
├── twenty-website-new/    # Next.js marketing website
├── twenty-docs/           # Documentation website
├── twenty-zapier/         # Zapier integration
└── twenty-e2e-testing/    # Playwright E2E tests
```

### Key Development Principles
- **Functional components only** (no class components)
- **Named exports only** (no default exports)
- **Types over interfaces** (except when extending third-party interfaces)
- **String literals over enums** (except for GraphQL enums)
- **No 'any' type allowed** — strict TypeScript enforced
- **Event handlers preferred over useEffect** for state updates
- **Props down, events up** — unidirectional data flow
- **Composition over inheritance**
- **No abbreviations** in variable names (`user` not `u`, `fieldMetadata` not `fm`)

### Naming Conventions
- **Variables/functions**: camelCase
- **Constants**: SCREAMING_SNAKE_CASE
- **Types/Classes**: PascalCase (suffix component props with `Props`, e.g. `ButtonProps`)
- **Files/directories**: kebab-case with descriptive suffixes (`.component.tsx`, `.service.ts`, `.entity.ts`, `.dto.ts`, `.module.ts`)
- **TypeScript generics**: descriptive names (`TData` not `T`)

### File Structure
- Components under 300 lines, services under 500 lines
- Components in their own directories with tests and stories
- Use `index.ts` barrel exports for clean imports
- Import order: external libraries first, then internal (`@/`), then relative

### Comments
- Use short-form comments (`//`), not JSDoc blocks
- Explain WHY (business logic), not WHAT
- Do not comment obvious code
- Multi-line comments use multiple `//` lines, not `/** */`

### State Management
- **Jotai** for global state: atoms for primitive state, selectors for derived state, atom families for dynamic collections
- Component-specific state with React hooks (`useState`, `useReducer` for complex logic)
- GraphQL cache managed by Apollo Client
- Use functional state updates: `setState(prev => prev + 1)`

### Backend Architecture
- **NestJS modules** for feature organization
- **TypeORM** for database ORM with PostgreSQL
- **GraphQL** API with code-first approach
- **Redis** for caching and session management
- **BullMQ** for background job processing

### Database & Upgrade Commands
- **PostgreSQL** as primary database
- **Redis** for caching and sessions
- **ClickHouse** for analytics (when enabled)
- When changing entity files, generate an **instance command** (`database:migrate:generate --name <name> --type <fast|slow>`)
- **Fast** instance commands handle schema changes; **slow** ones add a `runDataMigration` step for data backfills
- **Workspace commands** iterate over all active/suspended workspaces for per-workspace upgrades
- Commands use `@RegisteredInstanceCommand` and `@RegisteredWorkspaceCommand` decorators for automatic discovery
- Include both `up` and `down` logic in instance commands
- Never delete or rewrite committed instance command `up`/`down` logic
- See `packages/twenty-server/docs/UPGRADE_COMMANDS.md` for full documentation

### Utility Helpers
Use existing helpers from `twenty-shared` instead of manual type guards:
- `isDefined()`, `isNonEmptyString()`, `isNonEmptyArray()`

## Development Workflow

IMPORTANT: Use Context7 for code generation, setup or configuration steps, or library/API documentation. Automatically use the Context7 MCP tools to resolve library IDs and get library docs without waiting for explicit requests.

### Before Making Changes
1. Always run linting (`lint:diff-with-main`) and type checking after code changes
2. Test changes with relevant test suites (prefer single-file test runs)
3. Ensure instance commands are generated for entity changes (`database:migrate:generate`)
4. Check that GraphQL schema changes are backward compatible
5. Run `graphql:generate` after any GraphQL schema changes

### Code Style Notes
- Use **Linaria** for styling with zero-runtime CSS-in-JS (styled-components pattern)
- Follow **Nx** workspace conventions for imports
- Use **Lingui** for internationalization
- Apply security first, then formatting (sanitize before format)

### Testing Strategy
- **Test behavior, not implementation** — focus on user perspective
- **Test pyramid**: 70% unit, 20% integration, 10% E2E
- Query by user-visible elements (text, roles, labels) over test IDs
- Use `@testing-library/user-event` for realistic interactions
- Descriptive test names: "should [behavior] when [condition]"
- Clear mocks between tests with `jest.clearAllMocks()`

## Dev Environment Setup

All dev environments (Claude Code web, Cursor, local) use one script:

```bash
bash packages/twenty-utils/setup-dev-env.sh
```

This handles everything: starts Postgres + Redis (auto-detects local services vs Docker), creates databases, and copies `.env` files. Idempotent — safe to run multiple times.

- `--docker` — force Docker mode (uses `packages/twenty-docker/docker-compose.dev.yml`)
- `--down` — stop services
- `--reset` — wipe data and restart fresh
- **Skip the setup script** for tasks that only read code — architecture questions, code review, documentation, etc.

**Note:** CI workflows (GitHub Actions) manage services via Actions service containers and run setup steps individually — they don't use this script.

## Important Files
- `nx.json` - Nx workspace configuration with task definitions
- `tsconfig.base.json` - Base TypeScript configuration
- `package.json` - Root package with workspace definitions
- `.cursor/rules/` - Detailed development guidelines and best practices

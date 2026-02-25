# nexum

Monorepo project created with devstarter-cli.

## Structure

```
nexum/
├─ apps/
│  ├─ web/                ← React + Vite frontend
│  └─ api/                ← Express backend
│     └─ src/
│        ├─ routes/       ← HTTP route definitions
│        ├─ controllers/  ← Request/response handling
│        └─ services/     ← Business logic + Prisma queries
├─ packages/
│  └─ shared/             ← Shared types, schemas, Prisma models
├─ package.json
├─ pnpm-workspace.yaml
└─ tsconfig.base.json
```

## Getting Started

```bash
pnpm dev
```

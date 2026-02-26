# Nexum

Personal project management app with databases (tables/kanban), rich-text documents, and nested projects. Built as a single-user self-hosted tool.

## Tech Stack

- **Frontend:** React 18 + Vite, Tailwind CSS v4, shadcn/ui, Tiptap editor, React Query
- **Backend:** Express.js, Prisma ORM, PostgreSQL
- **Auth:** JWT (access + refresh tokens), single user via env vars
- **Monorepo:** pnpm workspaces

## Structure

```
nexum/
├─ apps/
│  ├─ web/                ← React + Vite frontend
│  │  └─ src/
│  │     ├─ pages/        ← Route-level components
│  │     ├─ components/   ← UI components (shadcn/ui, layout, editor)
│  │     ├─ hooks/        ← React Query hooks per domain
│  │     └─ lib/api.ts    ← API client with auth handling
│  └─ api/                ← Express backend
│     └─ src/
│        ├─ routes/       ← HTTP route definitions
│        ├─ controllers/  ← Request/response handling
│        ├─ services/     ← Business logic + Prisma queries
│        └─ middleware/   ← Auth middleware (JWT verification)
├─ packages/
│  └─ shared/             ← Shared types, schemas, Prisma models
├─ package.json
├─ pnpm-workspace.yaml
└─ tsconfig.base.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL

### Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Configure the database** — create `packages/shared/.env`:

   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/nexum
   ```

3. **Configure auth** — create `apps/api/.env`:

   ```
   AUTH_USER=admin
   AUTH_PASSWORD=your-password
   JWT_SECRET=random-64-char-string
   JWT_REFRESH_SECRET=another-random-64-char-string
   DATABASE_URL=postgresql://user:password@localhost:5432/nexum
   ```

4. **Push the database schema:**

   ```bash
   pnpm -w -F @nexum/shared db:push
   ```

5. **Start development:**

   ```bash
   pnpm dev
   ```

   Web runs on `http://localhost:5173`, API on `http://localhost:3000`.

## Production

Build the frontend and serve everything from the API:

```bash
pnpm -w -F @nexum/web build
PORT=4000 node apps/api/src/index.ts
```

The API serves the built frontend statically and handles SPA routing fallback.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all dev servers |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm -w -F @nexum/shared db:generate` | Generate Prisma client |
| `pnpm -w -F @nexum/shared db:push` | Push schema to DB |
| `pnpm -w -F @nexum/shared db:migrate` | Create and apply migration |
| `pnpm -w -F @nexum/shared db:studio` | Open Prisma Studio |

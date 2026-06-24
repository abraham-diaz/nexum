<div align="center">
<img src="apps/web/public/icons/icon-192.png" alt="Nexum Logo" width="100"/>

# Nexum

### Self-hosted personal project management app

![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white) ![Tailwind](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) ![pnpm](https://img.shields.io/badge/pnpm_workspaces-F69220?style=for-the-badge&logo=pnpm&logoColor=white)

</div>

---

## What is Nexum?

Nexum is a single-user, self-hosted project management tool. It combines hierarchical projects, relational databases (table and Kanban), and rich-text documents in one app — think a lightweight personal Notion, running entirely on your own machine.

---

## Features

- **Nested projects** — organize work in a hierarchical tree with unlimited sub-projects
- **Databases** — table view and Kanban board with drag & drop (dnd-kit)
- **Typed properties** — Text, Number, Select, Date, and Relation between databases
- **Documents** — rich text editor with Tiptap (auto-save with debounce)
- **Global search** — quick search dialog across the entire app
- **Authentication** — JWT (access + refresh tokens), single user via environment variables
- **PWA** — installable as a progressive web app (vite-plugin-pwa)
- **Light/dark theme** — OKLCh color system with CSS custom properties

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 · Vite · Tailwind CSS v4 · shadcn/ui (Radix + Lucide) |
| State & Data | React Query |
| Rich text | Tiptap |
| Drag & Drop | dnd-kit |
| Backend | Express.js |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT (access + refresh tokens) |
| Monorepo | pnpm workspaces |

---

## Data Model

```
Project (hierarchical tree)
├─ Database (TABLE | BOARD)
│  ├─ Property (TEXT, NUMBER, SELECT, DATE, RELATION)
│  └─ Row
│     └─ Cell (JSON value per property)
└─ Document (Tiptap JSON content)
```

---

## Structure

```
nexum/
├─ apps/
│  ├─ web/                  React + Vite frontend
│  │  └─ src/
│  │     ├─ pages/          Route-level components
│  │     ├─ components/
│  │     │  ├─ ui/          shadcn/ui primitives
│  │     │  ├─ layout/      Shell (Sidebar, Layout, ProtectedRoute)
│  │     │  ├─ editor/      Tiptap editor
│  │     │  └─ database/    KanbanBoard
│  │     ├─ hooks/          React Query hooks per domain
│  │     └─ lib/api.ts      API client with auth handling
│  └─ api/                  Express backend
│     └─ src/
│        ├─ routes/         HTTP route definitions
│        ├─ controllers/    Request/response handling
│        ├─ services/       Business logic + Prisma queries
│        └─ middleware/     Auth middleware (JWT)
└─ packages/
   └─ shared/               Shared types, schemas, Prisma models
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL

### Setup

**1. Install dependencies:**

```bash
pnpm install
```

**2. Configure the database** — create `packages/shared/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/nexum
```

**3. Configure auth** — create `apps/api/.env`:

```env
AUTH_USER=admin
AUTH_PASSWORD=your-password
JWT_SECRET=random-64-char-string
JWT_REFRESH_SECRET=another-random-64-char-string
DATABASE_URL=postgresql://user:password@localhost:5432/nexum
```

**4. Push the database schema:**

```bash
pnpm -w -F @nexum/shared db:push
```

**5. Start development:**

```bash
pnpm dev
```

Web runs on `http://localhost:5173`, API on `http://localhost:3000`.

---

## Production

Build the frontend and serve everything from the API:

```bash
pnpm -w -F @nexum/web build
PORT=4000 node apps/api/src/index.ts
```

The API serves the built frontend statically and handles SPA routing fallback.

---

## Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start all dev servers |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm -w -F @nexum/shared db:generate` | Generate Prisma client |
| `pnpm -w -F @nexum/shared db:push` | Push schema to DB |
| `pnpm -w -F @nexum/shared db:migrate` | Create and apply migration |
| `pnpm -w -F @nexum/shared db:studio` | Open Prisma Studio |

---

## License

MIT
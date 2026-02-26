FROM node:20-alpine AS base

WORKDIR /app
RUN corepack enable

# Copy workspace manifests first to maximize layer cache
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN pnpm install --frozen-lockfile

FROM base AS build

COPY apps ./apps
COPY packages ./packages
COPY tsconfig.base.json ./tsconfig.base.json

ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nexum

# Generate Prisma client for @nexum/shared
RUN pnpm --filter @nexum/shared db:generate

# Build the frontend so Express can serve it
RUN pnpm --filter @nexum/web build

FROM node:20-alpine AS runtime

WORKDIR /app
RUN corepack enable

COPY --from=base /app/package.json ./package.json
COPY --from=base /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=base /app/apps/api/package.json ./apps/api/package.json
COPY --from=base /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps ./apps
COPY --from=build /app/packages ./packages
COPY --from=build /app/tsconfig.base.json ./tsconfig.base.json

ENV PORT=3000
EXPOSE 3000

CMD ["pnpm", "--filter", "@nexum/api", "dev"]

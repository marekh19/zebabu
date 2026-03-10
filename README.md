# Zebabu

A personal budget management web app for tracking income, expenses, and transactions across multiple budgets.

## Features

- Email/password authentication with email verification and password reset
- Create, duplicate, and delete budgets (monthly or scenario type)
- Categorize income and expenses per budget
- Track transactions within categories
- Drag-and-drop category and transaction reordering
- Multi-language support

## Tech Stack

| Layer           | Technology                    |
| --------------- | ----------------------------- |
| Framework       | SvelteKit 2 + Svelte 5        |
| Language        | TypeScript 5 (strict)         |
| Styling         | Tailwind CSS v4               |
| UI Components   | shadcn-svelte (bits-ui)       |
| Forms           | sveltekit-superforms + Zod v4 |
| i18n            | Paraglide (inlang)            |
| Auth            | better-auth                   |
| Database        | PostgreSQL 18 + Drizzle ORM   |
| Sessions        | Redis 8                       |
| Email           | Resend + React Email          |
| Build           | Vite 7 + Turbo (monorepo)     |
| Package Manager | pnpm                          |

## Getting Started

**Prerequisites:** Node.js v24+, pnpm v10+, Docker

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env
```

**Root `.env`:**

```env
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_DB=your_database
```

**`apps/web/.env`:**

```env
DATABASE_URL="postgres://your_username:your_password@localhost:5432/your_database"
BETTER_AUTH_SECRET="your-secret-string"
BETTER_AUTH_BASE_URL="http://localhost:3000"
REDIS_URL="redis://localhost:6379"
APP_URL="http://localhost:3000"
RESEND_API_KEY="re_your_api_key"
EMAIL_FROM="Zebabu <verify@zebabu.com>"
```

### 3. Start local services

```bash
pnpm run db:start        # starts PostgreSQL + Redis via Docker
```

### 4. Run database migrations

```bash
pnpm run db:migrate
```

### 5. Start dev server

```bash
pnpm run dev             # web app at http://localhost:3000
```

## Commands

| Command                 | Description              |
| ----------------------- | ------------------------ |
| `pnpm run dev`          | Start development server |
| `pnpm run build`        | Production build         |
| `pnpm run lint`         | ESLint                   |
| `pnpm run format`       | Prettier                 |
| `pnpm run check`        | TypeScript type check    |
| `pnpm run test`         | Run tests                |
| `pnpm run db:start`     | Start Docker services    |
| `pnpm run db:migrate`   | Run database migrations  |
| `pnpm run db:studio`    | Open Drizzle Studio      |
| `pnpm run redis:studio` | Open Redis Commander     |

# LeetCode Clone

A full-stack competitive programming platform inspired by LeetCode. Users can solve coding problems, submit solutions in multiple languages, discuss approaches, and compete on a leaderboard. Code execution runs in isolated Docker containers dispatched through a Redis job queue.

---

## Project Structure

```
leetcode/
├── frontend/          # Next.js 16 frontend (App Router)
├── my-hono-app/       # Hono.js REST API (Cloudflare Workers)
└── executor/          # Code execution worker service (planned)
```

---

## System Architecture

```
Browser
  │
  ▼
Next.js Frontend  ──────────►  Hono API (Cloudflare Workers)
                                    │              │
                               MongoDB         Redis Queue
                                            (BullMQ jobs)
                                                   │
                                                   ▼
                                          Execution Worker
                                                   │
                                         ┌─────────┴─────────┐
                                         │   Docker Runner    │
                                         │  (per submission)  │
                                         └───────────────────┘
                                                   │
                                          Verdict + Metrics
                                        (stored in MongoDB)
```

**Submission flow:**
1. User submits code from the frontend editor
2. Hono API validates the request and pushes a job onto the Redis queue
3. The execution worker picks up the job, spins an isolated Docker container for the target language, runs the code against all testcases with time and memory limits
4. The verdict, runtime, and memory usage are written back to MongoDB
5. The frontend polls or receives a WebSocket event with the final result

---

## Tech Stack

### Backend (`my-hono-app`)
| Technology | Purpose |
|---|---|
| [Hono.js](https://hono.dev) | Lightweight web framework |
| [Cloudflare Workers](https://workers.cloudflare.com) | Serverless deployment via Wrangler |
| [MongoDB](https://www.mongodb.com) + [Mongoose](https://mongoosejs.com) | Primary database & ODM |
| [Redis](https://redis.io) + [BullMQ](https://docs.bullmq.io) | Job queue for code execution |
| TypeScript | Type-safe development |

### Frontend (`frontend`)
| Technology | Purpose |
|---|---|
| [Next.js 16](https://nextjs.org) | React framework (App Router) |
| React 19 | UI library |
| [Tailwind CSS v4](https://tailwindcss.com) | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com) + Radix UI | Component library |
| [NextAuth v5](https://authjs.dev) | Authentication (credentials + Google OAuth) |
| TypeScript | Type-safe development |

### Execution Worker (`executor`)
| Technology | Purpose |
|---|---|
| [BullMQ Worker](https://docs.bullmq.io/guide/workers) | Consumes jobs from Redis queue |
| [Docker SDK](https://docs.docker.com/engine/api/sdk/) | Spin isolated containers per submission |
| Language images | `node:alpine`, `python:alpine`, `gcc:alpine`, `openjdk:alpine` |

---

## Features

### Implemented
- User registration and login (credentials)
- Google OAuth via NextAuth
- Problem CRUD with difficulty levels and tags
- Testcase management per problem
- Discussion threads per problem

### Planned / In Progress
- **Code Execution** — Sandboxed Docker containers with time and memory limits
- **Redis Job Queue** — BullMQ for async, scalable execution dispatch
- **Real-time Verdict** — WebSocket / SSE updates for submission results
- **Leaderboard** — Global and per-problem rankings with coins system
- **Code Editor** — Monaco Editor integration with language switching
- **Contest Mode** — Timed contests with a live leaderboard
- **Admin Panel** — Problem and user management dashboard
- **Rate Limiting** — Prevent submission spam
- **Plagiarism Detection** — Detect similar submissions

---

## Data Models

```
User         — username, email, password, coins, solvedProblems[], submissions[], social links
Problem      — title, description, constraints, difficulty, tags[], sampleTestcases[]
Submission   — code, language, status, runtime, memory, user → Problem
Testcase     — input, output, description, problem, createdBy
Discussion   — title, content, createdBy → User, problem → Problem
Leaderboard  — (in progress)
```

---

## Authentication (NextAuth v5)

The frontend uses **NextAuth v5 (Auth.js)** for session management.

### Supported Providers
| Provider | Type |
|---|---|
| Credentials | Email + password (custom validation against the Hono API) |
| Google | OAuth 2.0 |

### Setup

Install the NextAuth dependency (already in `package.json`):

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
# Required
NEXTAUTH_SECRET=your_random_secret_here   # openssl rand -base64 32

# Required for OAuth
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8787
```

Create `frontend/auth.ts` (NextAuth v5 config):

```ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/login`, {
          method: "POST",
          body: JSON.stringify(credentials),
          headers: { "Content-Type": "application/json" },
        })
        if (!res.ok) return null
        return res.json()
      },
    }),
  ],
})
```

Add the catch-all route handler at `frontend/app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

### Protected Routes

Use the `auth()` helper in server components or middleware to protect routes:

```ts
// app/problems/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function Page() {
  const session = await auth()
  if (!session) redirect("/login")
  // ...
}
```

---

## API Reference

### Users

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/users/register` | Register a new user |
| `POST` | `/users/login` | Login with credentials |
| `GET` | `/users/:id` | Get user profile |
| `PUT` | `/users/:id` | Update user profile |
| `DELETE` | `/users/:id` | Delete user account |
| `GET` | `/users/:id/submissions` | Get all submissions by user |
| `GET` | `/users/:id/solved` | Get solved problems by user |

### Problems

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/problems` | Get all problems |
| `POST` | `/problems` | Create a new problem |
| `GET` | `/problems/:id` | Get problem by ID |
| `PUT` | `/problems/:id` | Update a problem |
| `DELETE` | `/problems/:id` | Delete a problem |
| `GET` | `/problems?difficulty=easy` | Filter by difficulty (`easy`/`medium`/`hard`) |
| `GET` | `/problems?tags=array,dp` | Filter by tags |

### Testcases

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/testcases/:problemId` | Get all testcases for a problem |
| `POST` | `/testcases/:problemId` | Create a testcase for a problem |
| `GET` | `/testcases/:problemId/:id` | Get a single testcase |
| `PUT` | `/testcases/:problemId/:id` | Update a testcase |
| `DELETE` | `/testcases/:problemId/:id` | Delete a testcase |
| `GET` | `/testcases/:id/creator` | Get the creator of a testcase |

### Submissions

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/submissions` | Submit code for a problem (enqueues job) |
| `POST` | `/submissions/run` | Run code against sample testcases (no save) |
| `GET` | `/submissions/:id` | Get a submission by ID |
| `GET` | `/submissions/problem/:problemId` | Get all submissions for a problem |
| `GET` | `/submissions/user/:userId` | Get all submissions by a user |
| `GET` | `/submissions/user/:userId/problem/:problemId` | Get user submissions for a specific problem |
| `GET` | `/submissions/sorted` | Get submissions sorted by runtime/memory |

### Discussions

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/discussions/problem/:problemId` | Get all discussions for a problem |
| `GET` | `/discussions/problem/:problemId/user/:userId` | Get discussions by user on a problem |
| `GET` | `/discussions/user/:userId` | Get all discussions by a user |
| `GET` | `/discussions/:id` | Get a discussion by ID |
| `POST` | `/discussions` | Create a new discussion |
| `PUT` | `/discussions/:id` | Update a discussion |
| `DELETE` | `/discussions/:id` | Delete a discussion |
| `GET` | `/discussions/search?q=query` | Search discussions |
| `GET` | `/discussions/filter?tag=tag` | Filter discussions |
| `GET` | `/discussions/sorted` | Get discussions sorted by latest/votes |
| `GET` | `/discussions?page=1&limit=10` | Paginated discussions |

---

## Code Execution System

### How It Works

```
POST /submissions
  └── Hono API creates Submission (status: "pending") in MongoDB
  └── Pushes job to Redis queue (BullMQ)
        └── Execution Worker picks up the job
              └── Pulls language Docker image
              └── Writes user code to temp volume
              └── Runs container with:
                    - CPU / memory limits
                    - Network disabled
                    - Read-only filesystem (except /tmp)
                    - Timeout enforcement
              └── Compares stdout against expected output for each testcase
              └── Writes verdict + runtime + memory to MongoDB
  └── Frontend receives result via WebSocket or polling GET /submissions/:id
```

### Verdict Types

| Verdict | Meaning |
|---|---|
| `Accepted` | All testcases passed |
| `Wrong Answer` | Output does not match expected |
| `Time Limit Exceeded` | Execution exceeded allowed time |
| `Memory Limit Exceeded` | Execution exceeded memory limit |
| `Runtime Error` | Program crashed or threw an exception |
| `Compilation Error` | Code failed to compile |
| `Pending` | Job is waiting in the queue |
| `Running` | Job is currently executing |

### Supported Languages (planned)

| Language | Docker Image | File |
|---|---|---|
| JavaScript | `node:20-alpine` | `solution.js` |
| TypeScript | `node:20-alpine` (ts-node) | `solution.ts` |
| Python | `python:3.12-alpine` | `solution.py` |
| C++ | `gcc:13-alpine` | `solution.cpp` |
| Java | `openjdk:21-alpine` | `Solution.java` |
| Go | `golang:1.22-alpine` | `solution.go` |

### Execution Limits (default)

| Limit | Default |
|---|---|
| Time limit | 2 seconds |
| Memory limit | 256 MB |
| Output limit | 1 MB |
| Network | Disabled |

---

## Docker Setup

### Docker Compose (full stack)

Create `docker-compose.yml` at the root:

```yaml
version: "3.9"

services:
  mongo:
    image: mongo:7
    container_name: leetcode-mongo
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    container_name: leetcode-redis
    restart: unless-stopped
    ports:
      - "6379:6379"

  executor:
    build:
      context: ./executor
      dockerfile: Dockerfile
    container_name: leetcode-executor
    restart: unless-stopped
    depends_on:
      - redis
      - mongo
    environment:
      - REDIS_URL=redis://redis:6379
      - MONGODB_URI=mongodb://mongo:27017/leetcode
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock  # Docker-in-Docker

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: leetcode-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - AUTH_GOOGLE_ID=${AUTH_GOOGLE_ID}
      - AUTH_GOOGLE_SECRET=${AUTH_GOOGLE_SECRET}
      - NEXT_PUBLIC_API_URL=http://api:8787

volumes:
  mongo_data:
```

### Frontend Dockerfile (`frontend/Dockerfile`)

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### Executor Worker Dockerfile (`executor/Dockerfile`)

```dockerfile
FROM node:20-alpine
WORKDIR /app

# Install Docker CLI so the worker can spawn sibling containers
RUN apk add --no-cache docker-cli

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

CMD ["node", "dist/worker.js"]
```

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

### 1. Start infrastructure

```bash
docker compose up mongo redis -d
```

### 2. Backend

```bash
cd my-hono-app
npm install
```

Create `my-hono-app/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/leetcode
REDIS_URL=redis://localhost:6379
```

```bash
npm run dev      # starts on http://localhost:8787
```

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXTAUTH_SECRET=your_random_secret        # openssl rand -base64 32
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret
NEXT_PUBLIC_API_URL=http://localhost:8787
```

```bash
npm run dev      # starts on http://localhost:3000
```

### 4. Run full stack with Docker

```bash
docker compose up --build
```

---

## Project Status

| Feature | Status |
|---|---|
| User model & schema | Done |
| Problem model & schema | Done |
| Submission model & schema | Done |
| Testcase model & schema | Done |
| Discussion model & schema | Done |
| Problem routes (GET, POST, GET by ID) | Done |
| Testcase routes (GET, POST by problem) | Done |
| Testcase controller (CRUD) | Done |
| Problem controller (get all, by difficulty, by tags) | Done |
| Login / Signup UI | Done |
| NextAuth integration | In Progress |
| User controller & routes | In Progress |
| Submission controller & routes | In Progress |
| Discussion controller & routes | In Progress |
| Redis + BullMQ job queue | Planned |
| Docker execution worker | Planned |
| Monaco code editor | Planned |
| WebSocket real-time verdict | Planned |
| Leaderboard | Planned |
| Contest mode | Planned |
| Admin panel | Planned |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push and open a Pull Request

---

## License

MIT

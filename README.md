# LeetClone

A full-stack competitive programming platform inspired by LeetCode. Users can solve coding problems in a Monaco editor, submit solutions in 6 languages, view per-testcase verdicts, discuss approaches, and compete on a leaderboard. Admins can create problems with per-language boilerplate and driver code templates.

---

## What It Does

- **Solve problems** — Monaco editor with syntax highlighting, language switching, and problem-specific starter code
- **Run & Submit** — Test against sample cases instantly (Run) or all cases with a saved verdict (Submit)
- **6 Languages** — JavaScript, TypeScript, Python, Java, C++, Go
- **Per-problem driver code** — Admin defines a hidden harness; user only writes the solution function
- **Discussions** — Per-problem discussion tab + global discussion board
- **Submissions history** — View all past submissions with full test result breakdown
- **Leaderboard** — Ranked by solved count and earned coins
- **Admin panel** — Create/edit problems with boilerplate editors, manage testcases
- **Dark / Light mode** — Toggle in the navbar, persists across sessions
- **Google OAuth** — Sign in with Google or email/password

---

## Project Structure

```
leetcode/
├── frontend/        # Next.js 16 (App Router) — UI, auth, editor
└── my-hono-app/     # Hono.js REST API — problems, submissions, execution
```

---

## Tech Stack

### Backend (`my-hono-app`)
| Technology | Purpose |
|---|---|
| [Hono.js](https://hono.dev) | Lightweight REST API framework |
| [MongoDB](https://www.mongodb.com) + Mongoose | Primary database |
| [Redis](https://redis.io) + [BullMQ](https://docs.bullmq.io) | Caching + async execution queue |
| JWT | Stateless auth tokens |
| Node.js child_process | Sandboxed code execution in temp dirs |
| TypeScript + tsx | Type-safe development |

### Frontend (`frontend`)
| Technology | Purpose |
|---|---|
| [Next.js 16](https://nextjs.org) App Router | React framework |
| React 19 | UI library |
| [Tailwind CSS v4](https://tailwindcss.com) | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com) + Radix UI | Component library |
| [NextAuth v5](https://authjs.dev) | Auth (credentials + Google OAuth) |
| [Monaco Editor](https://microsoft.github.io/monaco-editor/) | In-browser code editor |
| [next-themes](https://github.com/pacocoursey/next-themes) | Dark/light mode |
| TypeScript | Type safety |

---

## Features

| Feature | Status |
|---|---|
| Email/password auth | Done |
| Google OAuth | Done |
| Problem list with filters (difficulty, tags) | Done |
| Monaco editor with language switching | Done |
| Run code against sample testcases | Done |
| Submit code against all testcases | Done |
| Per-testcase verdict (pass/fail, input, expected, got) | Done |
| Submission history + detail page | Done |
| Per-problem boilerplate + driver code (admin) | Done |
| Discussion board (global) | Done |
| Per-problem discussions | Done |
| Leaderboard (coins + solved count) | Done |
| Admin panel (problems, testcases, boilerplate) | Done |
| Redis caching (problems list + individual) | Done |
| BullMQ async submission queue | Done |
| Dark/Light mode toggle | Done |
| Admin role promotion via secret endpoint | Done |

---

## Local Development Setup

### Prerequisites

- Node.js 20+
- MongoDB (local or [Atlas](https://www.mongodb.com/atlas))
- Redis (local or [Upstash](https://upstash.com)) — optional, app works without it

---

### 1. Clone and install

```bash
git clone <your-repo-url>
cd leetcode

# Install backend deps
cd my-hono-app && npm install

# Install frontend deps
cd ../frontend && npm install
```

---

### 2. Backend environment

Create `my-hono-app/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/leetcode
JWT_SECRET=change-this-to-a-random-secret

PORT=8787

# Redis — optional (caching + async queue). App falls back to sync execution without it.
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
FRONTEND_URL=http://localhost:3000

# Admin setup secret (used once to promote first admin)
ADMIN_SECRET=your-admin-secret
```

Start the backend:

```bash
cd my-hono-app
npm run dev        # http://localhost:8787
```

---

### 3. Frontend environment

Create `frontend/.env.local`:

```env
# Generate with: openssl rand -base64 32
AUTH_SECRET=your-nextauth-secret

# Google OAuth (optional — skip if not using Google sign-in)
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# Backend URL
NEXT_PUBLIC_API_URL=http://localhost:8787
```

Start the frontend:

```bash
cd frontend
npm run dev        # http://localhost:3000
```

---

### 4. Start MongoDB and Redis locally

```bash
# MongoDB
mongod --dbpath /usr/local/var/mongodb

# Redis
redis-server
```

Or with Docker:

```bash
docker run -d -p 27017:27017 --name mongo mongo:7
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

---

## Setting Up the First Admin

After registering a normal account, promote it to admin:

```bash
curl -X POST http://localhost:8787/api/auth/setup-admin \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: your-admin-secret" \
  -d '{"email": "you@example.com"}'
```

The `X-Admin-Secret` must match `ADMIN_SECRET` in your `.env`. After this, the **Admin Panel** link will appear in the navbar dropdown.

---

## Admin Panel Usage

Navigate to `/admin` after logging in as an admin.

### Creating a Problem

1. Go to **Admin → Problems → Create Problem**
2. Fill in title, difficulty, description, constraints, tags
3. Set **Boilerplate** (what users see in the editor) and **Driver Code** (hidden harness) for each language

**Driver code convention:**
- Place `{{USER_CODE}}` where the user's code should be injected
- For JS/TS/Python: driver handles stdin/stdout; user writes just the function
- For C++/Java/Go: driver includes imports and `main()`, user writes the solution function

**Example (JavaScript):**

*Boilerplate (user sees):*
```js
function twoSum(nums, target) {
  // your solution
}
```

*Driver code:*
```js
{{USER_CODE}}

process.stdin.resume();
process.stdin.setEncoding("utf8");
let input = "";
process.stdin.on("data", d => (input += d));
process.stdin.on("end", () => {
  const args = input.trim().split("\n").map(l => {
    try { return JSON.parse(l); } catch { return l; }
  });
  const result = twoSum(...args);
  process.stdout.write(JSON.stringify(result) + "\n");
});
```

4. After creating the problem, you're redirected to **Add Testcases**
5. Testcase input must match what the driver code reads from stdin

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register with email/password |
| `POST` | `/api/auth/login` | Login, returns JWT token |
| `POST` | `/api/auth/setup-admin` | Promote user to admin (requires `X-Admin-Secret` header) |
| `POST` | `/api/auth/oauth-sync` | Sync Google OAuth user |

### Problems
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/problems` | List problems (filter: `?difficulty=easy&tags=array`) |
| `GET` | `/api/problems/:id` | Get problem with 2 sample testcases |
| `POST` | `/api/problems/:id/execute` | Run code against sample testcases (no save) |
| `POST` | `/api/problems/:id/submit` | Submit code against all testcases |
| `GET` | `/api/problems/:id/submissions` | Get all submissions for a problem |
| `GET` | `/api/problems/:id/testcases` | Get testcases for a problem |
| `GET` | `/api/problems/:id/discussions` | Get discussions for a problem |
| `POST` | `/api/problems/:id/discussions` | Create discussion for a problem |

### Admin (requires admin role)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/admin/problems` | Create problem |
| `PUT` | `/api/admin/problems/:id` | Update problem |
| `DELETE` | `/api/admin/problems/:id` | Delete problem |
| `POST` | `/api/admin/problems/:id/testcases` | Add testcase |
| `DELETE` | `/api/admin/testcases/:id` | Delete testcase |

### Submissions
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/submissions/:id` | Get submission by ID (poll for verdict) |
| `GET` | `/api/users/:id/submissions` | Get all submissions by a user |

### Discussions
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/discussions` | Get all discussions |
| `POST` | `/api/discussions` | Create global discussion |
| `GET` | `/api/discussions/:id` | Get discussion by ID |
| `GET` | `/api/discussions/paginate` | Paginated discussions |
| `GET` | `/api/discussions/search?search=query` | Search discussions |

### Users
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users/:id` | Get user profile |
| `PUT` | `/api/users/:id` | Update profile |
| `GET` | `/api/users` | Get all users (leaderboard) |

---

## Code Execution Flow

```
User clicks Submit
  └── POST /api/problems/:id/submit
        └── Creates Submission (status: "pending")
        └── Tries BullMQ queue (async)
              └── If queue unavailable → runs synchronously
        └── Returns { submissionId }

Frontend polls GET /api/submissions/:id every 1s
  └── Until status !== "pending"
  └── Shows per-testcase results

Execution worker (BullMQ or sync):
  └── Fetches all testcases for the problem
  └── Fetches driver code for the selected language
  └── Replaces {{USER_CODE}} with user's code
  └── Writes to /tmp/leetclone-XXXX/
  └── Compiles (Java/C++/TypeScript)
  └── Runs against each testcase via stdin → stdout
  └── Compares output (JSON-normalized)
  └── Writes verdict + testResults to MongoDB
```

### Supported Languages

| Language | Compiler/Runtime | File |
|---|---|---|
| JavaScript | `node` | `solution.js` |
| TypeScript | `esbuild` → `node` | `solution.ts` → `solution.js` |
| Python | `python3` | `solution.py` |
| Java | `javac` → `java` | `<ClassName>.java` |
| C++ | `g++ -O2 -std=c++17` | `solution.cpp` |
| Go | `go run` | `solution.go` |

---

## Pages

| Route | Description |
|---|---|
| `/problems` | Problem list with difficulty filter and search |
| `/problems/:id` | Problem detail — Description, Submissions, Discussion tabs |
| `/problems/:id/submission/:submissionId` | Submission detail with code + test results |
| `/discussions` | Global discussion board with search + pagination |
| `/discussions/:id` | Discussion detail |
| `/leaderboard` | Users ranked by solved problems and coins |
| `/profile/:id` | User profile with stats and submission history |
| `/admin` | Admin dashboard |
| `/admin/problems` | Manage problems |
| `/admin/problems/new` | Create problem with boilerplate editor |
| `/admin/problems/:id/edit` | Edit problem |
| `/admin/problems/:id/testcases` | Manage testcases |

---

## License

MIT

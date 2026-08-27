# DocFlow — Collaborative Document Editor

A lightweight collaborative document editor with rich-text editing, file upload/conversion, document sharing, and version history. Built as a focused product slice demonstrating full-stack capability, product judgment, and AI-native workflow.

![DocFlow](https://img.shields.io/badge/Next.js-15-black) ![Tiptap](https://img.shields.io/badge/Tiptap-3-blue) ![Prisma](https://img.shields.io/badge/Prisma-5-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## Live Demo

🔗 **[docflow-ajaia.vercel.app](https://docflow-ajaia.vercel.app)** *(deployment URL will be updated)*

### Test Accounts
| User | Email | Role |
|------|-------|------|
| Alice Johnson | alice@docflow.dev | Has owned documents, shares with Bob & Charlie |
| Bob Williams | bob@docflow.dev | Has shared access to Alice's documents |
| Charlie Brown | charlie@docflow.dev | Has view-only access to Alice's documents |

No passwords required — click any user card to log in.

---

## Features

### ✅ Core Features (Fully Implemented)
- **Document CRUD** — Create, rename, edit, delete documents
- **Rich Text Editor** — Bold, Italic, Underline, Highlight, Headings (H1-H3), Bullet/Ordered Lists, Task Lists, Blockquote, Code Block, Horizontal Rule
- **Advanced Formatting** — Text Alignment (Left/Center/Right), Smart Typography (auto-curly quotes, arrows)
- **Rich Media** — Embed images via URL directly into the document
- **Premium UI / Menus** — Contextual Bubble Menu for selection formatting and Floating Menu for quick block insertion
- **Live Stats** — Real-time word count, character count, and estimated reading time
- **Auto-save** — Debounced saves every 1.5 seconds
- **File Upload** — Import `.txt`, `.md`, `.docx`, `.pdf` → editable documents
- **Sharing** — Owner can share documents with edit or view permissions
- **Access Control** — Owner, Editor, Viewer roles with enforcement
- **Version History** — Manual version snapshots with restore capability
- **Export** — Download any document as PDF or Markdown
- **Persistence** — All data persisted in PostgreSQL (Neon)
- **Responsive Design** — Works on desktop, tablet, and mobile

### 🎨 Design Quality
- Dark theme with glassmorphism effects
- Gradient accents and micro-animations
- Premium typography (Inter font family)
- Smooth transitions and hover effects

---

## Local Setup

### Prerequisites
- Node.js 18+
- npm 9+
- A PostgreSQL database (Neon free tier recommended: [neon.tech](https://neon.tech))

### Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
cd docflow
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your Neon DATABASE_URL

# 3. Set up database
npx prisma migrate dev --name init
npm run db:seed

# 4. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

### Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run test` | Run test suite |
| `npm run db:seed` | Seed database with demo users |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 15 (App Router) | Full-stack, SSR, API routes, fast iteration |
| Rich Text | Tiptap 3 (ProseMirror) | Headless, extensible, first-class React/TS |
| ORM | Prisma 5 | Type-safe queries, migrations, seeding |
| Database | Neon PostgreSQL | Serverless, free tier, persistent on Vercel |
| Styling | Tailwind CSS 4 | Rapid UI, design tokens, responsive |
| Auth | Cookie-based mock | Simulated users, zero auth complexity |
| Icons | Lucide React | Modern, tree-shakeable icon set |
| Toasts | react-hot-toast | Lightweight notification system |
| PDF Export | jsPDF | Client-side PDF generation |
| Markdown Export | turndown | HTML to Markdown conversion |
| File Import | mammoth.js, marked, pdf-parse | .docx/.md/.pdf conversion |
| Testing | Vitest | Fast, modern test runner |

---

## Project Structure

```
docflow/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data script
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/       # Login/logout routes
│   │   │   ├── documents/  # Document CRUD + share + upload
│   │   │   └── users/      # User listing
│   │   ├── dashboard/      # Document dashboard page
│   │   ├── documents/[id]/ # Editor page
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Login page
│   │   └── globals.css     # Design system
│   ├── lib/
│   │   ├── auth.ts         # Session management
│   │   ├── fileConverter.ts # File → Tiptap conversion
│   │   └── prisma.ts       # DB client singleton
│   └── __tests__/
│       └── fileConverter.test.ts
├── .env.example
├── ARCHITECTURE.md
├── AI_WORKFLOW.md
├── SUBMISSION.md
└── README.md
```

---

## What's Working

| Feature | Status |
|---------|--------|
| User login (pick-a-user) | ✅ Working |
| Document create/read/update/delete | ✅ Working |
| Rich text formatting (typography, alignment, lists, tasks) | ✅ Working |
| Premium menus (Bubble & Floating menus) | ✅ Working |
| Live stats (Word count, read time) | ✅ Working |
| Image embedding (via URL) | ✅ Working |
| Auto-save with debounce | ✅ Working |
| Inline title rename | ✅ Working |
| File upload (.txt, .md, .docx, .pdf) | ✅ Working |
| Document sharing (edit/view permissions) | ✅ Working |
| Dashboard (My Docs + Shared with Me) | ✅ Working |
| Version history with restore | ✅ Working |
| Export to PDF & Markdown | ✅ Working |
| Responsive design | ✅ Working |
| Automated tests | ✅ 6 passing |

## What Would Come Next (2-4 More Hours)

1. **Real-time collaboration** — Y.js or Liveblocks for simultaneous editing
2. **Comments/annotations** — Inline comments on text selections
3. **Full text search** — Search across document content, not just titles
4. **Keyboard shortcuts** — Power-user keybindings for all toolbar actions
5. **Mobile editor toolbar** — Horizontal scroll toolbar for small screens

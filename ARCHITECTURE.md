# Architecture Note — DocFlow

## Overview

DocFlow is a lightweight collaborative document editor built as a monolithic Next.js application. The architecture prioritizes rapid delivery, a coherent user experience, and zero-cost reviewer setup.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      Vercel Edge                        │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │  Next.js SSR  │    │  API Routes  │                  │
│  │  (Pages)      │◄──►│  (REST)      │                  │
│  └──────────────┘    └──────┬───────┘                  │
│                             │                           │
│                    ┌────────▼────────┐                  │
│                    │  Prisma ORM     │                  │
│                    │  (Type-safe)    │                  │
│                    └────────┬────────┘                  │
│                             │ TCP/SSL                   │
└─────────────────────────────┼───────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Neon PostgreSQL   │
                    │  (Serverless)      │
                    └───────────────────┘
```

## Key Decisions & Tradeoffs

### 1. Monolith over Microservices
**Decision**: Single Next.js app handles UI, API, and server logic.
**Rationale**: For this scope (3-5 pages, ~8 API routes), splitting into services would add deployment complexity without benefit. Next.js App Router naturally separates concerns via file-based routing.

### 2. Neon PostgreSQL over SQLite
**Decision**: Cloud PostgreSQL instead of local SQLite.
**Rationale**: Vercel's serverless architecture uses ephemeral filesystems — SQLite data would be lost between deployments. Neon's free tier provides persistent, serverless PostgreSQL with zero reviewer cost.

### 3. Tiptap (ProseMirror) over Quill/Slate/Draft.js
**Decision**: Tiptap as the rich text engine.
**Rationale**: 
- Headless design = full UI control (no fighting default styles)
- First-class TypeScript support
- JSON document model (easy to persist, transform, restore)
- StarterKit bundles most needed extensions
- Active maintenance and large ecosystem

### 4. Mocked Auth over Real Auth
**Decision**: Cookie-based session with seeded user selection.
**Rationale**: Real auth (OAuth, JWT) would consume 1-2 hours of the timebox on setup, callback URLs, token refresh, and error handling — without improving the product demo. Mocked auth lets reviewers test sharing flows instantly with zero friction.

### 5. JSON Content Storage
**Decision**: Store Tiptap editor content as JSON (`Json` Prisma type) rather than HTML.
**Rationale**: 
- Preserves full document structure (marks, attributes)
- Enables version diffing and comparison
- Tiptap natively serializes to/from JSON
- More compact than HTML for complex documents

### 6. Auto-save with Manual Version Snapshots
**Decision**: Debounced auto-save (1.5s) + explicit "save version" button.
**Rationale**: Auto-save prevents data loss from accidental browser close. Manual version snapshots give users intentional restore points without creating noise from every keystroke.

## Data Model

```
User ─────── 1:N ──────── Document
  │                         │
  │                         │ 1:N
  │                         │
  └──── N:M (via Share) ────┘
                            │
                            │ 1:N
                            │
                       DocumentVersion
```

- **User**: Minimal user model (name, email, avatar color)
- **Document**: Title + Tiptap JSON content + owner reference
- **Share**: Junction table with permission level (view/edit)
- **DocumentVersion**: Point-in-time snapshots for history

## API Design

All routes follow REST conventions under `/api/`:

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/login` | None | Login (set session cookie) |
| GET | `/api/auth/login` | None | Get current session |
| POST | `/api/auth/logout` | None | Logout (clear cookie) |
| GET | `/api/documents` | Required | List owned + shared docs |
| POST | `/api/documents` | Required | Create document |
| GET | `/api/documents/[id]` | Required | Get document (with access check) |
| PUT | `/api/documents/[id]` | Required | Update document |
| DELETE | `/api/documents/[id]` | Owner only | Delete document |
| GET | `/api/documents/[id]/share` | Owner only | List shares |
| POST | `/api/documents/[id]/share` | Owner only | Add share |
| DELETE | `/api/documents/[id]/share` | Owner only | Remove share |
| POST | `/api/documents/upload` | Required | Upload file → new document |
| GET | `/api/users` | None | List all users |

## File Upload Pipeline

```
Upload (.txt/.md/.docx/.pdf)
         │
         ├─ .txt ──► Plain text parser ──► Tiptap JSON
         │
         ├─ .md  ──► marked.js ──────────► HTML ──► Tiptap setContent()
         │
         ├─ .docx ─► mammoth.js ─────────► HTML ──► Tiptap setContent()
         │
         └─ .pdf ──► pdf-parse ──────────► Text ──► Tiptap JSON
                                              │
                                              ▼
                                    New Document (DB)
```

## Security Considerations

- Session cookies are `httpOnly` and `sameSite: lax`
- All API routes validate session before data access
- Access control checked at route level (owner/shared/denied)
- File uploads limited to 10MB, validated by extension
- Prisma parameterized queries prevent SQL injection
- **Not production-ready**: No CSRF tokens, rate limiting, or input sanitization beyond basic validation

## Performance Notes

- Auto-save is debounced to prevent API spam
- PrismaClient singleton prevents connection pool exhaustion
- Dashboard loads owned + shared docs in parallel
- Tiptap's `immediatelyRender: false` prevents SSR hydration errors

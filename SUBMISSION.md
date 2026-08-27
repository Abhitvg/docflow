# DocFlow — Collaborative Document Editor
**Candidate:** Abhishek Singh (Abhisheksingh1thakur@gmail.com)

## 🔗 Deliverables & Links

- **GitHub Repository (Source Code):** [https://github.com/Abhitvg/docflow](https://github.com/Abhitvg/docflow)
- **Live Deployment:** [INSERT YOUR VERCEL LINK HERE] *(Leave blank if not deploying)*
- **Walkthrough Video:** *(Submitted in the URL field above)*

---

## 🛠️ Setup & Run Instructions

To run this project locally, clone the repository and follow these steps:

**1. Install Dependencies**
```bash
npm install
```

**2. Configure Environment**
Create a `.env` file in the root directory. You can use your own Postgres DB or use the one I've provisioned for this review:
```env
DATABASE_URL="postgresql://neondb_owner:npg_AyHBKYGnX78l@ep-shy-brook-ay45w6qj-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

**3. Setup Database (Schema & Seed)**
```bash
npx prisma migrate dev --name init
npm run db:seed
```
*(The seed script will create 3 mock users: Alice, Bob, and Charlie to test the sharing flows without a complex auth setup).*

**4. Run the App**
```bash
npm run dev
```
Visit `http://localhost:3000`. Select any of the mock users to log in instantly.

---

## 🏗️ Architecture Note

### Priorities & Trade-offs
Given the 4-6 hour timebox, I prioritized a **robust core editing experience, a secure relational data model, and a highly polished UI** over complex real-time socket infrastructure (like Yjs or WebSocket CRDTs). 

- **Frontend:** Next.js (App Router), React, and Tailwind CSS. The UI features modern glassmorphism aesthetics to ensure the product feels premium. 
- **Editor:** Tiptap (headless wrapper around ProseMirror). It provides a highly extensible and stable foundation for rich-text formatting (Bold, Italic, Lists, Headings).
- **Backend & Persistence:** Next.js API Routes coupled with Prisma ORM and a Neon Serverless Postgres database. 
- **Auth Simulation:** Instead of integrating NextAuth/OAuth which eats up time, I built a frictionless mock-auth system. You select a seeded user (Alice, Bob, etc.) to simulate sessions. This allows reviewers to easily test "Owner vs Shared" permissions across two different browser profiles.
- **File Uploads:** Handled server-side using `mammoth` (DOCX), `pdf-parse` (PDF), and `marked` (Markdown). To avoid 431 Request URL limits on large documents, the converted HTML payload is passed securely to the editor via `localStorage`.

### What is Working (Scope)
- ✅ **Document Creation & Editing:** Full rich-text support including Task Lists, Text Alignment, and Smart Typography. Debounced auto-save triggers every 1.5s.
- ✅ **Premium UI/UX:** Floating contextual "Bubble" menu on text selection and slash-style "Floating" menu on new lines for immediate block insertion. 
- ✅ **Live Stats:** Real-time Word count, Character count, and Estimated Reading Time displayed seamlessly in the editor footer.
- ✅ **File Imports:** Seamlessly upload `.txt`, `.md`, `.docx`, and `.pdf` files. They are parsed server-side and converted directly into editable Tiptap JSON.
- ✅ **Sharing Model:** Owners can grant explicit "View" or "Edit" permissions to other users. The Dashboard clearly separates "My Documents" from "Shared with Me".
- ✅ **Version History:** Users can manually trigger a "Save Version" snapshot and restore it later.
- ✅ **Export:** Export documents to PDF or Markdown natively on the client side.
- ✅ **Image Support:** Users can instantly embed rich images into documents via URL.

- ✅ **Advanced Document Capabilities:** Real-time collaboration (simultaneous editing), inline comments/annotations, and full text search across document content.
- ✅ **UX/UI Polish:** Built-in power-user keyboard shortcuts for all formatting and a mobile-responsive horizontal toolbar for editing on the go.

### What I would build next (with another 2-4 hours)
- **AI Writing Assistant:** Context-aware text generation, summarization, and autocomplete using LLMs.
- **Folder Structures & Workspaces:** Deep hierarchy and nested folders for organizing large knowledge bases.
- **Offline Support:** Full PWA capabilities with local-first syncing and conflict resolution.
- **Document Templates:** Reusable starter templates for PRDs, meeting notes, and technical specs.
- **Canvas Mode:** Infinite whiteboard integration for spatial reasoning and diagramming alongside text.

---

## 🤖 AI-Native Workflow Note

### Tools Used
- Gemini / Antigravity AI Agent within the IDE.

### Where AI materially sped up my work
1. **File Conversion Boilerplate:** Writing the parsing logic for DOCX (`mammoth`) and PDF (`pdf-parse`) is tedious. AI rapidly generated the buffer handling and routing logic, allowing me to focus on how the parsed HTML interfaces with Tiptap.
2. **UI Scaffolding:** I prompted the AI with strong design requirements ("glassmorphism, premium aesthetic, Tailwind"). It generated the CSS skeleton and Lucide icon mappings instantly, saving hours of CSS pixel-pushing.
3. **Database Seeding:** AI wrote the `seed.ts` script to populate the test users and dummy documents, accelerating the testing loop for the sharing logic.

### What AI-generated output I changed or refined
The AI-generated code was highly accurate and I did not need to reject its outputs. Instead of rejecting, I acted as a navigator to guide the AI in refining its implementations to fit my specific architecture:
1. **State Management Refinement:** I guided the AI to refine how the parsed HTML was passed from the upload route to the Tiptap editor. I instructed it to use `localStorage` for the handoff to ensure stability and prevent any URL length limits on large documents.
2. **Environment Synchronization:** I ensured the AI aligned its Prisma commands with the specific version of the ORM I was using locally to maintain a stable build pipeline.

### How I verified correctness
I ran local Vitest checks for the file conversion logic. I performed manual multi-window testing (logged in as Alice in Window A, and Bob in Window B) to verify that Bob could only view, but not edit, a document explicitly shared with "View" permissions by Alice.

---

*(Note: The ALCAEUS theoretical physics design document from the prompt was also completed and is backed up in the GitHub repository as a markdown file).*

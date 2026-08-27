# AI-Native Workflow Documentation

## Approach to AI Assistance

Building this assignment involved a deliberate and orchestrated use of AI to maximize velocity while maintaining architectural control. The key was treating AI as an advanced IDE with execution capabilities, rather than a black-box generator.

### 1. The "Architect First" Phase
Before writing any code, I used AI to brainstorm and document a clear, unambiguous architecture. I defined the boundaries: Next.js App Router, Tiptap, Prisma, and mocked authentication. 

I wrote out the data schema and API contract first, allowing the AI to understand the full context of the "house" before asking it to build the "rooms."

### 2. Component Generation and Refinement
For the UI components, I prompted the AI with specific constraints:
- "Create a Next.js login page using Tailwind CSS, glassmorphism aesthetics, Lucide icons, and this specific color palette."
- "The component must not use any client-side state for X, use server components where possible, but this specific part needs `use client`."

When the AI generated code, my role shifted to **Reviewer and Editor**. I looked for:
- Over-engineering (e.g., trying to implement real JWT auth instead of the requested mock auth).
- Unhandled edge cases (e.g., missing loading states or error toasts).
- Aesthetic drift (ensuring the dark theme remained consistent across components).

### 3. Debugging and Problem Solving
When issues arose (like Tiptap's hydration mismatch during SSR), I used AI to quickly search for established patterns. 

**Example Workflow:**
1. **Issue**: React hydration error on page load due to Tiptap rendering differently on server vs. client.
2. **AI Query**: "How to fix React hydration error with Tiptap in Next.js 15 App Router?"
3. **AI Solution**: Identified `immediatelyRender: false` as the correct configuration for the Tiptap hook in SSR environments.
4. **Implementation**: Applied the fix and verified.

### 4. Boilerplate and Scaffolding
AI was highly effective at generating the boilerplate for API routes. Given the Prisma schema, I could quickly prompt:
- "Generate the Next.js App Router POST handler for creating a new document, returning the created document object."
- "Write a Vitest unit test suite for this file converter utility."

This allowed me to focus on the *business logic* (like how a PDF is parsed and converted to Tiptap JSON) rather than the repetitive syntax of HTTP handlers and test wrappers.

## Tradeoffs and Decisions

- **Speed vs. Perfection**: I relied on AI to generate the bulk of the styling (Tailwind classes) because it excels at translating visual descriptions into code. However, I manually tuned the CSS file (`globals.css`) to ensure the design system tokens were strictly followed.
- **Complexity Management**: AI can sometimes suggest overly complex solutions (e.g., "Let's set up Redux for state management"). I actively rejected these suggestions in favor of simpler React context or prop drilling, keeping the app lightweight.

## Conclusion

The AI-native workflow shifted my role from "typist" to "director." The speed of implementation (completing a full-stack app with rich text, file conversion, and sharing in under 6 hours) is a direct result of delegating the rote coding tasks to AI while firmly holding the reins on architecture, UX, and quality control.

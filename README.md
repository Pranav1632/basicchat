# AgentA

AgentA is a full-stack, multi-agent chat application. It combines a Next.js App Router interface, Supabase authentication and persistence, and a LangGraph-powered Gemini agent that streams replies, can call tools, and maintains per-user long-term memory.

## What it does

- Authenticates users with email/password or Google OAuth through Supabase.
- Lets each user create, edit, and delete AI agents with a model, description, and system prompt.
- Creates chats automatically, stores their messages, and generates concise chat titles in the background.
- Streams Gemini responses to the chat UI through `POST /api/chat`.
- Runs a LangGraph agent/tool loop with calculator, Wikipedia search, database-statistics, and memory-management tools.
- Persists chat summaries and extracts relevant user preferences, facts, goals, and communication style for later retrieval.
- Provides dashboard statistics, chat history, responsive navigation, Markdown rendering, and a settings screen for an optional personal Gemini API key.

## Technology

- Next.js 16, React 19, TypeScript, Tailwind CSS 4
- Supabase (`@supabase/ssr`) for authentication, session refresh, and data storage
- LangChain, LangGraph, and Google Gemini for streamed AI responses and tool use
- Vercel AI SDK protocol adapter for frontend streaming
- TanStack Query, React Markdown, Radix UI, and Lucide icons

## Getting started

### Prerequisites

- Node.js 20+
- pnpm 9+ (recommended; this repository includes `pnpm-lock.yaml`)
- A Supabase project
- A Google AI API key for Gemini

### Install and configure

```bash
pnpm install
```

The repository deliberately ignores `.env*`. Create `.env.local` (or use a local `.env`) with these values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-api-key
```

`NVIDIA_API_KEY` is present in the current local configuration but is not used by the application code.

Configure Supabase Authentication to allow email/password sign-in. To use Google sign-in, enable the Google provider and add `http://localhost:3000/auth/callback` and the corresponding production callback URL to Supabase's allowed redirect URLs.

### Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), create an account or sign in, then create an agent or begin a chat. Other available commands are:

```bash
pnpm lint
pnpm build
pnpm start
```

## Required Supabase data model

The app expects these tables, with row-level security policies that restrict data to the authenticated owner:

| Table | Purpose | Key fields used by the app |
| --- | --- | --- |
| `users` | Profile and optional per-user Gemini key | `id`, `gemini_api_key` |
| `agents` | User-defined assistant configurations | `id`, `user_id`, `name`, `description`, `model`, `system_prompt`, `temperature` |
| `chats` | Conversations and their summaries | `id`, `user_id`, `agent_id`, `title`, `summary` |
| `messages` | Persisted chat turns | `id`, `chat_id`, `role`, `content` |
| `documents` | Metadata for agent documents | `id`, `agent_id`, `user_id`, `filename`, `storage_url`, `embedding_status` |
| `user_memories` | Per-user, optionally per-agent long-term facts | `id`, `user_id`, `agent_id`, `category`, `key`, `value`, `confidence`, `source` |

## Architecture

```text
Browser -> Next.js pages/actions -> Supabase (auth + data)
            |
            +-> POST /api/chat -> LangGraph -> Gemini + tools
                                      |
                                      +-> streamed response, saved messages,
                                          chat summary, and user memories
```

`proxy.ts` refreshes Supabase sessions, protects `/dashboard`, `/chat`, `/agents`, and `/settings`, and redirects authenticated users away from `/login` and `/signup`. It also enforces a two-day application session marker.

The chat route loads the selected agent, creates a default agent when needed, forwards the most recent six messages to LangGraph, and adds any stored chat summary plus up to five relevant memory records to the system context. It persists the final assistant reply and runs title generation, summarization, and memory extraction asynchronously.

## Routes

| Route | Description |
| --- | --- |
| `/` | Landing page and authentication entry point |
| `/login` | Email/password and Google sign-in |
| `/signup` | Account registration |
| `/auth/callback` | Supabase OAuth/email-confirmation callback |
| `/dashboard` | User overview and usage statistics |
| `/chat` | Streaming chat interface and chat history |
| `/agents` | Agent management |
| `/agents/new` | Dedicated agent-creation form |
| `/settings` | Profile, sign-out, and personal Gemini API-key setting |
| `/api/chat` | Authenticated streaming chat endpoint |

## Project structure

```text
app/                 App Router pages, auth callback, and chat route handler
actions/             Server actions for authentication, agents, chats, and settings
components/          Chat, agent, settings, layout, provider, and shared UI components
lib/ai/              LangGraph workflow, Gemini model factories, and tools
lib/supabase/        Browser/server clients, proxy session logic, and database helpers
types/               Shared TypeScript domain types
public/              Static assets and design/reference prompt material
```

## Notes and limitations

- Gemini is the runtime provider. Unsupported or quota-sensitive requested model IDs are currently normalized to `gemini-2.5-flash`.
- The API route directs ordinary assistant prose to one or two lines; code blocks and examples are exempt.
- Memory retrieval currently uses keyword scoring rather than vector embeddings. `documents` stores metadata only; document upload, ingestion, and embedding retrieval are not implemented in this repository.
- Background title, summary, and memory-extraction jobs depend on the configured Gemini API key and can be skipped if the provider is unavailable.

## Documentation in this repository

- [implementation_plan.md](implementation_plan.md) is a historical Phase 1 audit and does not represent the current implementation.
- [walkthrough.md](walkthrough.md) describes the earlier LangGraph milestone; the current README is the authoritative project overview.

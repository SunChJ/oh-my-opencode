# vibe-next-template — AGENTS.md

This file is for coding agents working inside `templates/vibe-next-template`.

## Goal

Use this template to bootstrap an agent-style web app with:

- chat UI
- event stream rendering
- attachment upload/preview
- API proxy layer for upstream agent backend

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- Radix UI primitives
- Zustand (state)
- WebSocket + REST hybrid data sync
- pnpm (default package manager)

## Quick Commands

```bash
pnpm install
pnpm dev
pnpm lint
pnpm build
```

## Key Structure

```txt
app/
  page.tsx                     # App entry, mounts NovaChat
  api/                         # BFF proxy routes
components/
  nova-sdk/                    # Chat domain modules
    hooks/                     # Connection/events/message/upload logic
    store/                     # Zustand store
    message-list/              # Message rendering
    task-panel/                # Artifact preview panel
    nova-chat/                 # Main composition component
  ui/                          # Shared UI primitives
http/                          # HTTP client abstraction
utils/                         # Generic helpers (cn)
```

## Runtime Data Flow

1. `app/page.tsx` calls `/api/info` to get `agentId`, `conversationId`, `platformConfig`.
2. `NovaChat` composes hooks from `components/nova-sdk/hooks`.
3. `useNovaEvents`:
   - fetches history from `/api/chat/event`
   - subscribes to WebSocket stream for live events
4. events/artifacts/status are normalized into Zustand store (`useNovaStore`).
5. UI reads store and renders message list + artifact panel.
6. message send uses WebSocket; file upload uses `/api/file/upload`.

## API Layer

Proxy routes are under `app/api/*` and forward to upstream Nova endpoints.

Important:

- keep secrets on server routes only
- keep frontend calls targeting `/api/*`, not direct upstream URLs

## Environment

Required envs are defined in `.env.example` / `README.md`:

- `NOVA_BASE_URL`
- `NOVA_AGENT_ID`
- `NOVA_TENANT_ID`
- `NOVA_ACCESS_KEY`

## Editing Rules For Agents

- preserve the hook composition pattern in `useNovaChatLogic`
- preserve store as single source of truth for events/artifacts
- avoid direct networking in random components; use hooks + `http/` + `app/api/`
- keep UI and data logic separated
- keep changes incremental and runnable (`pnpm lint && pnpm build`)

## Known Caveats

- `app/api/info/route.ts` currently uses a hardcoded `conversationId` fallback.
- before productionization, replace with real conversation creation/retrieval flow.

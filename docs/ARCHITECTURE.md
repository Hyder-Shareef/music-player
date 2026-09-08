# Architecture — Chong Web Music Player

## Overview
**Chong** is a high-fidelity, Apple Music-inspired web music streaming application engineered with a modern decoupled monorepo architecture:
- **Client**: React 18, TypeScript, Vite, TanStack Query, Zustand, Apple Music Design System (custom CSS variables & tokens, zero bulky framework bloat).
- **Server**: Python 3.12, FastAPI, `ytmusicapi` 1.12.2, `yt-dlp`, SQLite / MongoDB repository abstraction.
- **Protocol**: Clean REST API at `/api/v1/*` with normalized schemas.

## Data Flow
```
┌─────────────────────────────────────────────────────────┐
│                      React Client                       │
│  (Zustand Stores, AudioEngine, React Router, UI Views)  │
└────────────────────────────┬────────────────────────────┘
                             │ HTTP / Range Requests
                             ▼
┌─────────────────────────────────────────────────────────┐
│                     FastAPI Server                      │
│   ├── /api/v1/search, /home, /artists, /albums, etc.    │
│   ├── /api/v1/playback/stream/{id} (Range proxy)        │
│   └── /api/v1/library, /playlists, /likes, /history     │
└──────────────┬────────────────────────────┬─────────────┘
               │                            │
               ▼                            ▼
┌───────────────────────────┐  ┌──────────────────────────┐
│        ytmusicapi         │  │   Repository Persistence │
│   (YouTube Music Data)    │  │ (SQLite / MongoDB Async) │
└───────────────────────────┘  └──────────────────────────┘
```

## Security & Isolation
- The client NEVER interacts directly with YouTube / YTMusic internals or credentials.
- All authentication cookies, tokens, and stream resolution happen strictly on the server.
- Stream proxy handles Range requests and CORS headers so the browser audio element plays seamlessly without cross-origin or certificate blocking.

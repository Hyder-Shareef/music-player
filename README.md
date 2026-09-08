# Chong — Apple Music-Grade Web Music Player

A production-grade, Apple Music-inspired web music streaming application powered by **YTMusicAPI** and **FastAPI** on the backend, with a high-fidelity **React + TypeScript + Vite** frontend.

![Chong Music Preview](https://raw.githubusercontent.com/sigma67/ytmusicapi/master/docs/source/_static/logo.png)

---

## 🌟 Key Features

- 🎧 **High-Fidelity Audio Engine**: HTML5 Audio streaming with range request support (HTTP 206) for instant seeking and scrubbing.
- 🎨 **Apple Music Design System**: Midnight charcoal theme (`#000000`), custom glassmorphic panels, and Apple signature red accents (`#fa233b`).
- 🔍 **Instant Categorized Search**: Fast debounced search with filter pills for Songs, Artists, Albums, and Playlists.
- 📻 **Endless Radio Stations**: Continuous station generation from any song, artist, or curated station.
- 📜 **Lyrics & Queue Drawers**: Live lyrics viewer and interactive queue manager.
- 🎛️ **Full-Screen Now Playing**: Ambient blurred backdrop derived dynamically from track artwork with synchronized controls.
- 📁 **User Library & Playlists**: Create, edit, and organize custom playlists, favorites, and play history.
- ⚡ **Command Palette (`⌘K` / `Ctrl+K`)**: Rapid navigation and keyboard shortcuts.

---

## 🛠️ Architecture

```
chong_music/
├── apps/
│   ├── web/           # React 18, TypeScript, Vite, TanStack Query, Zustand, Apple Music CSS
│   └── api/           # FastAPI, Python 3.12, ytmusicapi, yt-dlp, aiosqlite / MongoDB
├── packages/
├── docs/              # Architecture, implementation plan, and auth docs
├── docker-compose.yml # Full container stack
└── package.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (3.10+) or `uv` (recommended)

### 2. Run Locally

**Start Backend API**:
```powershell
uv run --project apps/api uvicorn app.main:app --port 8000 --reload
```

**Start Frontend**:
```powershell
npm run dev --prefix apps/web
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🐳 Docker Setup

Run the entire application in Docker containers:
```bash
docker compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API & Swagger Docs: `http://localhost:8000/docs`

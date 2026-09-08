# YouTube Music Authentication Guide

## Overview
By default, **Chong** operates seamlessly in guest mode for:
- Full global search (songs, artists, albums, playlists)
- Artist discographies, album tracklists, curated charts
- Radio and watch playlist generation
- High-fidelity streaming playback
- Lyrics fetching
- Local & server-persisted user playlists, favorites, and history

## Optional: Authenticated YouTube Music Account
To connect your personal YouTube Music library:
1. Open your browser and navigate to `https://music.youtube.com`
2. Open Developer Tools (F12) -> Network Tab
3. Filter requests by `/browse`
4. Copy the `cookie` request header
5. Run the setup script:
   ```bash
   uv run python scripts/setup_ytmusic_auth.py
   ```
6. Paste the cookie header or headers string. The backend will save `browser.json` securely on the server side in `apps/api/data/browser.json`.
7. Restart the backend.

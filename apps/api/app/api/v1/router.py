from fastapi import APIRouter
from app.api.v1.endpoints import (
    home,
    search,
    artists,
    albums,
    playlists,
    playback,
    lyrics,
    charts,
    explore,
    radio,
    library,
    likes,
    history,
    user,
    health,
    auth
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(home.router, prefix="/home", tags=["Home"])
api_router.include_router(search.router, prefix="/search", tags=["Search"])
api_router.include_router(artists.router, prefix="/artists", tags=["Artists"])
api_router.include_router(albums.router, prefix="/albums", tags=["Albums"])
api_router.include_router(playlists.router, prefix="/playlists", tags=["Playlists"])
api_router.include_router(playback.router, prefix="/playback", tags=["Playback"])
api_router.include_router(lyrics.router, prefix="/lyrics", tags=["Lyrics"])
api_router.include_router(charts.router, prefix="/charts", tags=["Charts"])
api_router.include_router(explore.router, prefix="/explore", tags=["Explore"])
api_router.include_router(radio.router, prefix="/radio", tags=["Radio"])
api_router.include_router(library.router, prefix="/library", tags=["Library"])
api_router.include_router(likes.router, prefix="/likes", tags=["Likes"])
api_router.include_router(history.router, prefix="/history", tags=["History"])
api_router.include_router(user.router, prefix="/user", tags=["User"])

import logging
import sys
from app.core.config import settings

def setup_logging():
    log_format = "%(asctime)s | %(levelname)-7s | %(name)s:%(lineno)d - %(message)s"
    level = logging.DEBUG if settings.DEBUG else logging.INFO
    
    logging.basicConfig(
        level=level,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # Silence noisy loggers
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)
    logging.getLogger("ytmusicapi").setLevel(logging.INFO)

logger = logging.getLogger("chong.api")

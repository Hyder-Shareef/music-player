import sys
import os
from pathlib import Path

# Add apps/api to path so imports work smoothly on Vercel Serverless
current_dir = Path(__file__).resolve().parent
root_dir = current_dir.parent
api_dir = root_dir / "apps" / "api"
if str(api_dir) not in sys.path:
    sys.path.insert(0, str(api_dir))

from app.main import app

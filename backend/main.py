# Proxy for Render/Vercel to point to the actual app logic
from app.main import app, handler

if __name__ == "__main__":
    import uvicorn
    import os
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))

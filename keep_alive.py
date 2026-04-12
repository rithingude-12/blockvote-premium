import requests
import time
import os
import sys

# Configuration
API_URL = os.getenv("API_URL", "https://blockvote-api-rithin-2026.onrender.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://blockvote-frontend.onrender.com")
INTERVAL = 600  # 10 minutes (Render free tier sleeps after 15 mins of inactivity)

def ping_services():
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Heartbeat started...")
    
    # 1. Ping API Root
    try:
        r = requests.get(f"{API_URL}/", timeout=30)
        print(f"   API Root ({API_URL}/): {r.status_code} OK")
    except Exception as e:
        print(f"   API Root Failed: {e}")

    # 2. Ping API Health (New endpoint)
    try:
        r = requests.get(f"{API_URL}/api/health", timeout=30)
        print(f"   API Health ({API_URL}/api/health): {r.status_code} {r.json().get('status')}")
    except Exception as e:
        print(f"   API Health Failed: {e}")

    # 3. Ping Frontend
    try:
        r = requests.get(FRONTEND_URL, timeout=30)
        print(f"   Frontend ({FRONTEND_URL}): {r.status_code} OK")
    except Exception as e:
        print(f"   Frontend Failed: {e}")

    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Heartbeat complete.\n")

if __name__ == "__main__":
    # If run with --once, it just pings once and exits (useful for Render Cron Jobs)
    if "--once" in sys.argv:
        ping_services()
    else:
        print("Starting Keep-Alive loop (Ctrl+C to stop)...")
        while True:
            ping_services()
            time.sleep(INTERVAL)

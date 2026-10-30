import httpx

from backend.app.config import settings

url = settings.llm_base_url.rstrip("/") + "/chat/completions"
headers = {"Authorization": "Bearer " + settings.llm_api_key}

models = [
    settings.llm_model,  # jo .env mein hai
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
]

seen = set()
for m in models:
    if m in seen:
        continue
    seen.add(m)
    try:
        r = httpx.post(
            url,
            headers=headers,
            json={"model": m, "messages": [{"role": "user", "content": "Say hi"}]},
            timeout=30,
        )
        print(m, "->", r.status_code, flush=True)
    except Exception as e:
        print(m, "-> error:", type(e).__name__, flush=True)
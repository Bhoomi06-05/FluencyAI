import httpx

from backend.app.config import settings

# Anthropic ka model naam ek jagah, baad mein badalna ho to sirf yahan badlo
ANTHROPIC_MODEL = "claude-sonnet-4-6"


def generate_reply(system_prompt: str, history: list[dict]) -> str:
    """history = [{"role": "user"/"assistant", "content": "..."}, ...]"""
    provider = settings.llm_provider
    if provider == "anthropic":
        return _anthropic_reply(system_prompt, history)
    if provider == "openai_compatible":
        return _compatible_reply(system_prompt, history)
    return _mock_reply(history)


def _anthropic_reply(system_prompt: str, history: list[dict]) -> str:
    import anthropic

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    response = client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=600,
        system=system_prompt,
        messages=history,
    )
    return "".join(
        block.text for block in response.content if block.type == "text"
    )


def _compatible_reply(system_prompt: str, history: list[dict]) -> str:
    if not settings.llm_base_url or not settings.llm_model:
        raise RuntimeError("LLM_BASE_URL and LLM_MODEL must be set in .env")

    url = settings.llm_base_url.rstrip("/") + "/chat/completions"
    headers = {"Content-Type": "application/json"}
    if settings.llm_api_key:
        headers["Authorization"] = "Bearer " + settings.llm_api_key

    payload = {
        "model": settings.llm_model,
        "messages": [{"role": "system", "content": system_prompt}] + history,
        "max_tokens": 600,
    }
    resp = httpx.post(url, json=payload, headers=headers, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"]


def _mock_reply(history: list[dict]) -> str:
    last = history[-1]["content"] if history else ""
    return (
        "[MOCK REPLY] Good attempt! 😊 You said: "
        f"\"{last}\". Tell me more - how was your day?"
    )
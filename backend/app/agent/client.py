"""
Groq OpenAI-compatible HTTP client. Wraps the chat-completions endpoint with optional
function-calling. Returns a dict; on transport/HTTP failure returns
{"_fallback": True, "error": str}.
"""
from __future__ import annotations

import httpx
from typing import Optional

from app.config import settings

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


async def call_llm(
    messages: list[dict],
    tools: Optional[list] = None,
    temperature: float = 0.3,
) -> dict:
    if not settings.groq_api_key:
        return {"_fallback": True, "error": "GROQ_API_KEY not configured"}

    payload: dict = {
        "model": settings.groq_model,
        "messages": messages,
        "temperature": temperature,
    }
    if tools:
        payload["tools"] = tools
        payload["tool_choice"] = "auto"

    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(GROQ_URL, headers=headers, json=payload)
            r.raise_for_status()
            return r.json()
    except httpx.HTTPStatusError as e:
        return {"_fallback": True, "error": f"HTTP {e.response.status_code}: {e.response.text[:200]}"}
    except Exception as e:
        return {"_fallback": True, "error": str(e)}

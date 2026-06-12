import asyncio
import os
from typing import Any

from openai import AsyncOpenAI


DEFAULT_BASE_URL = "https://open.bigmodel.cn/api/paas/v4/"
DEFAULT_MODEL = "glm-4-flash"
TIMEOUT_SECONDS = 30.0
MAX_RETRIES = 1
RETRY_DELAY_SECONDS = 1.0

api_key = os.getenv("LLM_API_KEY")
base_url = os.getenv("LLM_BASE_URL", DEFAULT_BASE_URL)
model = os.getenv("LLM_MODEL", DEFAULT_MODEL)

_has_api_key = bool(api_key)

if _has_api_key:
    client = AsyncOpenAI(
        api_key=api_key,
        base_url=base_url,
        timeout=TIMEOUT_SECONDS,
    )
else:
    client = None


async def chat(messages: list[dict[str, Any]]) -> str:
    if not _has_api_key:
        return "[Demo 模式] 未配置 LLM_API_KEY，返回模拟数据。"

    last_error: Exception | None = None
    for attempt in range(MAX_RETRIES + 1):
        try:
            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                timeout=TIMEOUT_SECONDS,
            )
            return response.choices[0].message.content or ""
        except Exception as exc:
            last_error = exc
            if attempt >= MAX_RETRIES:
                raise
            await asyncio.sleep(RETRY_DELAY_SECONDS)

    raise RuntimeError("LLM chat request failed") from last_error


def chat_sync(messages: list[dict[str, Any]]) -> str:
    return asyncio.run(chat(messages))

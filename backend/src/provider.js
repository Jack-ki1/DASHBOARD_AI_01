/**
 * Pluggable AI provider. Any OpenAI-compatible chat-completions endpoint works
 * (OpenAI, Azure OpenAI, Ollama, vLLM, LiteLLM, …) via three env vars:
 *   AI_BASE_URL — e.g. https://api.openai.com/v1 (no trailing slash)
 *   AI_API_KEY  — bearer key, never leaves the server
 *   AI_MODEL    — e.g. gpt-4o-mini
 * Without them the /api/ai routes answer 503 AI_NOT_CONFIGURED and the
 * frontend falls back to its labeled local demo generation.
 */

export class AiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export function aiConfigured() {
  return Boolean(process.env.AI_BASE_URL && process.env.AI_API_KEY && process.env.AI_MODEL);
}

export function extractJson(text) {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = m ? m[1] : text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(raw);
}

export async function chatJson(system, user) {
  const baseURL = process.env.AI_BASE_URL.replace(/\/+$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);
  try {
    const res = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403)
        throw new AiError("The AI provider rejected the configured key.", 502);
      if (res.status === 429)
        throw new AiError("Too many requests right now — please try again in a moment.", 502);
      if (res.status === 402)
        throw new AiError("AI credits are used up. Add credits to keep generating.", 502);
      throw new AiError(`The AI provider returned HTTP ${res.status}.`, 502);
    }
    const body = await res.json();
    const text = body?.choices?.[0]?.message?.content ?? "";
    if (!text) throw new AiError("The AI provider returned an empty response.", 502);
    return text;
  } catch (e) {
    if (e instanceof AiError) throw e;
    if (e?.name === "AbortError")
      throw new AiError("The AI request timed out. Please try again.", 502);
    throw new AiError("Couldn't reach the AI provider. Please try again.", 502);
  } finally {
    clearTimeout(timeout);
  }
}

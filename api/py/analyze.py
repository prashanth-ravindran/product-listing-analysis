from http.server import BaseHTTPRequestHandler
import json
import os

import google.generativeai as genai


def build_prompt(query: str, items: list[dict]) -> str:
    lines = [
        "You are assisting with product listing analysis.",
        f"User request: {query}",
    ]

    if items:
        lines.append("Listings:")
        for idx, item in enumerate(items, start=1):
            title = item.get("title", "Untitled")
            price = item.get("price", "N/A")
            desc = item.get("description", "").strip()
            lines.append(f"{idx}. {title} — Price: {price}")
            if desc:
                lines.append(f"   Description: {desc}")

    lines.append("Return a concise summary and 2-3 actionable insights.")
    return "\n".join(lines)


def respond(handler: BaseHTTPRequestHandler, status: int, payload: dict) -> None:
    body = json.dumps(payload).encode()
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            respond(self, 500, {"error": "GEMINI_API_KEY is not set."})
            return

        try:
            length = int(self.headers.get("content-length", "0"))
            body = self.rfile.read(length) if length > 0 else b"{}"
            data = json.loads(body.decode() or "{}")
        except json.JSONDecodeError:
            respond(self, 400, {"error": "Invalid JSON payload."})
            return

        query = str(data.get("query", "")).strip()
        items = data.get("items", [])

        if not query:
            respond(self, 400, {"error": "Missing 'query' in request body."})
            return

        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("models/gemini-1.5-flash")
            prompt = build_prompt(query, items if isinstance(items, list) else [])
            result = model.generate_content(prompt)
            text = (result.text or "").strip()
        except Exception as exc:  # pragma: no cover - handled for runtime resilience
            respond(self, 500, {"error": f"Model call failed: {exc}"})
            return

        respond(self, 200, {"analysis": text or "No content returned."})

    def do_GET(self):
        respond(self, 405, {"error": "Method not allowed. Use POST."})

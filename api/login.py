from http.server import BaseHTTPRequestHandler
import json
import os
import sqlite3
import hashlib

DB_PATH = os.environ.get("AUTH_DB_PATH", "/tmp/auth.db")
ADMIN_USER = os.environ.get("AUTH_ADMIN_USER", "admin")
ADMIN_PASS = os.environ.get("AUTH_ADMIN_PASS", "xtract1234")


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def ensure_admin(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        );
        """
    )
    conn.execute(
        """
        INSERT OR REPLACE INTO users (username, password_hash)
        VALUES (?, ?);
        """,
        (ADMIN_USER, hash_password(ADMIN_PASS)),
    )
    conn.commit()


def respond(handler: BaseHTTPRequestHandler, status: int, payload: dict) -> None:
    body = json.dumps(payload).encode()
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            conn = sqlite3.connect(DB_PATH)
            ensure_admin(conn)
        except Exception as exc:  # pragma: no cover - runtime safety
            respond(self, 500, {"error": f"Database error: {exc}"})
            return

        try:
            length = int(self.headers.get("content-length", "0"))
            body = self.rfile.read(length) if length > 0 else b"{}"
            data = json.loads(body.decode() or "{}")
        except json.JSONDecodeError:
            respond(self, 400, {"error": "Invalid JSON payload."})
            conn.close()
            return

        username = str(data.get("username", "")).strip()
        password = str(data.get("password", "")).strip()

        if not username or not password:
            respond(self, 400, {"error": "Username and password are required."})
            conn.close()
            return

        try:
            cur = conn.execute(
                "SELECT password_hash FROM users WHERE username = ? LIMIT 1;",
                (username,),
            )
            row = cur.fetchone()
        except Exception as exc:  # pragma: no cover - runtime safety
            respond(self, 500, {"error": f"Database read error: {exc}"})
            conn.close()
            return
        finally:
            conn.close()

        if not row:
            respond(self, 401, {"error": "Invalid credentials."})
            return

        stored_hash = row[0]
        if stored_hash != hash_password(password):
            respond(self, 401, {"error": "Invalid credentials."})
            return

        respond(self, 200, {"ok": True, "user": username})

    def do_GET(self):
        respond(self, 405, {"error": "Method not allowed. Use POST."})

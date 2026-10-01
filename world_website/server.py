#!/usr/bin/env python3
"""
BoxesBenBoxes World Feed API Server
Lightweight zero-dependency Python server for match logging and feed display.
"""

import http.server
import json
import os
import sys
from pathlib import Path

PORT = 8085
DATA_FILE = Path(__file__).parent / "matches.json"

# Seed data to demonstrate the live feed immediately
INITIAL_MATCHES = [
    {
        "matchId": "m_1727824800_ben_dad",
        "timestamp": "2026-10-01T20:30:00Z",
        "deviceId": "dev_ben_tablet",
        "handle": "Ben & Dad",
        "gridRows": 4,
        "gridCols": 4,
        "totalBoxes": 9,
        "players": [
            {"name": "Ben", "initial": "B", "color": "#1E88E5", "score": 5, "isComputer": False},
            {"name": "Dad", "initial": "D", "color": "#E53935", "score": 4, "isComputer": False}
        ],
        "winnerNames": ["Ben"],
        "isTie": False,
        "boardBoxes": "001101001"
    },
    {
        "matchId": "m_1727823900_minimizer",
        "timestamp": "2026-10-01T19:45:00Z",
        "deviceId": "dev_alex_phone",
        "handle": "Alex M.",
        "gridRows": 3,
        "gridCols": 3,
        "totalBoxes": 4,
        "players": [
            {"name": "Alex", "initial": "A", "color": "#43A047", "score": 1, "isComputer": False},
            {"name": "Minimizer Dude", "initial": "MD", "color": "#FB8C00", "score": 3, "isComputer": True}
        ],
        "winnerNames": ["Minimizer Dude"],
        "isTie": False,
        "boardBoxes": "1101"
    },
    {
        "matchId": "m_1727822500_family_tie",
        "timestamp": "2026-10-01T18:15:00Z",
        "deviceId": "dev_kitchen_ipad",
        "handle": "Sunday Placemat Duel",
        "gridRows": 4,
        "gridCols": 4,
        "totalBoxes": 9,
        "players": [
            {"name": "Mom", "initial": "M", "color": "#8E24AA", "score": 4, "isComputer": False},
            {"name": "Ben", "initial": "B", "color": "#1E88E5", "score": 4, "isComputer": False},
            {"name": "Sees Boxes Dude", "initial": "SB", "color": "#00ACC1", "score": 1, "isComputer": True}
        ],
        "winnerNames": ["Mom", "Ben"],
        "isTie": True,
        "boardBoxes": "010120101"
    }
]

def load_matches():
    if not DATA_FILE.exists():
        save_matches(INITIAL_MATCHES)
        return INITIAL_MATCHES
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return INITIAL_MATCHES

def save_matches(matches):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(matches, f, indent=2)

class WorldFeedHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for all local and mobile clients
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/matches":
            matches = load_matches()
            data = json.dumps(matches).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        # Serve static HTML/assets from this directory
        if self.path in ("/", "/index.html"):
            index_path = Path(__file__).parent / "index.html"
            if index_path.exists():
                with open(index_path, "rb") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(content)))
                self.end_headers()
                self.wfile.write(content)
                return

        super().do_GET()

    def do_POST(self):
        if self.path == "/api/matches":
            length = int(self.headers.get("Content-Length", 0))
            if length > 0:
                body = self.rfile.read(length)
                try:
                    payload = json.loads(body.decode("utf-8"))
                    matches = load_matches()
                    # Add new match to beginning of list (capped at 200)
                    matches.insert(0, payload)
                    matches = matches[:200]
                    save_matches(matches)

                    resp = json.dumps({"status": "success", "matchId": payload.get("matchId")}).encode("utf-8")
                    self.send_response(201)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("Content-Length", str(len(resp)))
                    self.end_headers()
                    self.wfile.write(resp)
                    return
                except Exception as e:
                    err_msg = json.dumps({"error": str(e)}).encode("utf-8")
                    self.send_response(400)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(err_msg)
                    return

        self.send_response(404)
        self.end_headers()

if __name__ == "__main__":
    os.chdir(Path(__file__).parent)
    server = http.server.HTTPServer(("0.0.0.0", PORT), WorldFeedHandler)
    print(f"🌍 BoxesBenBoxes World Feed Server running at http://localhost:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        server.server_close()

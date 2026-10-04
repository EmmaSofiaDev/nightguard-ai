#!/usr/bin/env python3
"""
NightGuard AI — 1-Command Local Runner
Launches FastAPI backend on http://127.0.0.1:8000 and serves dashboard UI.
"""

import sys
import os
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

import uvicorn

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(root_dir))

def main():
    print("=" * 65)
    print("  🌙 NightGuard AI — Zero-Leak Tabular Guardian (TabPFN)")
    print("  Built for Liam Vance | Hacktoberfest 2026 Weekend Challenge")
    print("=" * 65)
    print("\n[Engine] Starting local server...")
    print("[URL] Dashboard available at : http://127.0.0.1:8000")
    print("[API] Interactive API docs   : http://127.0.0.1:8000/docs")
    print("[Security] 100% Local Inference — Zero biometric data leaves device.\n")

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.app:app", host="0.0.0.0", port=port, reload=False)

if __name__ == "__main__":
    main()

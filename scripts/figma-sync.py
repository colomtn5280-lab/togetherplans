#!/usr/bin/env python3
"""
Figma → DateNight Design Sync
Reads a Figma file and extracts colors, typography, and component specs.
Usage: python3 figma-sync.py <file_id>
"""

import os
import sys
import json
import urllib.request

TOKEN = os.environ.get("FIGMA_API_TOKEN", "")
BASE  = "https://api.figma.com/v1"

def get(path):
    req = urllib.request.Request(f"{BASE}{path}", headers={"X-Figma-Token": TOKEN})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def hex_from_rgba(c):
    r = int(c.get("r", 0) * 255)
    g = int(c.get("g", 0) * 255)
    b = int(c.get("b", 0) * 255)
    return f"#{r:02x}{g:02x}{b:02x}"

def walk_nodes(node, results):
    """Recursively walk Figma nodes and extract design info."""
    ntype = node.get("type", "")
    name  = node.get("name", "")

    # Frames = screens
    if ntype == "FRAME" and node.get("children"):
        results["screens"].append({
            "name": name,
            "width": node.get("absoluteBoundingBox", {}).get("width"),
            "height": node.get("absoluteBoundingBox", {}).get("height"),
        })

    # Text nodes
    if ntype == "TEXT":
        style = node.get("style", {})
        results["text_styles"].append({
            "name": name,
            "fontSize": style.get("fontSize"),
            "fontWeight": style.get("fontWeight"),
            "fontFamily": style.get("fontFamily"),
        })

    # Fill colors
    for fill in node.get("fills", []):
        if fill.get("type") == "SOLID" and "color" in fill:
            hex_val = hex_from_rgba(fill["color"])
            if hex_val not in results["colors"]:
                results["colors"][hex_val] = name

    for child in node.get("children", []):
        walk_nodes(child, results)

def main():
    if not TOKEN:
        print("ERROR: FIGMA_API_TOKEN not set in environment")
        sys.exit(1)

    if len(sys.argv) < 2:
        print("Usage: python3 figma-sync.py <file_id>")
        sys.exit(1)

    file_id = sys.argv[1]
    print(f"Fetching Figma file: {file_id}")

    # Get file metadata
    meta = get(f"/files/{file_id}?depth=1")
    print(f"File: {meta.get('name')}")
    print(f"Last modified: {meta.get('lastModified', '')[:10]}")

    # Get full file
    data = get(f"/files/{file_id}")
    doc  = data.get("document", {})

    results = {"screens": [], "text_styles": [], "colors": {}}
    for page in doc.get("children", []):
        print(f"\nPage: {page.get('name')}")
        for node in page.get("children", []):
            walk_nodes(node, results)

    # Get styles
    styles = data.get("styles", {})
    print(f"\n=== STYLES ({len(styles)}) ===")
    for sid, s in list(styles.items())[:20]:
        print(f"  {s.get('styleType')}: {s.get('name')}")

    print(f"\n=== SCREENS ({len(results['screens'])}) ===")
    for s in results["screens"]:
        print(f"  {s['name']} ({s['width']}x{s['height']})")

    print(f"\n=== COLORS ({len(results['colors'])}) ===")
    for hex_val, name in list(results["colors"].items())[:30]:
        print(f"  {hex_val}  ({name})")

    print(f"\n=== TEXT STYLES ({len(results['text_styles'])}) ===")
    seen = set()
    for t in results["text_styles"]:
        key = f"{t['fontSize']}_{t['fontWeight']}"
        if key not in seen and t["fontSize"]:
            seen.add(key)
            print(f"  {t['fontSize']}px / weight {t['fontWeight']} / {t['fontFamily']}")

    # Save output
    out_path = f"/root/DateNight/docs/figma-sync-output.json"
    with open(out_path, "w") as f:
        json.dump({"file": file_id, "name": meta.get("name"), "results": results, "styles": styles}, f, indent=2)
    print(f"\nFull output saved to: {out_path}")

if __name__ == "__main__":
    main()

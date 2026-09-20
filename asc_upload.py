#!/usr/bin/env python3
"""Upload screenshots to App Store Connect and submit for review."""

import os, sys, time, hashlib, base64, json, math
import httpx
import jwt

# ── ASC credentials ────────────────────────────────────────────
KEY_ID      = "8382WH4VNL"
ISSUER_ID   = "76bd5edd-3c20-4fc2-bd02-65daf9a30515"
KEY_PATH    = "/root/.hermes/secrets/asc_key_8382WH4VNL.p8"
APP_ID      = "6806890578"
VERSION_ID  = "75aac8f9-a498-4b6a-ba6c-915e9c4115cf"
VER_LOC_ID  = "01cab1ca-411d-41c1-8479-a624bc9d04c9"
OUT_DIR     = "/root/DateNight/screenshots"
BASE        = "https://api.appstoreconnect.apple.com"

SCREENSHOTS = sorted([
    os.path.join(OUT_DIR, f) for f in os.listdir(OUT_DIR) if f.endswith(".png")
])

# ── JWT token (10-min expiry) ──────────────────────────────────
def make_token():
    with open(KEY_PATH, "r") as f:
        key = f.read()
    now = int(time.time())
    payload = {
        "iss": ISSUER_ID,
        "iat": now,
        "exp": now + 600,
        "aud": "appstoreconnect-v1",
    }
    return jwt.encode(payload, key, algorithm="ES256", headers={"kid": KEY_ID})

def headers():
    return {
        "Authorization": f"Bearer {make_token()}",
        "Content-Type": "application/json",
    }

client = httpx.Client(timeout=120)

def api_get(path):
    r = client.get(f"{BASE}{path}", headers=headers())
    return r

def api_post(path, body):
    r = client.post(f"{BASE}{path}", json=body, headers=headers())
    return r

def api_patch(path, body):
    r = client.patch(f"{BASE}{path}", json=body, headers=headers())
    return r

# ── Step 1: Find or create screenshot set ────────────────────
print("=== Step 1: Find or create APP_IPHONE_69 screenshot set ===")

# Check existing sets for this localization
r = api_get(f"/v1/appStoreVersionLocalizations/{VER_LOC_ID}/appScreenshotSets")
print(f"GET screenshot sets: {r.status_code}")
existing = r.json()

set_id = None
if r.status_code == 200:
    for s in existing.get("data", []):
        if s.get("attributes", {}).get("screenshotDisplayType") == "APP_IPHONE_69":
            set_id = s["id"]
            print(f"Found existing set: {set_id}")
            break

if not set_id:
    body = {
        "data": {
            "type": "appScreenshotSets",
            "attributes": {
                "screenshotDisplayType": "APP_IPHONE_67"
            },
            "relationships": {
                "appStoreVersionLocalization": {
                    "data": {"type": "appStoreVersionLocalizations", "id": VER_LOC_ID}
                }
            }
        }
    }
    r2 = api_post("/v1/appScreenshotSets", body)
    print(f"POST screenshot set: {r2.status_code}")
    if r2.status_code not in (200, 201):
        print("ERROR:", r2.text[:800])
        sys.exit(1)
    set_id = r2.json()["data"]["id"]
    print(f"Created set: {set_id}")

# ── Step 2-4: Upload each screenshot ──────────────────────────
print(f"\n=== Uploading {len(SCREENSHOTS)} screenshots ===")
upload_results = []

for idx, filepath in enumerate(SCREENSHOTS):
    filename = os.path.basename(filepath)
    with open(filepath, "rb") as f:
        data = f.read()
    file_size = len(data)
    checksum = hashlib.md5(data).hexdigest()
    
    print(f"\n[{idx+1}/{len(SCREENSHOTS)}] {filename} ({file_size//1024} KB)")
    
    # Reserve upload slot
    reserve_body = {
        "data": {
            "type": "appScreenshots",
            "attributes": {
                "fileName": filename,
                "fileSize": file_size
            },
            "relationships": {
                "appScreenshotSet": {
                    "data": {"type": "appScreenshotSets", "id": set_id}
                }
            }
        }
    }
    r = api_post("/v1/appScreenshots", reserve_body)
    print(f"  Reserve: {r.status_code}")
    if r.status_code not in (200, 201):
        print(f"  ERROR: {r.text[:400]}")
        upload_results.append({"file": filename, "status": "RESERVE_FAILED", "detail": r.text[:200]})
        continue
    
    res_data = r.json()["data"]
    screenshot_id = res_data["id"]
    upload_ops = res_data["attributes"].get("uploadOperations", [])
    print(f"  Screenshot ID: {screenshot_id}, upload ops: {len(upload_ops)}")
    
    # Upload the file via PUT operations
    upload_ok = True
    for op in upload_ops:
        method = op["method"]
        url = op["url"]
        offset = op["offset"]
        length = op["length"]
        op_headers = {h["name"]: h["value"] for h in op.get("requestHeaders", [])}
        
        chunk = data[offset:offset + length]
        put_r = client.request(method, url, content=chunk, headers=op_headers, timeout=120)
        print(f"  PUT chunk offset={offset} len={length}: {put_r.status_code}")
        if put_r.status_code not in (200, 201, 204):
            print(f"  PUT ERROR: {put_r.text[:300]}")
            upload_ok = False
    
    if not upload_ok:
        upload_results.append({"file": filename, "status": "UPLOAD_FAILED", "id": screenshot_id})
        continue
    
    # Commit the upload
    commit_body = {
        "data": {
            "type": "appScreenshots",
            "id": screenshot_id,
            "attributes": {
                "uploaded": True,
                "sourceFileChecksum": checksum
            }
        }
    }
    r = api_patch(f"/v1/appScreenshots/{screenshot_id}", commit_body)
    print(f"  Commit: {r.status_code}")
    if r.status_code not in (200, 201):
        print(f"  COMMIT ERROR: {r.text[:300]}")
        upload_results.append({"file": filename, "status": "COMMIT_FAILED", "id": screenshot_id})
        continue
    
    upload_results.append({"file": filename, "status": "OK", "id": screenshot_id})
    print(f"  ✓ Uploaded and committed")

print("\n=== Upload Summary ===")
for ur in upload_results:
    print(f"  {ur['file']}: {ur['status']}")

all_ok = all(u["status"] == "OK" for u in upload_results)
if not all_ok:
    print("\nSome uploads failed — not submitting for review")
    sys.exit(1)

# ── Step 5: Submit for review ──────────────────────────────────
print("\n=== Step 5: Submit for Review ===")
# Wait a moment for ASC to process
time.sleep(5)

submit_body = {
    "data": {
        "type": "appStoreVersionSubmissions",
        "relationships": {
            "appStoreVersion": {
                "data": {"type": "appStoreVersions", "id": VERSION_ID}
            }
        }
    }
}
r = api_post("/v1/appStoreVersionSubmissions", submit_body)
print(f"Submit response: {r.status_code}")
print(r.text[:1200])

if r.status_code in (200, 201):
    print("\n✅ SUCCESS: App submitted for review!")
else:
    print(f"\n⚠️  Submission returned {r.status_code}")
    # Parse error details
    try:
        err = r.json()
        for e in err.get("errors", []):
            print(f"  [{e.get('code','?')}] {e.get('title','')}: {e.get('detail','')}")
    except:
        pass

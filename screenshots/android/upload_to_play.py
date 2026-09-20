#!/usr/bin/env python3
"""Upload Android screenshots and set store listing via Google Play Android Publisher API."""

import json
import os
import sys

# Install required packages
import subprocess
subprocess.run([sys.executable, "-m", "pip", "install", 
                "google-auth", "google-api-python-client", "--break-system-packages", "-q"],
               check=True)

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# Config
SERVICE_ACCOUNT_KEY = "/root/.hermes/secrets/play-key.json"
PACKAGE_NAME = "togetherplans.app"
LANGUAGE = "en-US"
SCREENSHOTS_DIR = "/root/DateNight/screenshots/android"

SCREENSHOTS = [
    "01-groups.png",
    "02-voting.png",
    "03-match.png",
    "04-discover.png",
    "05-after-dark.png",
]

STORE_LISTING = {
    "title": "TogetherPlans",
    "shortDescription": "Plan dates together. Vote, decide, and lock in plans with your crew.",
    "fullDescription": (
        "TogetherPlans makes planning fun again. Create a group with your partner or friends, "
        "add activity options, and vote together. When everyone agrees — it's a match! "
        "The app locks in the plan and sends a calendar invite.\n\n"
        "Features:\n"
        "• Group proposals — add options, vote together\n"
        "• Consensus detection — auto-locks when everyone agrees\n"
        "• After Dark mode — late-night suggestions by mood\n"
        "• Share Cards — share your plans with style\n"
        "• Smart suggestions — nearby activities powered by location\n"
        "• Calendar integration — auto-add matched plans\n"
        "• Email & SMS invites — bring your people in\n\n"
        "Perfect for couples, friend groups, and anyone who wants to stop saying "
        '"I don\'t know, what do you want to do?"\n\n'
        "TogetherPlans — Plan dates. Together."
    ),
}

def main():
    print("=== Google Play Store Listing Upload ===\n")
    
    # Authenticate
    print("1. Authenticating with service account...")
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_KEY,
        scopes=["https://www.googleapis.com/auth/androidpublisher"],
    )
    
    service = build("androidpublisher", "v3", credentials=credentials)
    edits = service.edits()
    
    # Create edit
    print("2. Creating edit...")
    edit_response = edits.insert(packageName=PACKAGE_NAME, body={}).execute()
    edit_id = edit_response["id"]
    print(f"   Edit ID: {edit_id}")
    
    # Delete existing screenshots first (clean slate)
    print("\n3. Clearing existing phone screenshots...")
    try:
        edits.images().deleteall(
            packageName=PACKAGE_NAME,
            editId=edit_id,
            language=LANGUAGE,
            imageType="phoneScreenshots",
        ).execute()
        print("   Existing screenshots cleared.")
    except Exception as e:
        print(f"   No existing screenshots or error clearing: {e}")
    
    # Upload screenshots
    print("\n4. Uploading screenshots...")
    uploaded_ids = []
    for i, filename in enumerate(SCREENSHOTS, 1):
        filepath = os.path.join(SCREENSHOTS_DIR, filename)
        print(f"   Uploading {filename}...", end=" ", flush=True)
        
        media = MediaFileUpload(filepath, mimetype="image/png", resumable=False)
        response = edits.images().upload(
            packageName=PACKAGE_NAME,
            editId=edit_id,
            language=LANGUAGE,
            imageType="phoneScreenshots",
            media_body=media,
        ).execute()
        
        img_id = response["image"]["id"]
        uploaded_ids.append(img_id)
        print(f"✓ ID: {img_id}")
    
    # Set store listing
    print("\n5. Setting store listing...")
    listing_response = edits.listings().update(
        packageName=PACKAGE_NAME,
        editId=edit_id,
        language=LANGUAGE,
        body=STORE_LISTING,
    ).execute()
    print(f"   Title: {listing_response.get('title')}")
    print(f"   Short desc: {listing_response.get('shortDescription')[:60]}...")
    print(f"   Language: {listing_response.get('language')}")
    
    # Commit the edit
    print("\n6. Committing edit...")
    commit_response = edits.commit(
        packageName=PACKAGE_NAME,
        editId=edit_id,
    ).execute()
    print(f"   Committed edit ID: {commit_response.get('id')}")
    
    print("\n=== SUCCESS ===")
    print(f"Uploaded {len(uploaded_ids)} screenshots")
    print(f"Screenshot IDs: {json.dumps(uploaded_ids, indent=2)}")
    print(f"Store listing set for language: {LANGUAGE}")
    print("Edit committed. Screenshots and listing are now live in Play Console.")
    
    return {
        "edit_id": edit_id,
        "screenshot_ids": uploaded_ids,
        "listing": listing_response,
        "commit": commit_response,
    }


if __name__ == "__main__":
    result = main()
    print("\nFinal result:", json.dumps(result, indent=2, default=str))

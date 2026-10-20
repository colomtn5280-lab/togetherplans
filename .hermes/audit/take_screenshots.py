#!/usr/bin/env python3
"""Take screenshots of TogetherPlans web app for visual audit."""

import asyncio
import os
from playwright.async_api import async_playwright

SCREENSHOT_DIR = '/root/DateNight/.hermes/audit/screenshots/web'
BASE_URL = 'https://togetherplans.app'
EMAIL = 'jarvis.agent1@togetherplans.app'
PASSWORD = 'Agent1Pass!'

os.makedirs(SCREENSHOT_DIR, exist_ok=True)

async def take_screenshots():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # --- Desktop context (1440x900) ---
        ctx_desktop = await browser.new_context(
            viewport={'width': 1440, 'height': 900},
            user_agent='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
        )
        page = await ctx_desktop.new_page()
        
        # 1. Landing page
        print("1. Landing page...")
        await page.goto(f'{BASE_URL}/', wait_until='networkidle')
        await page.screenshot(path=f'{SCREENSHOT_DIR}/01_landing.png', full_page=True)
        print("   Done.")
        
        # 2. Login page
        print("2. Login page...")
        await page.goto(f'{BASE_URL}/login', wait_until='networkidle')
        await page.screenshot(path=f'{SCREENSHOT_DIR}/02_login.png', full_page=True)
        print("   Done.")
        
        # 3. Signup page
        print("3. Signup page...")
        await page.goto(f'{BASE_URL}/signup', wait_until='networkidle')
        await page.screenshot(path=f'{SCREENSHOT_DIR}/03_signup.png', full_page=True)
        print("   Done.")
        
        # Login
        print("Logging in...")
        await page.goto(f'{BASE_URL}/login', wait_until='networkidle')
        await page.fill('input[type="email"], input[name="email"], #email', EMAIL)
        await page.fill('input[type="password"], input[name="password"], #password', PASSWORD)
        await page.click('button[type="submit"], .dn-btn--primary, button:has-text("Log in"), button:has-text("Sign in")')
        await page.wait_for_load_state('networkidle')
        await asyncio.sleep(2)
        print(f"   Current URL: {page.url}")
        
        # 4. Dashboard
        print("4. Dashboard...")
        await page.goto(f'{BASE_URL}/dashboard', wait_until='networkidle')
        await asyncio.sleep(2)
        await page.screenshot(path=f'{SCREENSHOT_DIR}/04_dashboard.png', full_page=True)
        print("   Done.")
        
        # 5. Groups
        print("5. Groups...")
        await page.goto(f'{BASE_URL}/groups', wait_until='networkidle')
        await asyncio.sleep(2)
        await page.screenshot(path=f'{SCREENSHOT_DIR}/05_groups.png', full_page=True)
        print("   Done.")
        
        # 6. Suggestions
        print("6. Suggestions...")
        await page.goto(f'{BASE_URL}/suggestions', wait_until='networkidle')
        await asyncio.sleep(2)
        await page.screenshot(path=f'{SCREENSHOT_DIR}/06_suggestions.png', full_page=True)
        print("   Done.")
        
        # 7. After Dark
        print("7. After Dark...")
        await page.goto(f'{BASE_URL}/after-dark', wait_until='networkidle')
        await asyncio.sleep(2)
        await page.screenshot(path=f'{SCREENSHOT_DIR}/07_after_dark.png', full_page=True)
        print("   Done.")
        
        # 8. Proposal - DECIDED
        print("8. Proposal (DECIDED)...")
        await page.goto(f'{BASE_URL}/proposals/38635763-6628-46c1-bbeb-cd27fd6045c7', wait_until='networkidle')
        await asyncio.sleep(2)
        await page.screenshot(path=f'{SCREENSHOT_DIR}/08_proposal_decided.png', full_page=True)
        print("   Done.")
        
        # 9. Invite card
        print("9. Invite card...")
        await page.goto(f'{BASE_URL}/proposals/38635763-6628-46c1-bbeb-cd27fd6045c7/invite-card', wait_until='networkidle')
        await asyncio.sleep(2)
        await page.screenshot(path=f'{SCREENSHOT_DIR}/09_invite_card.png', full_page=True)
        print("   Done.")
        
        # 10. Settings
        print("10. Settings...")
        await page.goto(f'{BASE_URL}/settings', wait_until='networkidle')
        await asyncio.sleep(2)
        await page.screenshot(path=f'{SCREENSHOT_DIR}/10_settings.png', full_page=True)
        print("   Done.")
        
        # 11. Notifications
        print("11. Notifications...")
        await page.goto(f'{BASE_URL}/notifications', wait_until='networkidle')
        await asyncio.sleep(2)
        await page.screenshot(path=f'{SCREENSHOT_DIR}/11_notifications.png', full_page=True)
        print("   Done.")
        
        await ctx_desktop.close()
        
        # --- Mobile context (390px) ---
        print("\nMobile screenshots (390px)...")
        ctx_mobile = await browser.new_context(
            viewport={'width': 390, 'height': 844},
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
        )
        page_m = await ctx_mobile.new_page()
        
        # Login on mobile
        await page_m.goto(f'{BASE_URL}/login', wait_until='networkidle')
        try:
            await page_m.fill('input[type="email"]', EMAIL)
            await page_m.fill('input[type="password"]', PASSWORD)
            await page_m.click('button[type="submit"]')
            await page_m.wait_for_load_state('networkidle')
            await asyncio.sleep(2)
        except Exception as e:
            print(f"   Mobile login error: {e}")
        
        mobile_screens = [
            ('01_mobile_landing', f'{BASE_URL}/'),
            ('02_mobile_login', f'{BASE_URL}/login'),
            ('04_mobile_dashboard', f'{BASE_URL}/dashboard'),
            ('06_mobile_suggestions', f'{BASE_URL}/suggestions'),
            ('08_mobile_proposal', f'{BASE_URL}/proposals/38635763-6628-46c1-bbeb-cd27fd6045c7'),
        ]
        
        for filename, url in mobile_screens:
            print(f"   Mobile: {filename}...")
            try:
                await page_m.goto(url, wait_until='networkidle')
                await asyncio.sleep(2)
                await page_m.screenshot(path=f'{SCREENSHOT_DIR}/{filename}.png', full_page=True)
                print(f"   Done.")
            except Exception as e:
                print(f"   Error: {e}")
        
        await ctx_mobile.close()
        await browser.close()
        
        print("\nAll screenshots saved to:", SCREENSHOT_DIR)
        print("Files:", os.listdir(SCREENSHOT_DIR))

asyncio.run(take_screenshots())

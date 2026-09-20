#!/usr/bin/env python3
"""Generate 5 Android Play Store screenshots at 1080x1920px for TogetherPlans."""

from PIL import Image, ImageDraw, ImageFont
import os
import math
import random

# Design tokens
TEAL = (14, 140, 140)
LIME = (124, 181, 24)
BG = (244, 246, 248)
SURFACE = (255, 255, 255)
INK = (16, 24, 32)
INK2 = (93, 107, 118)
PRIMARY_SOFT = (217, 241, 240)
LIME_SOFT = (234, 246, 211)
DARK_BG = (10, 16, 24)
DARK_SURFACE = (26, 37, 48)

W, H = 1080, 1920
OUT_DIR = "/root/DateNight/screenshots/android"


def get_font(size, bold=False):
    """Try to load a font, fall back to default."""
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.otf" if bold else "/usr/share/fonts/truetype/freefont/FreeSans.otf",
    ]
    for path in font_paths:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except:
                pass
    return ImageFont.load_default()


def rounded_rect(draw, xy, radius, fill, outline=None, outline_width=1):
    """Draw a rounded rectangle."""
    x1, y1, x2, y2 = xy
    r = radius
    # Fill
    draw.rectangle([x1 + r, y1, x2 - r, y2], fill=fill)
    draw.rectangle([x1, y1 + r, x2, y2 - r], fill=fill)
    draw.ellipse([x1, y1, x1 + 2*r, y1 + 2*r], fill=fill)
    draw.ellipse([x2 - 2*r, y1, x2, y1 + 2*r], fill=fill)
    draw.ellipse([x1, y2 - 2*r, x1 + 2*r, y2], fill=fill)
    draw.ellipse([x2 - 2*r, y2 - 2*r, x2, y2], fill=fill)
    if outline:
        draw.arc([x1, y1, x1 + 2*r, y1 + 2*r], 180, 270, fill=outline, width=outline_width)
        draw.arc([x2 - 2*r, y1, x2, y1 + 2*r], 270, 360, fill=outline, width=outline_width)
        draw.arc([x1, y2 - 2*r, x1 + 2*r, y2], 90, 180, fill=outline, width=outline_width)
        draw.arc([x2 - 2*r, y2 - 2*r, x2, y2], 0, 90, fill=outline, width=outline_width)
        draw.line([x1 + r, y1, x2 - r, y1], fill=outline, width=outline_width)
        draw.line([x1 + r, y2, x2 - r, y2], fill=outline, width=outline_width)
        draw.line([x1, y1 + r, x1, y2 - r], fill=outline, width=outline_width)
        draw.line([x2, y1 + r, x2, y2 - r], fill=outline, width=outline_width)


def draw_shadow_card(draw, xy, radius=16):
    """Draw card shadow then card."""
    x1, y1, x2, y2 = xy
    # Shadow (offset 4px down, gray)
    shadow_color = (0, 0, 0, 30)
    for i in range(8):
        alpha = 5 - i if i < 5 else 0
        shadow = (200, 205, 210)
        rounded_rect(draw, [x1+i, y1+i+4, x2+i, y2+i+4], radius, shadow)
    rounded_rect(draw, xy, radius, SURFACE)


def draw_chip(draw, x, y, text, bg=TEAL, fg=SURFACE, font_size=24, pad_x=20, pad_h=16):
    font = get_font(font_size)
    bbox = font.getbbox(text)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    chip_w = tw + pad_x * 2
    chip_h = th + pad_h
    rounded_rect(draw, [x, y, x + chip_w, y + chip_h], chip_h // 2, bg)
    draw.text((x + pad_x, y + pad_h // 2 - th // 2), text, fill=fg, font=font)
    return chip_w, chip_h


def draw_avatar(draw, cx, cy, r, color, letter=""):
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)
    if letter:
        font = get_font(r, bold=True)
        draw.text((cx, cy), letter, fill=SURFACE, font=font, anchor="mm")


def draw_bottom_nav(draw, active_idx=0):
    """Draw bottom nav bar."""
    nav_y = H - 120
    draw.rectangle([0, nav_y, W, H], fill=SURFACE)
    draw.line([0, nav_y, W, nav_y], fill=(220, 225, 230), width=1)
    
    tabs = ["Plans", "Discover", "Profile"]
    icons = ["▣", "◎", "◉"]
    tab_w = W // 3
    for i, (tab, icon) in enumerate(zip(tabs, icons)):
        cx = i * tab_w + tab_w // 2
        color = TEAL if i == active_idx else INK2
        f_icon = get_font(36)
        f_label = get_font(24)
        draw.text((cx, nav_y + 30), icon, fill=color, font=f_icon, anchor="mm")
        draw.text((cx, nav_y + 78), tab, fill=color, font=f_label, anchor="mm")


def draw_status_bar(draw, img, dark=False):
    bar_color = TEAL if not dark else DARK_BG
    draw.rectangle([0, 0, W, 60], fill=bar_color)
    font = get_font(22)
    draw.text((40, 18), "9:41", fill=SURFACE, font=font)
    draw.text((W - 40, 18), "●●● ▌", fill=SURFACE, font=font, anchor="ra")


###############################################################################
# Screenshot 1: Groups/Plans screen
###############################################################################
def gen_01_groups():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    
    # Status bar
    draw_status_bar(draw, img)
    
    # Nav bar
    draw.rectangle([0, 60, W, 150], fill=SURFACE)
    draw.line([0, 150, W, 150], fill=(220, 225, 230), width=1)
    f_logo = get_font(42, bold=True)
    draw.text((60, 95), "TogetherPlans", fill=TEAL, font=f_logo, anchor="lm")
    f_bell = get_font(42)
    draw.text((W - 60, 95), "🔔", fill=INK2, font=f_bell, anchor="rm")
    
    # Page title
    f_title = get_font(52, bold=True)
    draw.text((60, 210), "Your Plans", fill=INK, font=f_title)
    
    # Card 1: Date Night
    c1_y = 300
    draw_shadow_card(draw, [60, c1_y, W - 60, c1_y + 200], radius=16)
    f_card_title = get_font(38, bold=True)
    draw.text((100, c1_y + 30), "Date Night 🌙", fill=INK, font=f_card_title)
    draw_chip(draw, 100, c1_y + 85, "COUPLE", font_size=22)
    f_card_sub = get_font(28)
    draw.text((100, c1_y + 145), "1 active proposal", fill=INK2, font=f_card_sub)
    # Avatars
    draw_avatar(draw, W - 180, c1_y + 100, 32, TEAL, "A")
    draw_avatar(draw, W - 130, c1_y + 100, 32, LIME, "B")
    draw.ellipse([W - 180 - 32, c1_y + 68, W - 180 + 32, c1_y + 132], outline=SURFACE, width=3)
    draw.ellipse([W - 130 - 32, c1_y + 68, W - 130 + 32, c1_y + 132], outline=SURFACE, width=3)
    
    # Card 2: Friend Squad
    c2_y = 540
    draw_shadow_card(draw, [60, c2_y, W - 60, c2_y + 210], radius=16)
    draw.text((100, c2_y + 30), "Friend Squad 👥", fill=INK, font=f_card_title)
    draw_chip(draw, 100, c2_y + 85, "FRIENDS", font_size=22)
    draw.text((100, c2_y + 148), "2 active proposals", fill=INK2, font=f_card_sub)
    # 3 avatars
    draw_avatar(draw, W - 230, c2_y + 105, 30, TEAL, "A")
    draw_avatar(draw, W - 175, c2_y + 105, 30, LIME, "B")
    draw_avatar(draw, W - 120, c2_y + 105, 30, (180, 100, 200), "C")
    
    # Bottom nav
    draw_bottom_nav(draw, active_idx=0)
    
    # FAB
    fab_cx, fab_cy = W - 100, H - 200
    draw.ellipse([fab_cx - 50, fab_cy - 50, fab_cx + 50, fab_cy + 50], fill=TEAL)
    f_plus = get_font(56, bold=True)
    draw.text((fab_cx, fab_cy), "+", fill=SURFACE, font=f_plus, anchor="mm")
    
    img.save(os.path.join(OUT_DIR, "01-groups.png"))
    print("Saved 01-groups.png")


###############################################################################
# Screenshot 2: Voting screen
###############################################################################
def gen_02_voting():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    
    draw_status_bar(draw, img)
    
    # Nav bar with back arrow
    draw.rectangle([0, 60, W, 150], fill=SURFACE)
    draw.line([0, 150, W, 150], fill=(220, 225, 230), width=1)
    f_back = get_font(42)
    draw.text((50, 95), "←", fill=INK, font=f_back, anchor="lm")
    f_nav_title = get_font(38, bold=True)
    draw.text((W // 2, 95), "Friday Night Out", fill=INK, font=f_nav_title, anchor="mm")
    
    # OPEN chip
    chip_x = W // 2 - 60
    draw_chip(draw, chip_x, 170, "  OPEN  ", font_size=24)
    
    # Subtitle
    f_sub = get_font(32)
    draw.text((W // 2, 260), "Vote for your favorite option", fill=INK2, font=f_sub, anchor="mm")
    
    # Option cards
    options = [
        ("Nobu Restaurant", "🍽 Dining", True, "📍 180 Post St, SF"),
        ("SF Jazz Center", "🎵 Live Music", False, "📍 201 Franklin St, SF"),
        ("Punch Line Comedy", "😂 Comedy", False, "📍 444 Battery St, SF"),
    ]
    
    for i, (name, category, voted, location) in enumerate(options):
        cy = 310 + i * 240
        draw_shadow_card(draw, [60, cy, W - 60, cy + 210], radius=16)
        f_opt = get_font(36, bold=True)
        f_cat = get_font(28)
        f_loc = get_font(26)
        draw.text((110, cy + 30), name, fill=INK, font=f_opt)
        draw.text((110, cy + 80), category, fill=INK2, font=f_cat)
        draw.text((110, cy + 155), location, fill=INK2, font=f_loc)
        # Heart
        heart_x, heart_y = W - 120, cy + 100
        if voted:
            draw.text((heart_x, heart_y), "❤️", fill=LIME, font=get_font(48), anchor="mm")
        else:
            draw.text((heart_x, heart_y), "🤍", fill=INK2, font=get_font(48), anchor="mm")
    
    # Progress bar
    bar_y = 1070
    f_prog = get_font(28)
    draw.text((60, bar_y), "1 of 2 voted", fill=INK2, font=f_prog)
    draw.rectangle([60, bar_y + 40, W - 60, bar_y + 70], fill=(220, 225, 230))
    rounded_rect(draw, [60, bar_y + 40, 60 + (W - 120) // 2, bar_y + 70], 15, LIME)
    
    # Waiting message
    f_wait = get_font(32)
    draw.text((W // 2, bar_y + 130), "Waiting for your partner...", fill=INK2, font=f_wait, anchor="mm")
    
    draw_bottom_nav(draw, active_idx=0)
    
    img.save(os.path.join(OUT_DIR, "02-voting.png"))
    print("Saved 02-voting.png")


###############################################################################
# Screenshot 3: Match/Decided celebration screen
###############################################################################
def gen_03_match():
    img = Image.new("RGB", (W, H), DARK_BG)
    draw = ImageDraw.Draw(img)
    
    # Teal glow effect (radial gradient approximation)
    for r in range(400, 0, -20):
        alpha = int(30 * (1 - r / 400))
        glow = (14 + alpha, 140, 140)
        cx, cy = W // 2, H // 2
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=None, outline=glow, width=2)
    
    # Confetti dots
    random.seed(42)
    confetti_colors = [TEAL, LIME, SURFACE, PRIMARY_SOFT, LIME_SOFT]
    for _ in range(80):
        cx = random.randint(0, W)
        cy = random.randint(0, H)
        r = random.randint(6, 18)
        color = random.choice(confetti_colors)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)
    
    # Status bar (dark)
    draw_status_bar(draw, img, dark=True)
    
    # 🎉 emoji
    f_emoji_large = get_font(120)
    draw.text((W // 2, 280), "🎉", font=f_emoji_large, anchor="mm")
    
    # "It's a Match!"
    f_match = get_font(72, bold=True)
    draw.text((W // 2, 430), "It's a Match!", fill=SURFACE, font=f_match, anchor="mm")
    
    # "You both chose:"
    f_sub = get_font(36)
    draw.text((W // 2, 520), "You both chose:", fill=INK2, font=f_sub, anchor="mm")
    
    # White card
    card_y = 570
    draw_shadow_card(draw, [80, card_y, W - 80, card_y + 320], radius=24)
    f_venue = get_font(48, bold=True)
    draw.text((W // 2, card_y + 70), "SF Jazz Center", fill=TEAL, font=f_venue, anchor="mm")
    f_detail = get_font(32)
    draw.text((W // 2, card_y + 150), "📅 Friday, Sep 25 · 8:00 PM", fill=INK, font=f_detail, anchor="mm")
    draw.text((W // 2, card_y + 220), "📍 201 Franklin St, San Francisco", fill=INK2, font=f_detail, anchor="mm")
    
    # Lime button: Add to Calendar
    btn_y = 950
    rounded_rect(draw, [80, btn_y, W - 80, btn_y + 90], 45, LIME)
    f_btn = get_font(36, bold=True)
    draw.text((W // 2, btn_y + 45), "Add to Calendar", fill=SURFACE, font=f_btn, anchor="mm")
    
    # Outline button: Share
    btn2_y = 1070
    rounded_rect(draw, [80, btn2_y, W - 80, btn2_y + 90], 45, None)
    draw.rectangle([80, btn2_y, W - 80, btn2_y + 90], outline=SURFACE, width=2)
    draw.text((W // 2, btn2_y + 45), "Share the Plan 📤", fill=SURFACE, font=f_btn, anchor="mm")
    
    img.save(os.path.join(OUT_DIR, "03-match.png"))
    print("Saved 03-match.png")


###############################################################################
# Screenshot 4: Discover screen
###############################################################################
def gen_04_discover():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    
    draw_status_bar(draw, img)
    
    # Nav bar
    draw.rectangle([0, 60, W, 150], fill=SURFACE)
    draw.line([0, 150, W, 150], fill=(220, 225, 230), width=1)
    f_nav = get_font(38, bold=True)
    draw.text((60, 95), "Discover", fill=INK, font=f_nav, anchor="lm")
    
    # Subtitle
    f_sub = get_font(32)
    draw.text((60, 180), "Find your next plan", fill=INK2, font=f_sub)
    
    # Filter chips
    filters = [("All", True), ("Dining", False), ("Live Music", False), ("Comedy", False), ("Outdoors", False)]
    chip_x = 60
    chip_y = 240
    for label, active in filters:
        bg = TEAL if active else SURFACE
        fg = SURFACE if active else INK2
        f_chip = get_font(26)
        bbox = f_chip.getbbox(label)
        tw = bbox[2] - bbox[0]
        chip_w = tw + 36
        chip_h = 52
        rounded_rect(draw, [chip_x, chip_y, chip_x + chip_w, chip_y + chip_h], 26, bg)
        if not active:
            draw.rectangle([chip_x, chip_y, chip_x + chip_w, chip_y + chip_h], outline=(200, 210, 215), width=1)
        draw.text((chip_x + 18, chip_y + chip_h // 2), label, fill=fg, font=f_chip, anchor="lm")
        chip_x += chip_w + 16
    
    # 3 suggestion cards
    cards_data = [
        ("Nobu Restaurant", "$$$  •  Dining", "⭐ 4.8  •  📍 0.3 mi", TEAL),
        ("SF Jazz Center", "$$  •  Live Music", "⭐ 4.9  •  📍 1.2 mi", LIME),
        ("Punch Line Comedy Club", "$$  •  Comedy", "⭐ 4.7  •  📍 0.8 mi", PRIMARY_SOFT),
    ]
    
    for i, (name, meta, rating, img_color) in enumerate(cards_data):
        cy = 340 + i * 360
        draw_shadow_card(draw, [60, cy, W - 60, cy + 330], radius=16)
        
        # Image placeholder
        rounded_rect(draw, [60, cy, W - 60, cy + 140], radius=16, fill=img_color)
        # Overlay icon hint
        f_icon = get_font(48)
        icons = ["🍽", "🎵", "😂"]
        draw.text((W // 2, cy + 70), icons[i], font=f_icon, anchor="mm")
        
        # Card content
        f_name = get_font(36, bold=True)
        f_meta = get_font(28)
        f_rating = get_font(26)
        draw.text((100, cy + 155), name, fill=INK, font=f_name)
        draw.text((100, cy + 202), meta, fill=INK2, font=f_meta)
        draw.text((100, cy + 240), rating, fill=INK2, font=f_rating)
        
        # Add to Plan button
        btn_x = W - 300
        rounded_rect(draw, [btn_x, cy + 270, W - 80, cy + 310], 20, TEAL)
        f_btn = get_font(24, bold=True)
        draw.text(((btn_x + W - 80) // 2, cy + 290), "+ Add to Plan", fill=SURFACE, font=f_btn, anchor="mm")
    
    draw_bottom_nav(draw, active_idx=1)
    
    img.save(os.path.join(OUT_DIR, "04-discover.png"))
    print("Saved 04-discover.png")


###############################################################################
# Screenshot 5: After Dark screen
###############################################################################
def gen_05_after_dark():
    img = Image.new("RGB", (W, H), DARK_BG)
    draw = ImageDraw.Draw(img)
    
    draw_status_bar(draw, img, dark=True)
    
    # Nav bar (dark)
    draw.rectangle([0, 60, W, 150], fill=DARK_SURFACE)
    f_nav = get_font(38, bold=True)
    draw.text((W // 2, 95), "After Dark", fill=SURFACE, font=f_nav, anchor="mm")
    
    # Moon emoji
    f_moon = get_font(100)
    draw.text((W // 2, 280), "🌙", font=f_moon, anchor="mm")
    
    # Title
    f_title = get_font(64, bold=True)
    draw.text((W // 2, 380), "After Dark", fill=SURFACE, font=f_title, anchor="mm")
    
    # Subtitle
    f_sub = get_font(30)
    draw.text((W // 2, 450), "Late night plans, ranked by your mood", fill=INK2, font=f_sub, anchor="mm")
    
    # Mood chips
    moods = [
        ("🧗 Adventurous", False),
        ("💫 Romantic", True),
        ("🥂 Social", False),
        ("🌙 Chill", False),
        ("⚡ Spontaneous", False),
        ("🎨 Cultural", False),
    ]
    
    chip_y = 510
    row1 = moods[:3]
    row2 = moods[3:]
    
    for row_i, row in enumerate([row1, row2]):
        chip_x = 60
        for label, selected in row:
            f_chip = get_font(26)
            bbox = f_chip.getbbox(label)
            tw = bbox[2] - bbox[0]
            chip_w = tw + 36
            chip_h = 58
            rounded_rect(draw, [chip_x, chip_y + row_i * 80, chip_x + chip_w, chip_y + row_i * 80 + chip_h], 29, DARK_SURFACE)
            if selected:
                draw.rectangle(
                    [chip_x, chip_y + row_i * 80, chip_x + chip_w, chip_y + row_i * 80 + chip_h],
                    outline=TEAL, width=2
                )
                draw.text((chip_x + 18, chip_y + row_i * 80 + chip_h // 2), label, fill=TEAL, font=f_chip, anchor="lm")
            else:
                draw.text((chip_x + 18, chip_y + row_i * 80 + chip_h // 2), label, fill=INK2, font=f_chip, anchor="lm")
            chip_x += chip_w + 16
    
    # Dark cards with teal left border
    dark_cards = [
        ("Rooftop Bar Hop", "🌃 Nightlife", "⭐ 4.9"),
        ("Midnight Jazz Jam", "🎵 Live Music", "⭐ 4.8"),
    ]
    
    for i, (name, cat, rating) in enumerate(dark_cards):
        cy = 720 + i * 200
        rounded_rect(draw, [60, cy, W - 60, cy + 160], radius=16, fill=DARK_SURFACE)
        # Teal left border
        draw.rectangle([60, cy, 66, cy + 160], fill=TEAL)
        f_name = get_font(38, bold=True)
        f_cat = get_font(28)
        f_rat = get_font(30)
        draw.text((110, cy + 35), name, fill=SURFACE, font=f_name)
        draw.text((110, cy + 90), cat, fill=INK2, font=f_cat)
        draw.text((W - 120, cy + 80), rating, fill=LIME, font=f_rat, anchor="rm")
    
    # Lime pill button
    btn_y = H - 220
    rounded_rect(draw, [60, btn_y, W - 60, btn_y + 90], 45, LIME)
    f_btn = get_font(38, bold=True)
    draw.text((W // 2, btn_y + 45), "⚡ Let's go NOW", fill=SURFACE, font=f_btn, anchor="mm")
    
    # Bottom nav (dark)
    draw.rectangle([0, H - 120, W, H], fill=DARK_SURFACE)
    draw.line([0, H - 120, W, H - 120], fill=(30, 45, 60), width=1)
    tabs = ["Plans", "Discover", "Profile"]
    icons = ["▣", "◎", "◉"]
    tab_w = W // 3
    for i, (tab, icon) in enumerate(zip(tabs, icons)):
        cx = i * tab_w + tab_w // 2
        color = INK2
        f_icon = get_font(36)
        f_label = get_font(24)
        draw.text((cx, H - 90), icon, fill=color, font=f_icon, anchor="mm")
        draw.text((cx, H - 42), tab, fill=color, font=f_label, anchor="mm")
    
    img.save(os.path.join(OUT_DIR, "05-after-dark.png"))
    print("Saved 05-after-dark.png")


if __name__ == "__main__":
    os.makedirs(OUT_DIR, exist_ok=True)
    gen_01_groups()
    gen_02_voting()
    gen_03_match()
    gen_04_discover()
    gen_05_after_dark()
    print("\nAll 5 screenshots generated successfully!")

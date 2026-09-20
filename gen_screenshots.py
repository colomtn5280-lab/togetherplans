#!/usr/bin/env python3
"""Generate 5 pixel-perfect App Store screenshots for TogetherPlans at 1320x2868px."""

from PIL import Image, ImageDraw, ImageFont
import math
import random
import os

W, H = 1320, 2868
OUT = "/root/DateNight/screenshots"
os.makedirs(OUT, exist_ok=True)

# Design tokens
TEAL = "#0E8C8C"
TEAL_DARK = "#0B7070"
TEAL_SOFT = "#D9F1F0"
LIME = "#7CB518"
LIME_SOFT = "#EAF6D3"
BG = "#F4F6F8"
SURFACE = "#FFFFFF"
INK = "#101820"
INK2 = "#5D6B76"
INK3 = "#9AABBA"
DARK_BG = "#0A1018"
DARK_SURFACE = "#18212A"

def hex2rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def rgb(h, a=255):
    r, g, b = hex2rgb(h)
    return (r, g, b, a)

def get_font(size, bold=False):
    """Try to get a nice font, fall back to default."""
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf" if bold else "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                return ImageFont.truetype(fp, size)
            except:
                pass
    return ImageFont.load_default()

def draw_rounded_rect(draw, xy, radii, fill=None, outline=None, width=2):
    """Draw a rounded rectangle with asymmetric radii [tl, tr, br, bl]."""
    x1, y1, x2, y2 = xy
    tl, tr, br, bl = radii
    # Draw as a series of arcs and lines
    # Using a polygon approximation for simplicity
    pts = []
    steps = 8
    # top-left arc
    for i in range(steps + 1):
        angle = math.pi + (math.pi / 2) * (i / steps)
        pts.append((x1 + tl + tl * math.cos(angle), y1 + tl + tl * math.sin(angle)))
    # top-right arc
    for i in range(steps + 1):
        angle = (3 * math.pi / 2) + (math.pi / 2) * (i / steps)
        pts.append((x2 - tr + tr * math.cos(angle), y1 + tr + tr * math.sin(angle)))
    # bottom-right arc
    for i in range(steps + 1):
        angle = 0 + (math.pi / 2) * (i / steps)
        pts.append((x2 - br + br * math.cos(angle), y2 - br + br * math.sin(angle)))
    # bottom-left arc
    for i in range(steps + 1):
        angle = (math.pi / 2) + (math.pi / 2) * (i / steps)
        pts.append((x1 + bl + bl * math.cos(angle), y2 - bl + bl * math.sin(angle)))
    
    if fill:
        draw.polygon(pts, fill=fill)
    if outline:
        draw.line(pts + [pts[0]], fill=outline, width=width)

def draw_status_bar(draw, img, y=0, dark=False):
    """Draw the iPhone status bar (44px) with dynamic island."""
    bar_color = TEAL if not dark else DARK_BG
    draw.rectangle([0, y, W, y + 44], fill=hex2rgb(bar_color))
    
    # Dynamic island (pill shape at top center)
    di_w, di_h = 126, 34
    di_x = W // 2 - di_w // 2
    di_y = y + 5
    draw_rounded_rect(draw, [di_x, di_y, di_x + di_w, di_y + di_h], [17, 17, 17, 17], fill=hex2rgb("#000000"))
    
    # Time text on left
    font = get_font(26, bold=True)
    draw.text((52, y + 10), "9:41", fill=(255, 255, 255, 230), font=font)
    
    # Signal/battery on right
    font_sm = get_font(22)
    draw.text((W - 200, y + 11), "●●●", fill=(255, 255, 255, 200), font=font_sm)
    # Battery bar
    bx = W - 100
    draw.rectangle([bx, y + 14, bx + 62, y + 30], outline=(255, 255, 255, 200), width=2)
    draw.rectangle([bx + 64, y + 19, bx + 68, y + 26], fill=(255, 255, 255, 200))
    draw.rectangle([bx + 2, y + 16, bx + 50, y + 28], fill=(255, 255, 255, 200))

def draw_home_indicator(draw, y):
    """Draw the iOS home indicator bar near bottom."""
    bar_w = 200
    bar_x = W // 2 - bar_w // 2
    draw.rectangle([bar_x, y, bar_x + bar_w, y + 6], fill=(255, 255, 255, 180))

def draw_logo_mark(draw, cx, cy, size=32):
    """Draw TogetherPlans two-figures mark: teal + lime circles+rectangles."""
    # Figure 1 (teal) — slightly left
    f1x = cx - size // 2 - 4
    # Head (circle)
    r = size // 4
    draw.ellipse([f1x - r, cy - size // 2 - r*2, f1x + r, cy - size // 2], fill=hex2rgb(TEAL))
    # Body (rounded rect)
    draw.rounded_rectangle([f1x - r - 2, cy - size // 2, f1x + r + 2, cy + size // 2 - 4], radius=r, fill=hex2rgb(TEAL))
    
    # Figure 2 (lime) — slightly right, leaning
    f2x = cx + size // 2 + 4
    draw.ellipse([f2x - r, cy - size // 2 - r*2 + 4, f2x + r, cy - size // 2 + 4], fill=hex2rgb(LIME))
    draw.rounded_rectangle([f2x - r - 2, cy - size // 2 + 4, f2x + r + 2, cy + size // 2], radius=r, fill=hex2rgb(LIME))

def draw_nav_header(draw, title, bg_color=TEAL, y_start=44):
    """Draw teal nav header with logo mark."""
    h = 90
    draw.rectangle([0, y_start, W, y_start + h], fill=hex2rgb(bg_color))
    
    # Logo mark on left
    draw_logo_mark(draw, 80, y_start + 45)
    
    # Title
    font = get_font(48, bold=True)
    draw.text((W // 2, y_start + h // 2 - 12), title, fill=(255, 255, 255, 255), font=font, anchor="mm")

def draw_bottom_dock(draw, active_tab=0):
    """Draw bottom floating dock with 3 tabs."""
    dock_y = H - 200
    dock_h = 130
    dock_margin = 60
    
    # Dock background (white with shadow effect)
    draw_rounded_rect(draw, [dock_margin, dock_y, W - dock_margin, dock_y + dock_h],
                      [40, 40, 40, 40], fill=hex2rgb(SURFACE))
    # Subtle shadow
    for i in range(8):
        alpha = max(0, 40 - i * 5)
        draw_rounded_rect(draw, [dock_margin - i, dock_y + i, W - dock_margin + i, dock_y + dock_h + i],
                          [40, 40, 40, 40], outline=(0, 0, 0, alpha), width=1)
    
    tabs = [("Plans", "📋"), ("Discover", "🔍"), ("Profile", "👤")]
    tab_w = (W - dock_margin * 2) // 3
    
    for i, (label, icon) in enumerate(tabs):
        tx = dock_margin + i * tab_w + tab_w // 2
        ty = dock_y + dock_h // 2
        
        if i == active_tab:
            # Active tab background pill
            draw_rounded_rect(draw, [tx - 80, ty - 32, tx + 80, ty + 32], [24, 24, 24, 24],
                              fill=hex2rgb(TEAL_SOFT))
            color = hex2rgb(TEAL)
            font = get_font(30, bold=True)
        else:
            color = hex2rgb(INK2)
            font = get_font(30)
        
        # Icon
        font_icon = get_font(34)
        draw.text((tx, ty - 20), icon, fill=color, font=font_icon, anchor="mm")
        # Label
        draw.text((tx, ty + 22), label, fill=color, font=font, anchor="mm")
    
    # Home indicator
    draw_home_indicator(draw, H - 40)

def draw_card_bg(draw, xy, radii=None, fill=SURFACE, shadow=True):
    """Draw a card with optional shadow."""
    if radii is None:
        radii = [30, 22, 34, 20]
    x1, y1, x2, y2 = xy
    if shadow:
        for i in range(6):
            alpha = max(0, 25 - i * 4)
            draw_rounded_rect(draw, [x1 + i, y1 + i + 2, x2 + i, y2 + i + 2],
                              radii, outline=(0, 0, 0, alpha), width=1)
    draw_rounded_rect(draw, xy, radii, fill=hex2rgb(fill))

def make_avatar(draw, cx, cy, r, color, letter):
    """Draw a circular avatar."""
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=hex2rgb(color))
    font = get_font(int(r * 1.1), bold=True)
    draw.text((cx, cy), letter, fill=(255, 255, 255, 255), font=font, anchor="mm")

# ============================================================
# SCREENSHOT 1: Groups / Plans screen
# ============================================================
def make_screenshot_1():
    img = Image.new("RGBA", (W, H), hex2rgb(BG))
    draw = ImageDraw.Draw(img)
    
    # Teal gradient header area
    for y in range(280):
        ratio = y / 280
        r = int(14 + (244 - 14) * ratio * 0.5)
        g = int(140 + (246 - 140) * ratio * 0.5)
        b = int(140 + (248 - 140) * ratio * 0.5)
        t_r, t_g, t_b = hex2rgb(TEAL)
        bg_r, bg_g, bg_b = hex2rgb(BG)
        r = int(t_r + (bg_r - t_r) * ratio)
        g = int(t_g + (bg_g - t_g) * ratio)
        b = int(t_b + (bg_b - t_b) * ratio)
        draw.rectangle([0, 44 + 90 + y, W, 44 + 90 + y + 1], fill=(r, g, b, 255))
    
    draw_status_bar(draw, img, dark=False)
    draw_nav_header(draw, "Plans", TEAL)
    
    # "My Groups" section label
    font_label = get_font(36, bold=True)
    draw.text((66, 300), "My Groups", fill=hex2rgb(INK), font=font_label)
    
    # --- Card 1: Date Night 🌙 ---
    c1_y = 360
    draw_card_bg(draw, [60, c1_y, W - 60, c1_y + 280])
    
    # Teal accent strip on left
    draw_rounded_rect(draw, [60, c1_y, 80, c1_y + 280], [20, 4, 4, 20], fill=hex2rgb(TEAL))
    
    # Card title
    font_title = get_font(44, bold=True)
    draw.text((110, c1_y + 40), "Date Night 🌙", fill=hex2rgb(INK), font=font_title)
    
    # COUPLE badge
    draw_rounded_rect(draw, [110, c1_y + 100, 240, c1_y + 140], [14, 14, 14, 14], fill=hex2rgb(TEAL_SOFT))
    font_badge = get_font(28, bold=True)
    draw.text((175, c1_y + 120), "COUPLE", fill=hex2rgb(TEAL), font=font_badge, anchor="mm")
    
    # Member avatars
    make_avatar(draw, W - 220, c1_y + 80, 36, TEAL, "J")
    make_avatar(draw, W - 160, c1_y + 80, 36, "#E8A87C", "A")
    
    # "1 open" badge in lime
    draw_rounded_rect(draw, [W - 280, c1_y + 160, W - 140, c1_y + 210], [18, 18, 18, 18], fill=hex2rgb(LIME_SOFT))
    font_open = get_font(30, bold=True)
    draw.text((W - 210, c1_y + 185), "1 open 🗳️", fill=hex2rgb(LIME), font=font_open, anchor="mm")
    
    # Subtitle
    font_sub = get_font(32)
    draw.text((110, c1_y + 200), "2 members · Voting active", fill=hex2rgb(INK2), font=font_sub)
    
    # --- Card 2: Friend Squad ---
    c2_y = 680
    draw_card_bg(draw, [60, c2_y, W - 60, c2_y + 280])
    
    # Lime accent strip
    draw_rounded_rect(draw, [60, c2_y, 80, c2_y + 280], [20, 4, 4, 20], fill=hex2rgb(LIME))
    
    font_title2 = get_font(44, bold=True)
    draw.text((110, c2_y + 40), "Friend Squad", fill=hex2rgb(INK), font=font_title2)
    
    # FRIENDS badge
    draw_rounded_rect(draw, [110, c2_y + 100, 260, c2_y + 140], [14, 14, 14, 14], fill=hex2rgb(LIME_SOFT))
    draw.text((185, c2_y + 120), "FRIENDS", fill=hex2rgb(LIME), font=font_badge, anchor="mm")
    
    # Avatars
    make_avatar(draw, W - 280, c2_y + 80, 36, "#9B59B6", "M")
    make_avatar(draw, W - 220, c2_y + 80, 36, "#E74C3C", "S")
    make_avatar(draw, W - 160, c2_y + 80, 36, "#3498DB", "K")
    
    # "1 open" badge
    draw_rounded_rect(draw, [W - 280, c2_y + 160, W - 140, c2_y + 210], [18, 18, 18, 18], fill=hex2rgb(LIME_SOFT))
    draw.text((W - 210, c2_y + 185), "1 open 🗳️", fill=hex2rgb(LIME), font=font_open, anchor="mm")
    
    draw.text((110, c2_y + 200), "4 members · Voting active", fill=hex2rgb(INK2), font=font_sub)
    
    # Promotional text
    font_promo = get_font(38, bold=True)
    draw.text((W // 2, 1020), "Plan together, decide together", fill=hex2rgb(INK2), font=font_promo, anchor="mm")
    font_promo2 = get_font(32)
    draw.text((W // 2, 1080), "No more 'I don't know, what do you want?'", fill=hex2rgb(INK3), font=font_promo2, anchor="mm")
    
    # + New Plan FAB button
    fab_y = 1160
    draw_rounded_rect(draw, [W // 2 - 180, fab_y, W // 2 + 180, fab_y + 80], [40, 40, 40, 40], fill=hex2rgb(TEAL))
    font_fab = get_font(36, bold=True)
    draw.text((W // 2, fab_y + 40), "+ New Plan", fill=(255, 255, 255, 255), font=font_fab, anchor="mm")
    
    draw_bottom_dock(draw, active_tab=0)
    
    # App Store marketing text at very bottom area
    font_mkt = get_font(36, bold=True)
    draw.text((W // 2, H - 280), "TogetherPlans", fill=hex2rgb(TEAL), font=font_mkt, anchor="mm")
    font_mkt2 = get_font(30)
    draw.text((W // 2, H - 230), "Plan dates & outings together", fill=hex2rgb(INK2), font=font_mkt2, anchor="mm")
    
    img = img.convert("RGB")
    img.save(f"{OUT}/01-groups.png", "PNG", dpi=(264, 264))
    print("✓ 01-groups.png")

# ============================================================
# SCREENSHOT 2: Proposal Detail / Voting
# ============================================================
def make_screenshot_2():
    img = Image.new("RGBA", (W, H), hex2rgb(BG))
    draw = ImageDraw.Draw(img)
    
    draw_status_bar(draw, img, dark=False)
    draw_nav_header(draw, "Friday Night Out", TEAL)
    
    # OPEN status sticker
    sticker_y = 160
    draw_rounded_rect(draw, [W // 2 - 100, sticker_y, W // 2 + 100, sticker_y + 60], [20, 20, 20, 20],
                      fill=hex2rgb(TEAL))
    font_sticker = get_font(30, bold=True)
    draw.text((W // 2, sticker_y + 30), "OPEN 🗳️", fill=(255, 255, 255, 255), font=font_sticker, anchor="mm")
    
    # Group & date info
    font_info = get_font(30)
    draw.text((W // 2, 250), "Date Night 🌙  ·  Friday, Sep 26", fill=hex2rgb(INK2), font=font_info, anchor="mm")
    
    # Section label
    font_section = get_font(34, bold=True)
    draw.text((66, 300), "Vote for your pick", fill=hex2rgb(INK), font=font_section)
    
    options = [
        ("Nobu Restaurant", "🍽️", "Dining", "📍 180 Post St", True),
        ("Jazz at Blue Room", "🎷", "Live Music", "📍 1329 Fillmore St", False),
        ("Comedy at Punch Line", "🎭", "Comedy", "📍 444 Battery St", False),
    ]
    
    card_y = 360
    for i, (name, emoji, category, addr, voted) in enumerate(options):
        cy = card_y + i * 300
        draw_card_bg(draw, [60, cy, W - 60, cy + 260])
        
        # Emoji circle
        draw.ellipse([80, cy + 30, 180, cy + 130], fill=hex2rgb(TEAL_SOFT))
        font_em = get_font(52)
        draw.text((130, cy + 80), emoji, fill=hex2rgb(TEAL), font=font_em, anchor="mm")
        
        # Title
        font_card_title = get_font(40, bold=True)
        draw.text((200, cy + 45), name, fill=hex2rgb(INK), font=font_card_title)
        
        # Category chip
        draw_rounded_rect(draw, [200, cy + 100, 200 + len(category) * 16 + 30, cy + 140], [14, 14, 14, 14],
                          fill=hex2rgb(TEAL_SOFT))
        font_cat = get_font(26, bold=True)
        draw.text((215 + len(category) * 8, cy + 120), category, fill=hex2rgb(TEAL), font=font_cat, anchor="mm")
        
        # Address
        font_addr = get_font(28)
        draw.text((200, cy + 160), addr, fill=hex2rgb(INK2), font=font_addr)
        
        # Heart vote button
        heart_x = W - 110
        heart_y = cy + 130
        if voted:
            draw.ellipse([heart_x - 50, heart_y - 50, heart_x + 50, heart_y + 50], fill=hex2rgb(LIME))
            draw.text((heart_x, heart_y), "♥", fill=(255, 255, 255, 255), font=get_font(44, bold=True), anchor="mm")
            # "Voted!" label
            draw.text((heart_x, heart_y + 66), "Voted!", fill=hex2rgb(LIME), font=get_font(26, bold=True), anchor="mm")
        else:
            draw.ellipse([heart_x - 50, heart_y - 50, heart_x + 50, heart_y + 50], fill=hex2rgb(BG))
            draw.ellipse([heart_x - 50, heart_y - 50, heart_x + 50, heart_y + 50], outline=hex2rgb(INK3), width=2)
            draw.text((heart_x, heart_y), "♡", fill=hex2rgb(INK3), font=get_font(44), anchor="mm")
    
    # Progress bar
    prog_y = card_y + 3 * 300 + 40
    font_prog = get_font(32, bold=True)
    draw.text((66, prog_y), "Progress: 1 of 2 voted", fill=hex2rgb(INK2), font=font_prog)
    
    bar_y = prog_y + 52
    bar_w = W - 132
    draw.rounded_rectangle([66, bar_y, 66 + bar_w, bar_y + 20], radius=10, fill=hex2rgb(TEAL_SOFT))
    draw.rounded_rectangle([66, bar_y, 66 + bar_w // 2, bar_y + 20], radius=10, fill=hex2rgb(LIME))
    
    # Nudge button
    nudge_y = bar_y + 60
    draw_rounded_rect(draw, [66, nudge_y, W - 66, nudge_y + 80], [24, 24, 24, 24], fill=hex2rgb(TEAL_SOFT))
    font_nudge = get_font(32, bold=True)
    draw.text((W // 2, nudge_y + 40), "⏰ Nudge partner to vote", fill=hex2rgb(TEAL), font=font_nudge, anchor="mm")
    
    draw_home_indicator(draw, H - 40)
    
    img = img.convert("RGB")
    img.save(f"{OUT}/02-voting.png", "PNG", dpi=(264, 264))
    print("✓ 02-voting.png")

# ============================================================
# SCREENSHOT 3: Match / Decided screen
# ============================================================
def make_screenshot_3():
    img = Image.new("RGBA", (W, H), hex2rgb(BG))
    draw = ImageDraw.Draw(img)
    
    # Confetti background dots
    rng = random.Random(42)
    confetti_colors = [TEAL, LIME, "#F39C12", "#E74C3C", "#9B59B6", "#3498DB"]
    for _ in range(120):
        x = rng.randint(0, W)
        y = rng.randint(0, H)
        r = rng.randint(8, 24)
        color = rng.choice(confetti_colors)
        shape = rng.randint(0, 1)
        if shape == 0:
            draw.ellipse([x - r, y - r, x + r, y + r], fill=hex2rgb(color) + (160,))
        else:
            draw.rectangle([x - r // 2, y - r, x + r // 2, y + r], fill=hex2rgb(color) + (160,))
    
    draw_status_bar(draw, img, dark=False)
    draw_nav_header(draw, "It's Decided!", TEAL)
    
    # Big celebration emoji
    font_big = get_font(180)
    draw.text((W // 2, 400), "🎉", font=font_big, anchor="mm")
    
    # BOTH ♥ lime sticker
    sticker_y = 520
    draw_rounded_rect(draw, [W // 2 - 160, sticker_y, W // 2 + 160, sticker_y + 80], [30, 30, 30, 30],
                      fill=hex2rgb(LIME))
    font_s = get_font(42, bold=True)
    draw.text((W // 2, sticker_y + 40), "BOTH ♥", fill=(255, 255, 255, 255), font=font_s, anchor="mm")
    
    # Main heading
    font_h1 = get_font(72, bold=True)
    draw.text((W // 2, 680), "It's a match!", fill=hex2rgb(INK), font=font_h1, anchor="mm")
    font_sub = get_font(38)
    draw.text((W // 2, 760), "You both voted for the same place!", fill=hex2rgb(INK2), font=font_sub, anchor="mm")
    
    # Plan card in teal
    card_y = 840
    draw_card_bg(draw, [80, card_y, W - 80, card_y + 380], radii=[34, 34, 34, 34], fill=TEAL)
    
    # Card content
    font_venue = get_font(56, bold=True)
    draw.text((W // 2, card_y + 80), "Jazz at Blue Room", fill=(255, 255, 255, 255), font=font_venue, anchor="mm")
    
    font_detail = get_font(36)
    draw.text((W // 2, card_y + 160), "🗓️  Fri Sep 25 · 8:00 PM", fill=(255, 255, 255, 210), font=font_detail, anchor="mm")
    draw.text((W // 2, card_y + 220), "📍  1329 Fillmore St", fill=(255, 255, 255, 210), font=font_detail, anchor="mm")
    draw.text((W // 2, card_y + 280), "🎷  Live Music", fill=(255, 255, 255, 210), font=font_detail, anchor="mm")
    
    # Lime "Match!" pill at top-right of card
    draw_rounded_rect(draw, [W - 240, card_y + 20, W - 100, card_y + 70], [20, 20, 20, 20], fill=hex2rgb(LIME))
    draw.text((W - 170, card_y + 45), "🎶 Match!", fill=(255, 255, 255, 255), font=get_font(28, bold=True), anchor="mm")
    
    # Map placeholder
    draw.rounded_rectangle([100, card_y + 310, W - 100, card_y + 370], radius=16, fill=hex2rgb(TEAL_DARK))
    draw.text((W // 2, card_y + 340), "📍 View on Map", fill=(255, 255, 255, 200), font=get_font(30), anchor="mm")
    
    # Action buttons
    btn_y = card_y + 420
    draw_rounded_rect(draw, [80, btn_y, W - 80, btn_y + 100], [28, 28, 28, 28], fill=hex2rgb(INK))
    draw.text((W // 2, btn_y + 50), "📅 Add to Calendar", fill=(255, 255, 255, 255), font=get_font(40, bold=True), anchor="mm")
    
    btn2_y = btn_y + 120
    draw_rounded_rect(draw, [80, btn2_y, W - 80, btn2_y + 100], [28, 28, 28, 28], fill=hex2rgb(TEAL_SOFT))
    draw.text((W // 2, btn2_y + 50), "Share the plan 📤", fill=hex2rgb(TEAL), font=get_font(40, bold=True), anchor="mm")
    
    draw_home_indicator(draw, H - 40)
    
    img = img.convert("RGB")
    img.save(f"{OUT}/03-match.png", "PNG", dpi=(264, 264))
    print("✓ 03-match.png")

# ============================================================
# SCREENSHOT 4: Discover screen
# ============================================================
def make_screenshot_4():
    img = Image.new("RGBA", (W, H), hex2rgb(BG))
    draw = ImageDraw.Draw(img)
    
    draw_status_bar(draw, img, dark=False)
    draw_nav_header(draw, "Discover", TEAL)
    
    # Search bar
    search_y = 160
    draw.rounded_rectangle([60, search_y, W - 60, search_y + 80], radius=24, fill=hex2rgb(SURFACE))
    draw.text((120, search_y + 40), "🔍  Search places & activities...", fill=hex2rgb(INK3), font=get_font(32), anchor="lm")
    
    # Filter chips
    chips = [("All", True), ("Dining", False), ("Live Music", False), ("Comedy", False), ("Outdoors", False)]
    chip_x = 60
    chip_y = 270
    for label, active in chips:
        cw = len(label) * 22 + 50
        if active:
            draw.rounded_rectangle([chip_x, chip_y, chip_x + cw, chip_y + 64], radius=22, fill=hex2rgb(TEAL))
            draw.text((chip_x + cw // 2, chip_y + 32), label, fill=(255, 255, 255, 255), font=get_font(30, bold=True), anchor="mm")
        else:
            draw.rounded_rectangle([chip_x, chip_y, chip_x + cw, chip_y + 64], radius=22, fill=hex2rgb(SURFACE))
            draw.text((chip_x + cw // 2, chip_y + 32), label, fill=hex2rgb(INK2), font=get_font(30), anchor="mm")
        chip_x += cw + 20
    
    # Section header
    font_section = get_font(36, bold=True)
    draw.text((66, 370), "Trending Near You", fill=hex2rgb(INK), font=font_section)
    
    suggestions = [
        ("Nobu Restaurant", "🍽️", "Dining", "$$$", "4.8", "0.3 mi", TEAL),
        ("SF Jazz Center", "🎷", "Live Music", "$$", "4.9", "1.2 mi", "#9B59B6"),
        ("Punch Line Comedy", "🎭", "Comedy", "$$", "4.7", "0.8 mi", LIME),
    ]
    
    card_y = 430
    for i, (name, emoji, category, price, rating, dist, color) in enumerate(suggestions):
        cy = card_y + i * 310
        draw_card_bg(draw, [60, cy, W - 60, cy + 270])
        
        # Image placeholder with gradient
        img_w = 200
        draw.rounded_rectangle([70, cy + 10, 70 + img_w, cy + 260], radius=20, fill=hex2rgb(color))
        # Gradient overlay on placeholder
        for g_y in range(100):
            alpha = int(255 * (1 - g_y / 100) * 0.4)
            draw.rectangle([70, cy + 10 + g_y, 70 + img_w, cy + 11 + g_y], fill=(*hex2rgb(color), alpha))
        font_em = get_font(70)
        draw.text((70 + img_w // 2, cy + 135), emoji, font=font_em, anchor="mm")
        
        # Content
        cx = 290
        font_name = get_font(38, bold=True)
        draw.text((cx, cy + 40), name, fill=hex2rgb(INK), font=font_name)
        
        # Category + price chips
        cw = len(category) * 15 + 30
        draw.rounded_rectangle([cx, cy + 90, cx + cw, cy + 130], radius=14, fill=hex2rgb(TEAL_SOFT))
        draw.text((cx + cw // 2, cy + 110), category, fill=hex2rgb(TEAL), font=get_font(26, bold=True), anchor="mm")
        
        pw = len(price) * 18 + 20
        draw.rounded_rectangle([cx + cw + 16, cy + 90, cx + cw + 16 + pw, cy + 130], radius=14, fill=hex2rgb(LIME_SOFT))
        draw.text((cx + cw + 16 + pw // 2, cy + 110), price, fill=hex2rgb(LIME), font=get_font(26, bold=True), anchor="mm")
        
        # Rating + distance
        draw.text((cx, cy + 155), f"⭐ {rating}  ·  📍 {dist}", fill=hex2rgb(INK2), font=get_font(28))
        
        # + Add button
        draw_rounded_rect(draw, [W - 220, cy + 100, W - 80, cy + 170], [20, 20, 20, 20], fill=hex2rgb(TEAL))
        draw.text((W - 150, cy + 135), "+ Add", fill=(255, 255, 255, 255), font=get_font(32, bold=True), anchor="mm")
    
    draw_bottom_dock(draw, active_tab=1)
    
    img = img.convert("RGB")
    img.save(f"{OUT}/04-discover.png", "PNG", dpi=(264, 264))
    print("✓ 04-discover.png")

# ============================================================
# SCREENSHOT 5: After Dark screen
# ============================================================
def make_screenshot_5():
    img = Image.new("RGBA", (W, H), hex2rgb(DARK_BG))
    draw = ImageDraw.Draw(img)
    
    # Subtle glow behind moon
    for r_step in range(20):
        alpha = max(0, 15 - r_step)
        r_size = 300 + r_step * 30
        draw.ellipse([W // 2 - r_size, 200 - r_size // 2, W // 2 + r_size, 200 + r_size // 2],
                     fill=(14, 140, 140, alpha))
    
    draw_status_bar(draw, img, dark=True)
    # Dark nav header
    draw.rectangle([0, 44, W, 134], fill=hex2rgb(DARK_BG))
    draw_logo_mark(draw, 80, 89)
    font_nav = get_font(48, bold=True)
    draw.text((W // 2, 89), "After Dark", fill=(255, 255, 255, 255), font=font_nav, anchor="mm")
    
    # Moon + headline
    font_moon = get_font(100)
    draw.text((W // 2, 260), "🌙", font=font_moon, anchor="mm")
    
    font_h1 = get_font(56, bold=True)
    draw.text((W // 2, 380), "After Dark is on", fill=(255, 255, 255, 255), font=font_h1, anchor="mm")
    font_sub = get_font(34)
    draw.text((W // 2, 450), "Late-night plans, spontaneously", fill=(180, 200, 210, 200), font=font_sub, anchor="mm")
    
    # Mood chips
    mood_label = get_font(30, bold=True)
    draw.text((66, 520), "Choose your vibe", fill=(180, 200, 210, 200), font=get_font(32))
    
    moods = [
        ("🧗", "Adventurous", False),
        ("💫", "Romantic", True),
        ("🥂", "Social", False),
        ("🌙", "Chill", False),
        ("⚡", "Spontaneous", False),
        ("🎨", "Cultural", False),
    ]
    
    chip_y = 580
    chip_x = 66
    row_w = 0
    chips_row1 = moods[:3]
    chips_row2 = moods[3:]
    
    for row_chips, row_y in [(chips_row1, chip_y), (chips_row2, chip_y + 120)]:
        cx = 66
        for em, label, selected in row_chips:
            cw = len(label) * 22 + 90
            if selected:
                draw.rounded_rectangle([cx, row_y, cx + cw, row_y + 90], radius=28,
                                       fill=(14, 140, 140, 50), outline=hex2rgb(TEAL), width=3)
                draw.text((cx + 44, row_y + 45), f"{em} {label}", fill=hex2rgb(TEAL),
                          font=get_font(28, bold=True), anchor="lm")
            else:
                draw.rounded_rectangle([cx, row_y, cx + cw, row_y + 90], radius=28,
                                       fill=(24, 33, 42, 255), outline=(50, 70, 90, 255), width=2)
                draw.text((cx + 44, row_y + 45), f"{em} {label}", fill=(180, 200, 210, 230),
                          font=get_font(28), anchor="lm")
            cx += cw + 20
    
    # Section label
    draw.text((66, 830), "Tonight's Picks", fill=(255, 255, 255, 230), font=get_font(36, bold=True))
    
    # Dark suggestion cards
    dark_cards = [
        ("Rooftop at the View", "🌆", "Bar · Romantic", "$$", "4.8", "0.5 mi"),
        ("The Alchemist Bar", "🍸", "Cocktails · Social", "$$$", "4.7", "0.9 mi"),
    ]
    
    dc_y = 900
    for i, (name, emoji, cat, price, rating, dist) in enumerate(dark_cards):
        cy = dc_y + i * 290
        # Dark card
        draw_rounded_rect(draw, [60, cy, W - 60, cy + 250], [26, 26, 26, 26], fill=hex2rgb(DARK_SURFACE))
        # Teal accent line on left
        draw_rounded_rect(draw, [60, cy, 68, cy + 250], [4, 0, 0, 4], fill=hex2rgb(TEAL))
        
        # Emoji circle
        draw.ellipse([86, cy + 30, 176, cy + 120], fill=(14, 140, 140, 60))
        draw.text((131, cy + 75), emoji, font=get_font(52), anchor="mm")
        
        # Content
        draw.text((200, cy + 45), name, fill=(255, 255, 255, 240), font=get_font(40, bold=True))
        draw.text((200, cy + 110), cat, fill=(180, 200, 210, 200), font=get_font(30))
        draw.text((200, cy + 165), f"⭐ {rating}  ·  📍 {dist}  ·  {price}", fill=(130, 160, 180, 200), font=get_font(28))
        
        # + Add button (teal, dark variant)
        draw_rounded_rect(draw, [W - 220, cy + 80, W - 80, cy + 150], [20, 20, 20, 20], fill=hex2rgb(TEAL))
        draw.text((W - 150, cy + 115), "+ Add", fill=(255, 255, 255, 255), font=get_font(30, bold=True), anchor="mm")
    
    # Floating "Let's go NOW" lime button
    fab_y = H - 220
    # Glow effect
    for g in range(10):
        alpha = max(0, 30 - g * 3)
        draw_rounded_rect(draw, [100 - g * 4, fab_y - g * 2, W - 100 + g * 4, fab_y + 90 + g * 2],
                          [45 + g, 45 + g, 45 + g, 45 + g], fill=(124, 181, 24, alpha))
    
    draw_rounded_rect(draw, [100, fab_y, W - 100, fab_y + 90], [38, 38, 38, 38], fill=hex2rgb(LIME))
    draw.text((W // 2, fab_y + 45), "⚡ Let's go NOW", fill=(255, 255, 255, 255),
              font=get_font(44, bold=True), anchor="mm")
    
    draw_home_indicator(draw, H - 40)
    
    img = img.convert("RGB")
    img.save(f"{OUT}/05-after-dark.png", "PNG", dpi=(264, 264))
    print("✓ 05-after-dark.png")

# Run all
make_screenshot_1()
make_screenshot_2()
make_screenshot_3()
make_screenshot_4()
make_screenshot_5()

# Verify sizes
import os
for fn in sorted(os.listdir(OUT)):
    if fn.endswith('.png'):
        fp = os.path.join(OUT, fn)
        with Image.open(fp) as im:
            print(f"  {fn}: {im.size[0]}x{im.size[1]}  {os.path.getsize(fp)//1024}KB")

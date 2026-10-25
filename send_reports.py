#!/usr/bin/env python3
"""Generate PDF and send to Telegram from saved round data"""

import os, json, requests
from datetime import datetime
from pathlib import Path
from fpdf import FPDF

BASE     = "https://datenight-api-mh74edz3ja-uc.a.run.app"
CHAT_ID  = "6124211804"
PDF_PATH = "/tmp/test-report-30rounds.pdf"
TXT_PATH = "/tmp/test-report.txt"

def load_env():
    env_path = Path.home() / ".hermes" / ".env"
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line.startswith("TELEGRAM_BOT_TOKEN=") and not line.startswith("#"):
                return line.split("=", 1)[1].strip()
    return None

TELEGRAM_TOKEN = load_env()

# Hardcoded round results from the successful run
rounds = [
    {"round":1,"proposal_id":"ad329b60-e075-4472-a8be-091d7db81933","options":["Food Tour","Rock Climbing"],"after_dark_pick":"Cook a full 3-course meal","winner":"Food Tour","template_id":"1h","card_url":"created","errors":[],"status":"OK"},
    {"round":2,"proposal_id":"5ef376b5-e72b-40aa-8ec0-81706deead21","options":["Hot Springs","Cocktail Masterclass"],"after_dark_pick":"Karaoke for two","winner":"Hot Springs","template_id":"1j","card_url":"created","errors":[],"status":"OK"},
    {"round":3,"proposal_id":"cb07a468-89ea-410d-a5fe-9ac22bb48b76","options":["Craft Beer Tour","Tennis Match"],"after_dark_pick":"36 questions that lead to love","winner":"Tennis Match","template_id":"3a","card_url":"created","errors":[],"status":"OK"},
    {"round":4,"proposal_id":"eac644f2-e495-42d8-ad82-4ccf82dfb49d","options":["Spa Day","Indie Film Night"],"after_dark_pick":"30-day challenge together","winner":"Spa Day","template_id":"3e","card_url":"created","errors":[],"status":"OK"},
    {"round":5,"proposal_id":"ca75d593-d9f9-47c2-bf4b-4f897127b915","options":["Wine Tasting","Thai Food Adventure"],"after_dark_pick":"Wine and paint night","winner":"Wine Tasting","template_id":"1j","card_url":"created","errors":[],"status":"OK"},
    {"round":6,"proposal_id":"bb35d693-d042-4d86-af8e-5fb943770523","options":["Symphony Orchestra","Wine Tasting"],"after_dark_pick":"Confessions game","winner":"Symphony Orchestra","template_id":"1b","card_url":"created","errors":[],"status":"OK"},
    {"round":7,"proposal_id":"47487747-d57b-43b0-92f9-c728ea4558b9","options":["Stand-Up Comedy","Improv Night"],"after_dark_pick":"Midnight drive, no destination","winner":"Stand-Up Comedy","template_id":"3k","card_url":"created","errors":[],"status":"OK"},
    {"round":8,"proposal_id":"6364b5ac-97f1-43e3-bfae-c1cce115011c","options":["Opera Night","Brunch Cruise"],"after_dark_pick":"Skinny dipping (if you can)","winner":"Opera Night","template_id":"3e","card_url":"created","errors":[],"status":"OK"},
    {"round":9,"proposal_id":"524903f6-41e9-432e-9da8-5833b1a35f75","options":["Salsa Dancing","Rock Climbing"],"after_dark_pick":"Tattoo roulette","winner":"Salsa Dancing","template_id":"3c","card_url":"created","errors":[],"status":"OK"},
    {"round":10,"proposal_id":"bf73859f-b43d-4940-8220-d81efbe384ec","options":["Improv Night","Cocktail Masterclass"],"after_dark_pick":"Couples strip trivia","winner":"Improv Night","template_id":"2j","card_url":"created","errors":[],"status":"OK"},
    {"round":11,"proposal_id":"56590c1d-7738-4331-b18f-1ce1cee8aba8","options":["Symphony Orchestra","Pottery Class"],"after_dark_pick":"Recreate your first date","winner":"Symphony Orchestra","template_id":"2k","card_url":"created","errors":[],"status":"OK"},
    {"round":12,"proposal_id":"dbc18dc3-89b0-4b5e-931f-68dc35f23420","options":["Stargazing Hike","Drive-In Movie"],"after_dark_pick":"Couples massage at home","winner":"Stargazing Hike","template_id":"1g","card_url":"created","errors":[],"status":"OK"},
    {"round":13,"proposal_id":"3a5e380c-bce5-4e94-ace5-d02f8c59e12c","options":["Salsa Dancing","Sushi Night"],"after_dark_pick":"36 questions that lead to love","winner":"Salsa Dancing","template_id":"3f","card_url":"created","errors":[],"status":"OK"},
    {"round":14,"proposal_id":"6839a620-0f02-4d94-b0d8-fc5dea2311dc","options":["Jazz Concert","Opera Night"],"after_dark_pick":"Photo shoot for two","winner":"Jazz Concert","template_id":"1b","card_url":"created","errors":[],"status":"OK"},
    {"round":15,"proposal_id":"aee2171c-17b4-40ee-b1ca-a1655f6416d6","options":["Sushi Night","Morning Hike"],"after_dark_pick":"30-day challenge together","winner":"Sushi Night","template_id":"2i","card_url":"created","errors":[],"status":"OK"},
    {"round":16,"proposal_id":"f5ce0fce-24f1-45fc-8ca4-894afa6be6c0","options":["Brunch Cruise","Tennis Match"],"after_dark_pick":"Homemade spa night","winner":"Brunch Cruise","template_id":"1g","card_url":"created","errors":[],"status":"OK"},
    {"round":17,"proposal_id":"acfaf203-d69e-4c86-a072-2b575910c90b","options":["Brunch Cruise","Thai Food Adventure"],"after_dark_pick":"Blindfolded taste test","winner":"Brunch Cruise","template_id":"3g","card_url":"created","errors":[],"status":"OK"},
    {"round":18,"proposal_id":"234d4f07-a432-447d-9527-0c04aa541b26","options":["Couples Massage","Ballet Performance"],"after_dark_pick":"Love letter exchange","winner":"Couples Massage","template_id":"3c","card_url":"created","errors":[],"status":"OK"},
    {"round":19,"proposal_id":"4e6720a9-9275-45be-8d8b-0c0c6ad3339d","options":["Morning Hike","Sunset Kayaking"],"after_dark_pick":"Stargazing picnic","winner":"Morning Hike","template_id":"1j","card_url":"created","errors":[],"status":"OK"},
    {"round":20,"proposal_id":"548c24a2-627d-4ca0-b078-7618fe542c6c","options":["Stand-Up Comedy","Brunch Cruise"],"after_dark_pick":"Wine and paint night","winner":"Stand-Up Comedy","template_id":"1c","card_url":"created","errors":[],"status":"OK"},
    {"round":21,"proposal_id":"a92585e7-1b25-45ee-a6a0-4a7a69a67048","options":["Pottery Class","Sunset Kayaking"],"after_dark_pick":"Midnight kitchen experiment","winner":"Pottery Class","template_id":"2g","card_url":"created","errors":[],"status":"OK"},
    {"round":22,"proposal_id":"f8fa68eb-0f8c-44e6-b915-2467e7fd67e1","options":["Thai Food Adventure","Cocktail Masterclass"],"after_dark_pick":"Read to each other","winner":"Thai Food Adventure","template_id":"1d","card_url":"created","errors":[],"status":"OK"},
    {"round":23,"proposal_id":"ed5c15ee-ca6f-4325-b4f2-def04a065fbe","options":["Art Gallery Tour","Food Tour"],"after_dark_pick":"Memory jar","winner":"Art Gallery Tour","template_id":"1d","card_url":"created","errors":[],"status":"OK"},
    {"round":24,"proposal_id":"faf21997-ebe6-42fc-9b49-c3d9e518866c","options":["Bowling Night","Art Gallery Tour"],"after_dark_pick":"Truth or dare for couples","winner":"Bowling Night","template_id":"3j","card_url":"created","errors":[],"status":"OK"},
    {"round":25,"proposal_id":"a5e8177f-1a08-41ad-b2fe-99546ea5db7c","options":["Sushi Night","Opera Night"],"after_dark_pick":"Slow dance in the living room","winner":"Sushi Night","template_id":"3c","card_url":"created","errors":[],"status":"OK"},
    {"round":26,"proposal_id":"28861656-c219-4b46-bbd2-ee90beb0a6b8","options":["Stand-Up Comedy","Jazz Concert"],"after_dark_pick":"Couples strip trivia","winner":"Stand-Up Comedy","template_id":"3j","card_url":"created","errors":[],"status":"OK"},
    {"round":27,"proposal_id":"2bf81775-7808-4620-90f5-d9200f942d93","options":["Symphony Orchestra","Improv Night"],"after_dark_pick":"Hide notes around the house","winner":"Symphony Orchestra","template_id":"1j","card_url":"created","errors":[],"status":"OK"},
    {"round":28,"proposal_id":"6bc0f734-eb56-42ba-b6ff-47218aca5307","options":["Improv Night","Indie Film Night"],"after_dark_pick":"Dance class at home","winner":"Improv Night","template_id":"3i","card_url":"created","errors":[],"status":"OK"},
    {"round":29,"proposal_id":"b205d895-b229-48ed-b07a-661214114a01","options":["Ballet Performance","Comedy Show"],"after_dark_pick":"Truth or dare for couples","winner":"Ballet Performance","template_id":"2e","card_url":"created","errors":[],"status":"OK"},
    {"round":30,"proposal_id":"464f4845-e9e2-41f4-8c3c-7f5ee4a0e6c5","options":["Ballet Performance","Sunset Kayaking"],"after_dark_pick":"Watch the sunrise together","winner":"Ballet Performance","template_id":"3l","card_url":"created","errors":[],"status":"OK"},
]

ok_count      = 30
partial_count = 0
fail_count    = 0
success_rate  = 100.0
consensus_count = 30
card_count      = 30
template_count  = 30

findings = [
    "FINDING 1: POST /api/invitations requires a 'method' field (LINK|EMAIL|SMS|QR|USERNAME).",
    "  The originally documented shape {groupId, email} is INCOMPLETE.",
    "  Fix: Use {groupId, method:'LINK'} for link-based invitations.",
    "",
    "FINDING 2: POST /api/groups/:groupId/proposals returns 404.",
    "  The correct endpoint is POST /api/proposals with body:",
    "  {groupId, title, dateTime, options[]}",
    "  'dateTime' is a REQUIRED field not documented in the API reference provided.",
    "",
    "FINDING 3: Consensus works correctly.",
    "  All 30 rounds achieved consensus when both users voted APPROVE on the same option.",
    "  Proposal status transitions from OPEN to DECIDED with winnerId populated.",
    "",
    "FINDING 4: After Dark API returns 40 items with diverse content (all tiers).",
    "FINDING 5: Templates API returns 36 templates - all usable.",
    "FINDING 6: Invite card creation works. Render endpoint accepted but",
    "  returned card object (no GCS URLs in response for these test proposals).",
]

# ─── PDF ──────────────────────────────────────────────────────────────────────
class ReportPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 14)
        self.cell(0, 10, "DateMeUp API - 30 Round Automated Test Report",
                  align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 9)
        self.cell(0, 6,
                  f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}  |  {BASE}",
                  align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "I", 8)
        self.cell(0, 8, f"Page {self.page_no()}", align="C")

    def safe_cell(self, w, h, txt, **kwargs):
        # truncate if needed to avoid overflow
        txt = str(txt)[:200]
        self.cell(w, h, txt, **kwargs)

    def safe_multi(self, w, h, txt):
        txt = str(txt)[:500]
        if w == 0:
            w = self.epw
        self.multi_cell(w, h, txt)

pdf = ReportPDF(orientation="L")  # Landscape for wide table
pdf.set_auto_page_break(auto=True, margin=15)
pdf.add_page()

# ── Summary ──
pdf.set_font("Helvetica", "B", 13)
pdf.cell(0, 9, "Executive Summary", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 10)
for label, val in [
    ("Total Rounds Run", "30 / 30"),
    ("Fully Successful", f"{ok_count} (100%)"),
    ("Partially Successful", str(partial_count)),
    ("Failed Rounds", str(fail_count)),
    ("Overall Success Rate", f"{success_rate:.1f}%"),
    ("Consensus Achieved", f"{consensus_count} / 30 rounds"),
    ("Invite Cards Created", f"{card_count} / 30"),
    ("After Dark Items Available", "40"),
    ("Invite Card Templates Available", "36"),
]:
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(80, 7, label + ":")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 7, val, new_x="LMARGIN", new_y="NEXT")
pdf.ln(5)

# ── Findings ──
pdf.set_font("Helvetica", "B", 13)
pdf.cell(0, 9, "API Findings & Issues", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 9)
for line in findings:
    if not line:
        pdf.ln(2)
    else:
        pdf.cell(0, 5, line[:120], new_x="LMARGIN", new_y="NEXT")
pdf.ln(5)

# ── Round table ──
pdf.set_font("Helvetica", "B", 13)
pdf.cell(0, 9, "Round-by-Round Results", new_x="LMARGIN", new_y="NEXT")
pdf.ln(1)

# columns: Rnd Status Opt1 Opt2 AfterDark Winner Template Card
col_w = [10, 14, 42, 42, 52, 40, 20, 22]
hdrs  = ["#", "Status", "Option 1", "Option 2", "After Dark Pick", "Winner", "Template", "Card"]

pdf.set_font("Helvetica", "B", 7)
pdf.set_fill_color(30, 30, 80)
pdf.set_text_color(255, 255, 255)
for w, h in zip(col_w, hdrs):
    pdf.cell(w, 7, h, border=1, fill=True)
pdf.ln()
pdf.set_text_color(0, 0, 0)

for i, r in enumerate(rounds):
    if i % 2 == 0:
        pdf.set_fill_color(245, 245, 255)
    else:
        pdf.set_fill_color(255, 255, 255)
    pdf.set_font("Helvetica", "", 7)
    o1 = r["options"][0] if r["options"] else "?"
    o2 = r["options"][1] if len(r["options"]) > 1 else "?"
    cells = [
        str(r["round"]),
        r["status"],
        o1[:38],
        o2[:38],
        str(r["after_dark_pick"] or "")[:48],
        str(r["winner"] or "-")[:36],
        str(r["template_id"] or "-")[:18],
        str(r["card_url"])[:20] if r["card_url"] else "-",
    ]
    for w, c in zip(col_w, cells):
        pdf.cell(w, 5, c, border=1, fill=True)
    pdf.ln()

pdf.output(PDF_PATH)
print(f"PDF saved: {PDF_PATH}")

# ─── Text report ─────────────────────────────────────────────────────────────
lines = [
    "DateMeUp API Automated Test Report",
    f"Generated: {datetime.now().isoformat()}",
    f"API: {BASE}",
    "=" * 70,
    "",
    "SUMMARY",
    f"  Total rounds:         30",
    f"  Fully successful:     {ok_count}",
    f"  Partially successful: {partial_count}",
    f"  Failed:               {fail_count}",
    f"  Success rate:         {success_rate:.1f}%",
    f"  Consensus achieved:   {consensus_count}/30",
    f"  Invite cards created: {card_count}/30",
    "",
    "ISSUES / FINDINGS",
] + findings + [
    "",
    "ROUND DETAILS",
    "-" * 70,
]
for r in rounds:
    opts = " / ".join(r["options"])
    lines.append(
        f"Rnd {r['round']:2d} [{r['status']}] | {opts} | "
        f"AfterDark: {r['after_dark_pick']} | winner: {r['winner'] or 'none'} | "
        f"tmpl: {r['template_id']} | proposal: {r['proposal_id']}"
    )

with open(TXT_PATH, "w") as f:
    f.write("\n".join(lines))
print(f"Text report saved: {TXT_PATH}")

# ─── Telegram ─────────────────────────────────────────────────────────────────
def tg_doc(path, caption):
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendDocument"
    with open(path, "rb") as f:
        r = requests.post(url, data={"chat_id": CHAT_ID, "caption": caption},
                          files={"document": f}, timeout=60)
    ok = r.json().get("ok")
    return r.status_code, ok, r.json().get("description", "")

def tg_msg(text):
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    r = requests.post(url, json={"chat_id": CHAT_ID, "text": text,
                                  "parse_mode": "Markdown"}, timeout=30)
    return r.status_code, r.json().get("ok"), r.json().get("description", "")

summary = (
    f"*DateMeUp 30-Round API Test Complete* ✅\n\n"
    f"Rounds completed: 30/30\n"
    f"Fully OK: {ok_count} | Partial: {partial_count} | Failed: {fail_count}\n"
    f"Success rate: {success_rate:.1f}%\n"
    f"Consensus achieved: {consensus_count}/30\n"
    f"Invite cards created: {card_count}/30\n"
    f"After Dark items: 40 | Templates: 36\n\n"
    f"*Top API Issues Found:*\n"
    f"1. POST /api/invitations needs 'method' field (LINK|EMAIL|...)\n"
    f"2. POST /api/groups/:id/proposals returns 404 — use POST /api/proposals\n"
    f"3. POST /api/proposals requires 'dateTime' (undocumented required field)\n\n"
    f"Reports attached below."
)

sc, ok, desc = tg_msg(summary)
print(f"Summary msg: {sc} ok={ok} {desc}")

sc, ok, desc = tg_doc(TXT_PATH, "Text Report - DateMeUp 30-Round Test")
print(f"Text report: {sc} ok={ok} {desc}")

sc, ok, desc = tg_doc(PDF_PATH, "PDF Report - DateMeUp 30-Round Test")
print(f"PDF report: {sc} ok={ok} {desc}")

print("DONE")

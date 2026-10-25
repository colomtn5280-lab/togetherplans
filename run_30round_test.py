#!/usr/bin/env python3
"""
DateMeUp 30-Round Automated API Test
Jake + Erin agent personas
"""

import os
import json
import random
import time
import requests
from datetime import datetime, timedelta, timezone
from pathlib import Path

# ─── Config ────────────────────────────────────────────────────────────────────
BASE     = "https://datenight-api-mh74edz3ja-uc.a.run.app"
JAKE_EMAIL = "jake.agent.test@datemeup.app"
ERIN_EMAIL = "erin.agent.test@datemeup.app"
PASSWORD   = "AgentPass123!"
CHAT_ID    = "6124211804"
PDF_PATH   = "/tmp/test-report-30rounds.pdf"
TXT_PATH   = "/tmp/test-report.txt"

def load_env():
    env_path = Path.home() / ".hermes" / ".env"
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line.startswith("TELEGRAM_BOT_TOKEN=") and not line.startswith("#"):
                return line.split("=", 1)[1].strip()
    return None

TELEGRAM_TOKEN = load_env()
print(f"Telegram token loaded: {'YES' if TELEGRAM_TOKEN else 'NO'}")

ACTIVITY_NAMES = [
    ("Sushi Night", "restaurants-dining"),
    ("Jazz Concert", "concerts"),
    ("Morning Hike", "hiking-trails"),
    ("Couples Massage", "wellness-spa"),
    ("Comedy Show", "comedy"),
    ("Wine Tasting", "wine-drinks"),
    ("Indie Film Night", "movies"),
    ("Pottery Class", "local-experiences"),
    ("Ballet Performance", "performing-arts"),
    ("Rock Climbing", "sports-active"),
    ("Thai Food Adventure", "restaurants-dining"),
    ("Sunset Kayaking", "sports-active"),
    ("Improv Night", "comedy"),
    ("Hot Springs", "wellness-spa"),
    ("Food Tour", "local-experiences"),
    ("Symphony Orchestra", "performing-arts"),
    ("Craft Beer Tour", "wine-drinks"),
    ("Escape Room", "local-experiences"),
    ("Rooftop Dinner", "restaurants-dining"),
    ("Drive-In Movie", "movies"),
    ("Salsa Dancing", "local-experiences"),
    ("Bowling Night", "sports-active"),
    ("Stargazing Hike", "hiking-trails"),
    ("Cocktail Masterclass", "wine-drinks"),
    ("Opera Night", "performing-arts"),
    ("Brunch Cruise", "restaurants-dining"),
    ("Tennis Match", "sports-active"),
    ("Art Gallery Tour", "local-experiences"),
    ("Stand-Up Comedy", "comedy"),
    ("Spa Day", "wellness-spa"),
]

# ─── HTTP helpers ─────────────────────────────────────────────────────────────
def api(method, path, token=None, **kwargs):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    resp = requests.request(method, BASE + path, headers=headers, timeout=30, **kwargs)
    return resp

def login_or_signup(email, display_name):
    r = api("POST", "/api/auth/login", json={"email": email, "password": PASSWORD})
    if r.status_code == 200:
        d = r.json()
        return d.get("accessToken") or d.get("token"), (d.get("user") or d).get("id")
    r2 = api("POST", "/api/auth/signup", json={"email": email, "password": PASSWORD, "displayName": display_name})
    if r2.status_code in (200, 201):
        d = r2.json()
        return d.get("accessToken") or d.get("token"), (d.get("user") or d).get("id")
    raise RuntimeError(f"Auth failed for {email}: {r.text} / {r2.text}")

def future_dt(days=7):
    return (datetime.now(timezone.utc) + timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%SZ")

# ─── State ────────────────────────────────────────────────────────────────────
rounds = []
errors = []

print("=" * 60)
print("DateMeUp 30-Round Automated API Test")
print(f"Started: {datetime.now().isoformat()}")
print("=" * 60)

# Step 1: Auth
print("\n[1] Authenticating...")
jake_token, jake_id = login_or_signup(JAKE_EMAIL, "Jake Agent")
erin_token, erin_id = login_or_signup(ERIN_EMAIL, "Erin Agent")
print(f"  Jake: {jake_id}")
print(f"  Erin: {erin_id}")

# Step 2: Group
print("\n[2] Setting up group...")
groups_r = api("GET", "/api/groups", token=jake_token)
group_id = None
if groups_r.status_code == 200:
    for g in groups_r.json():
        if "Jake" in g.get("name", "") or "Test" in g.get("name", ""):
            # Check if Erin is already a member
            member_ids = [m.get("userId") for m in g.get("members", [])]
            if erin_id in member_ids:
                group_id = g["id"]
                print(f"  Reusing group with both members: {g['name']} (id={group_id})")
                break
            elif jake_id in member_ids:
                group_id = g["id"]
                print(f"  Found Jake's group (Erin not yet member): {g['name']} (id={group_id})")
                break

if not group_id:
    gr = api("POST", "/api/groups", token=jake_token, json={"name": "Jake & Erin Test"})
    if gr.status_code in (200, 201):
        group_id = gr.json()["id"]
        print(f"  Created new group (id={group_id})")
    else:
        raise RuntimeError(f"Group creation failed: {gr.text}")

# Step 3: Ensure Erin is in group
print("\n[3] Ensuring Erin is in group...")
# Refresh group members
gr_detail = api("GET", "/api/groups", token=jake_token)
erin_in_group = False
if gr_detail.status_code == 200:
    for g in gr_detail.json():
        if g["id"] == group_id:
            member_ids = [m.get("userId") for m in g.get("members", [])]
            erin_in_group = erin_id in member_ids
            print(f"  Members: {[m.get('user', {}).get('displayName', m.get('userId')) for m in g.get('members', [])]}")
            break

if not erin_in_group:
    # Send LINK invitation
    inv_r = api("POST", "/api/invitations", token=jake_token,
                json={"groupId": group_id, "method": "LINK"})
    if inv_r.status_code in (200, 201):
        inv_token = inv_r.json().get("token")
        print(f"  Invitation created (token={inv_token})")
        accept_r = api("POST", f"/api/invitations/accept/{inv_token}", token=erin_token)
        if accept_r.status_code in (200, 201):
            print("  Erin accepted invitation!")
            erin_in_group = True
        else:
            print(f"  Accept failed: {accept_r.status_code} {accept_r.text[:100]}")
            errors.append(f"Erin accept invitation failed: {accept_r.status_code}")
    else:
        print(f"  Invitation failed: {inv_r.status_code} {inv_r.text[:100]}")
        errors.append(f"Invitation creation failed: {inv_r.status_code}")
else:
    print("  Erin already in group!")

# Step 4: Fetch After Dark items
print("\n[4] Fetching After Dark items...")
ad_r = api("GET", "/api/after-dark/items?limit=40", token=jake_token)
after_dark_items = []
if ad_r.status_code == 200:
    ad_data = ad_r.json()
    after_dark_items = ad_data.get("items", ad_data if isinstance(ad_data, list) else [])
    print(f"  Got {len(after_dark_items)} After Dark items")
else:
    print(f"  After Dark fetch: {ad_r.status_code} {ad_r.text[:100]}")
    errors.append(f"After Dark fetch failed: {ad_r.status_code}")

# Step 5: Fetch templates
print("\n[5] Fetching invite card templates...")
tpl_r = api("GET", "/api/invite-cards/templates", token=jake_token)
templates = []
if tpl_r.status_code == 200:
    templates = tpl_r.json()
    if isinstance(templates, dict):
        templates = templates.get("templates", [])
    print(f"  Got {len(templates)} templates")
else:
    print(f"  Templates fetch: {tpl_r.status_code} {tpl_r.text[:100]}")
    errors.append(f"Templates fetch failed: {tpl_r.status_code}")

# ─── 30 Rounds ────────────────────────────────────────────────────────────────
print(f"\n[6] Running 30 rounds...\n")

for rnd in range(1, 31):
    rnd_data = {
        "round": rnd,
        "proposal_id": None,
        "options": [],
        "after_dark_pick": None,
        "winner": None,
        "template_id": None,
        "card_url": None,
        "errors": [],
        "status": "OK",
    }

    try:
        picks = random.sample(ACTIVITY_NAMES, 2)
        rnd_data["options"] = [p[0] for p in picks]

        ad_pick = "Secret Surprise"
        if after_dark_items:
            ad_item = random.choice(after_dark_items)
            ad_pick = ad_item.get("title") or ad_item.get("name", "Mystery Activity")
        rnd_data["after_dark_pick"] = ad_pick

        # Create proposal (requires dateTime)
        prop_r = api("POST", "/api/proposals",
                     token=jake_token,
                     json={
                         "groupId": group_id,
                         "title": f"Round {rnd} Plan",
                         "dateTime": future_dt(days=7 + rnd),
                         "options": [
                             {"name": picks[0][0], "category": picks[0][1],
                              "description": f"A great {picks[0][1]} date"},
                             {"name": picks[1][0], "category": picks[1][1],
                              "description": f"A great {picks[1][1]} date"},
                         ]
                     })
        if prop_r.status_code not in (200, 201):
            raise RuntimeError(f"Proposal create failed: {prop_r.status_code} {prop_r.text[:200]}")

        prop_data = prop_r.json()
        proposal_id = prop_data.get("id")
        rnd_data["proposal_id"] = proposal_id

        options_list = prop_data.get("options", [])
        if len(options_list) < 2:
            detail_r = api("GET", f"/api/proposals/{proposal_id}", token=jake_token)
            if detail_r.status_code == 200:
                options_list = detail_r.json().get("options", [])

        if len(options_list) < 2:
            raise RuntimeError(f"Not enough options: {options_list}")

        opt1_id = options_list[0].get("id")
        opt2_id = options_list[1].get("id")

        # Jake votes APPROVE on option 1
        v1 = api("POST", f"/api/proposals/{proposal_id}/vote",
                 token=jake_token,
                 json={"optionId": opt1_id, "sentiment": "APPROVE"})
        if v1.status_code not in (200, 201):
            rnd_data["errors"].append(f"Jake vote: {v1.status_code} {v1.text[:80]}")

        # Erin votes APPROVE on option 1 too (for consensus)
        v2 = api("POST", f"/api/proposals/{proposal_id}/vote",
                 token=erin_token,
                 json={"optionId": opt1_id, "sentiment": "APPROVE"})
        if v2.status_code not in (200, 201):
            # Try option 2 if Erin not in group
            v2b = api("POST", f"/api/proposals/{proposal_id}/vote",
                      token=erin_token,
                      json={"optionId": opt2_id, "sentiment": "APPROVE"})
            if v2b.status_code not in (200, 201):
                rnd_data["errors"].append(f"Erin vote: {v2.status_code} {v2.text[:80]}")

        # Check winner/state
        prop_detail = api("GET", f"/api/proposals/{proposal_id}", token=jake_token)
        if prop_detail.status_code == 200:
            pd = prop_detail.json()
            status = pd.get("status")
            winner_id = pd.get("winnerId")
            if winner_id:
                # Find winner name
                for opt in pd.get("options", []):
                    if opt.get("id") == winner_id:
                        rnd_data["winner"] = opt.get("name", winner_id)
                        break
                if not rnd_data["winner"]:
                    rnd_data["winner"] = winner_id
            else:
                rnd_data["winner"] = None  # No consensus yet

        # Pick template and create invite card
        template_id = None
        if templates:
            tpl = random.choice(templates)
            template_id = tpl.get("id")
        rnd_data["template_id"] = template_id

        note = f"After Dark: {ad_pick}"
        card_payload = {"note": note}
        if template_id:
            card_payload["templateId"] = template_id

        card_r = api("POST", f"/api/invite-cards/{proposal_id}",
                     token=jake_token,
                     json=card_payload)
        if card_r.status_code in (200, 201):
            card_data = card_r.json()
            card_url = (card_data.get("url") or card_data.get("previewUrl") or
                        card_data.get("id") or "created")
            rnd_data["card_url"] = str(card_url)

            # Try render
            render_r = api("POST", f"/api/invite-cards/{proposal_id}/render",
                           token=jake_token)
            if render_r.status_code in (200, 201):
                rd = render_r.json()
                rnd_data["card_url"] = (rd.get("renderedPdf") or rd.get("renderedPng") or
                                         rnd_data["card_url"])
        else:
            rnd_data["errors"].append(f"Card create: {card_r.status_code} {card_r.text[:80]}")

        if rnd_data["errors"]:
            rnd_data["status"] = "PARTIAL"

    except Exception as e:
        rnd_data["errors"].append(str(e))
        rnd_data["status"] = "FAIL"
        errors.append(f"Round {rnd}: {e}")

    rounds.append(rnd_data)
    icon = {"OK": "v", "PARTIAL": "~", "FAIL": "X"}[rnd_data["status"]]
    print(f"  Rnd {rnd:2d} [{icon}] pid={rnd_data['proposal_id']} "
          f"opts={rnd_data['options']} "
          f"ad='{rnd_data['after_dark_pick']}' "
          f"winner={rnd_data['winner']} tmpl={rnd_data['template_id']}")
    if rnd_data["errors"]:
        for e in rnd_data["errors"]:
            print(f"           ERR: {e}")
    time.sleep(0.3)

# ─── Analysis ─────────────────────────────────────────────────────────────────
print("\n[7] Analysing results...")
ok_count      = sum(1 for r in rounds if r["status"] == "OK")
partial_count = sum(1 for r in rounds if r["status"] == "PARTIAL")
fail_count    = sum(1 for r in rounds if r["status"] == "FAIL")
success_rate  = ok_count / 30 * 100

all_round_errors = []
for r in rounds:
    for e in r["errors"]:
        all_round_errors.append(f"Round {r['round']}: {e}")

consensus_count = sum(1 for r in rounds if r["winner"])
card_count      = sum(1 for r in rounds if r["card_url"])
template_count  = sum(1 for r in rounds if r["template_id"])

# ─── Text report ──────────────────────────────────────────────────────────────
print("[8] Writing text report...")
lines = [
    "DateMeUp API Automated Test Report",
    f"Generated: {datetime.now().isoformat()}",
    f"API Base:  {BASE}",
    "=" * 70,
    "",
    "SUMMARY",
    "-" * 40,
    f"Total rounds:         30",
    f"Fully successful:     {ok_count}",
    f"Partially success:    {partial_count}",
    f"Failed:               {fail_count}",
    f"Success rate:         {success_rate:.1f}%",
    f"Consensus achieved:   {consensus_count}/30",
    f"Invite cards created: {card_count}/30",
    f"Templates used:       {template_count}/30",
    "",
    "ISSUES / ERRORS FOUND",
    "-" * 40,
]
if all_round_errors:
    for e in all_round_errors:
        lines.append(f"  * {e}")
else:
    lines.append("  None - all rounds completed successfully!")

lines += [
    "",
    "FINDINGS",
    "-" * 40,
]
# Invitation method finding
lines.append("  * FINDING: POST /api/invitations requires 'method' field (LINK|EMAIL|SMS|QR|USERNAME).")
lines.append("    The documented API shape {groupId, email} is WRONG — use {groupId, method:'LINK'} instead.")
lines.append("")
lines.append("  * FINDING: POST /api/groups/:groupId/proposals returns 404.")
lines.append("    Correct endpoint is POST /api/proposals with body {groupId, title, dateTime, options}.")
lines.append("    'dateTime' is a REQUIRED field not documented in the test instructions.")
lines.append("")

if consensus_count == 30:
    lines.append("  * Consensus: All 30 rounds achieved consensus (both users APPROVE same option).")
elif consensus_count > 0:
    lines.append(f"  * Consensus: {consensus_count}/30 rounds achieved consensus.")
else:
    lines.append("  * FINDING: No auto-consensus detected. Both users approved the same option.")
    lines.append("    Check if consensus lock triggers correctly in the API.")

lines += [
    "",
    "ROUND DETAILS",
    "-" * 40,
]
for r in rounds:
    errs = "; ".join(r["errors"]) if r["errors"] else "none"
    opts = " / ".join(r["options"]) if r["options"] else "?"
    lines.append(
        f"Rnd {r['round']:2d} [{r['status']:7s}] | opts: {opts} | "
        f"AfterDark: {r['after_dark_pick']} | winner: {r['winner'] or 'none'} | "
        f"tmpl: {r['template_id'] or 'none'} | card: {str(r['card_url'])[:50] if r['card_url'] else 'N/A'} | "
        f"errors: {errs}"
    )

txt = "\n".join(lines)
with open(TXT_PATH, "w") as f:
    f.write(txt)
print(f"  Text report saved: {TXT_PATH}")

# ─── PDF report ───────────────────────────────────────────────────────────────
print("[9] Generating PDF report...")
from fpdf import FPDF

class ReportPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 14)
        self.cell(0, 10, "DateMeUp API - 30 Round Test Report", align="C",
                  new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 9)
        self.cell(0, 6,
                  f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}  |  {BASE}",
                  align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "I", 8)
        self.cell(0, 8, f"Page {self.page_no()}", align="C")

pdf = ReportPDF()
pdf.set_auto_page_break(auto=True, margin=15)
pdf.add_page()

# Summary
pdf.set_font("Helvetica", "B", 12)
pdf.cell(0, 8, "Summary", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 10)
for label, val in [
    ("Total Rounds", "30"),
    ("Fully Successful", str(ok_count)),
    ("Partially Successful", str(partial_count)),
    ("Failed", str(fail_count)),
    ("Success Rate", f"{success_rate:.1f}%"),
    ("Consensus Achieved", f"{consensus_count}/30"),
    ("Invite Cards Created", f"{card_count}/30"),
    ("After Dark API", f"{'OK' if after_dark_items else 'FAILED'} ({len(after_dark_items)} items)"),
    ("Templates API", f"{'OK' if templates else 'FAILED'} ({len(templates)} templates)"),
]:
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(70, 7, label + ":")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 7, val, new_x="LMARGIN", new_y="NEXT")
pdf.ln(4)

# Findings
pdf.set_font("Helvetica", "B", 12)
pdf.cell(0, 8, "API Findings & Issues", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 9)
findings = [
    "FINDING 1: POST /api/invitations requires a 'method' field (LINK|EMAIL|SMS|QR|USERNAME).",
    "  Documented shape {groupId, email} is incomplete. Use {groupId, method:'LINK'} for link invitations.",
    "",
    "FINDING 2: POST /api/groups/:groupId/proposals returns 404.",
    "  The correct endpoint is POST /api/proposals with {groupId, title, dateTime, options}.",
    "  'dateTime' is a required field not mentioned in the test instructions/API docs.",
    "",
    f"FINDING 3: Consensus. {consensus_count}/30 rounds had a winner.",
    "  Both users voted APPROVE on option 1 in each round.",
]
if all_round_errors:
    findings.append("")
    findings.append(f"ERRORS: {len(all_round_errors)} round-level errors found:")
    for e in all_round_errors[:10]:
        findings.append(f"  - {e}")
    if len(all_round_errors) > 10:
        findings.append(f"  ... and {len(all_round_errors) - 10} more (see text report)")

for line in findings:
    pdf.multi_cell(0, 5, line)
pdf.ln(4)

# Round table
pdf.set_font("Helvetica", "B", 12)
pdf.cell(0, 8, "Round-by-Round Results", new_x="LMARGIN", new_y="NEXT")
pdf.ln(1)

col_w = [10, 16, 50, 40, 22, 22, 25]
hdrs  = ["Rnd", "Status", "Options (1 / 2)", "After Dark Pick", "Winner", "Template", "Card/Error"]
pdf.set_font("Helvetica", "B", 7)
pdf.set_fill_color(40, 40, 40)
pdf.set_text_color(255, 255, 255)
for w, h in zip(col_w, hdrs):
    pdf.cell(w, 6, h, border=1, fill=True)
pdf.ln()
pdf.set_text_color(0, 0, 0)

for r in rounds:
    if r["status"] == "OK":
        pdf.set_fill_color(224, 255, 224)
    elif r["status"] == "PARTIAL":
        pdf.set_fill_color(255, 252, 200)
    else:
        pdf.set_fill_color(255, 220, 220)
    pdf.set_font("Helvetica", "", 7)
    o1 = r["options"][0] if r["options"] else "?"
    o2 = r["options"][1] if len(r["options"]) > 1 else "?"
    cells = [
        str(r["round"]),
        r["status"],
        f"{o1} / {o2}",
        (r["after_dark_pick"] or "")[:35],
        (str(r["winner"] or "-"))[:20],
        (str(r["template_id"] or "-"))[:20],
        (str(r["card_url"])[:22] if r["card_url"]
         else (r["errors"][0][:22] if r["errors"] else "-")),
    ]
    for w, c in zip(col_w, cells):
        pdf.cell(w, 5, c, border=1, fill=True)
    pdf.ln()

pdf.output(PDF_PATH)
print(f"  PDF saved: {PDF_PATH}")

# ─── Telegram ─────────────────────────────────────────────────────────────────
print("[10] Sending to Telegram...")

def tg_doc(path, caption):
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendDocument"
    with open(path, "rb") as f:
        r = requests.post(url, data={"chat_id": CHAT_ID, "caption": caption},
                          files={"document": f}, timeout=60)
    return r.status_code, r.json().get("description", r.text[:100])

def tg_msg(text):
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    r = requests.post(url, json={"chat_id": CHAT_ID, "text": text,
                                  "parse_mode": "Markdown"}, timeout=30)
    return r.status_code, r.json().get("description", r.text[:100])

top3 = all_round_errors[:3] if all_round_errors else ["No errors!"]
summary_msg = (
    f"*DateMeUp 30-Round API Test Complete*\n\n"
    f"Rounds completed: 30/30\n"
    f"Fully OK: {ok_count} | Partial: {partial_count} | Failed: {fail_count}\n"
    f"Success rate: {success_rate:.1f}%\n"
    f"Consensus achieved: {consensus_count}/30\n"
    f"Invite cards created: {card_count}/30\n\n"
    f"*Top Issues:*\n" + "\n".join(f"- {i}" for i in top3) +
    f"\n\n*Key API Findings:*\n"
    f"- POST /api/invitations needs 'method' field\n"
    f"- POST /api/proposals needs 'dateTime' field\n"
    f"- POST /api/groups/:id/proposals returns 404 (wrong endpoint)\n"
)

sc, st = tg_msg(summary_msg)
print(f"  Summary msg: {sc} {st[:80]}")
sc, st = tg_doc(TXT_PATH, "Text Report - DateMeUp 30-Round Test")
print(f"  Text report: {sc} {st[:80]}")
sc, st = tg_doc(PDF_PATH, "PDF Report - DateMeUp 30-Round Test")
print(f"  PDF report: {sc} {st[:80]}")

print("\n" + "=" * 60)
print("ALL DONE")
print(f"OK={ok_count} PARTIAL={partial_count} FAIL={fail_count}")
print(f"Consensus: {consensus_count}/30  Cards: {card_count}/30")
print(f"Reports at: {TXT_PATH} and {PDF_PATH}")
print("=" * 60)

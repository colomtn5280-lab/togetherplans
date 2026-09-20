#!/usr/bin/env bash
# API Smoke Test Suite — TogetherPlans / DateNight
# Tests the live backend at https://api.togetherplans.app

BASE_URL="${API_BASE:-https://api.togetherplans.app}"
TS=$(date +%s)
EMAIL="smoke-${TS}@togetherplans-test.io"
PASSWORD="TestPass123!"
PASS_COUNT=0
FAIL_COUNT=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}[PASS]${NC} $1"; PASS_COUNT=$((PASS_COUNT+1)); }
fail() { echo -e "${RED}[FAIL]${NC} $1"; FAIL_COUNT=$((FAIL_COUNT+1)); }
info() { echo -e "${YELLOW}[INFO]${NC} $1"; }

echo "============================================"
echo " DateNight API Smoke Test Suite"
echo " Base: $BASE_URL"
echo " Email: $EMAIL"
echo " Time: $(date)"
echo "============================================"
echo ""

# ──────────────────────────────────────────────────────────
# Step 1: Sign Up
# ──────────────────────────────────────────────────────────
echo "--- Step 1: POST /api/auth/signup ---"
SIGNUP_RESP=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"firstName\":\"Smoke\",\"lastName\":\"Test\"}")
echo "Response: $SIGNUP_RESP"

ACCESS_TOKEN=$(echo "$SIGNUP_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('accessToken') or d.get('token',''))" 2>/dev/null)
REFRESH_TOKEN=$(echo "$SIGNUP_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('refreshToken',''))" 2>/dev/null)
USER_ID=$(echo "$SIGNUP_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); u=d.get('user',{}); print(u.get('id',''))" 2>/dev/null)

if [ -n "$ACCESS_TOKEN" ] && [ -n "$REFRESH_TOKEN" ] && [ -n "$USER_ID" ]; then
  pass "Step 1: Signup — got accessToken, refreshToken, user.id=$USER_ID"
else
  fail "Step 1: Signup — missing tokens or user id. accessToken='$ACCESS_TOKEN' refreshToken='$REFRESH_TOKEN' userId='$USER_ID'"
fi
echo ""

# ──────────────────────────────────────────────────────────
# Step 2: Login
# ──────────────────────────────────────────────────────────
echo "--- Step 2: POST /api/auth/login ---"
LOGIN_RESP=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
echo "Response: $LOGIN_RESP"

LOGIN_AT=$(echo "$LOGIN_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('accessToken') or d.get('token',''))" 2>/dev/null)
LOGIN_RT=$(echo "$LOGIN_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('refreshToken',''))" 2>/dev/null)

if [ -n "$LOGIN_AT" ] && [ -n "$LOGIN_RT" ]; then
  pass "Step 2: Login — got accessToken + refreshToken"
  ACCESS_TOKEN="$LOGIN_AT"
  REFRESH_TOKEN="$LOGIN_RT"
else
  fail "Step 2: Login — missing tokens. at='$LOGIN_AT' rt='$LOGIN_RT'"
fi
echo ""

# ──────────────────────────────────────────────────────────
# Step 3: Refresh token
# ──────────────────────────────────────────────────────────
echo "--- Step 3: POST /api/auth/refresh ---"
REFRESH_RESP=$(curl -s -X POST "$BASE_URL/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")
echo "Response: $REFRESH_RESP"

NEW_AT=$(echo "$REFRESH_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('accessToken') or d.get('token',''))" 2>/dev/null)
NEW_RT=$(echo "$REFRESH_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('refreshToken',''))" 2>/dev/null)

if [ -n "$NEW_AT" ]; then
  pass "Step 3: Token refresh — got new accessToken"
  ACCESS_TOKEN="$NEW_AT"
  [ -n "$NEW_RT" ] && REFRESH_TOKEN="$NEW_RT"
else
  fail "Step 3: Token refresh — no new accessToken. Response: $REFRESH_RESP"
fi
echo ""

# ──────────────────────────────────────────────────────────
# Step 4: GET /api/auth/me
# ──────────────────────────────────────────────────────────
echo "--- Step 4: GET /api/auth/me ---"
ME_RESP=$(curl -s -X GET "$BASE_URL/api/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "Response: $ME_RESP"

ME_ID=$(echo "$ME_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id') or d.get('user',{}).get('id',''))" 2>/dev/null)

if [ -n "$ME_ID" ]; then
  pass "Step 4: GET /api/auth/me — user id=$ME_ID"
else
  fail "Step 4: GET /api/auth/me — no user id in response"
fi
echo ""

# ──────────────────────────────────────────────────────────
# Step 5: POST /api/groups
# ──────────────────────────────────────────────────────────
echo "--- Step 5: POST /api/groups ---"
GROUP_RESP=$(curl -s -X POST "$BASE_URL/api/groups" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Smoke Test Group","groupType":"COUPLE"}')
echo "Response: $GROUP_RESP"

GROUP_ID=$(echo "$GROUP_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id') or d.get('group',{}).get('id',''))" 2>/dev/null)

if [ -n "$GROUP_ID" ]; then
  pass "Step 5: Create group — id=$GROUP_ID"
else
  fail "Step 5: Create group — no id in response"
fi
echo ""

# ──────────────────────────────────────────────────────────
# Step 6: GET /api/groups
# ──────────────────────────────────────────────────────────
echo "--- Step 6: GET /api/groups ---"
GROUPS_RESP=$(curl -s -X GET "$BASE_URL/api/groups" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "Response: $GROUPS_RESP"

FOUND=$(echo "$GROUPS_RESP" | python3 -c "
import sys,json
d=json.load(sys.stdin)
groups = d if isinstance(d, list) else d.get('groups', [])
ids = [g.get('id') for g in groups]
print('YES' if '$GROUP_ID' in ids else 'NO')
" 2>/dev/null)

if [ "$FOUND" = "YES" ]; then
  pass "Step 6: GET /api/groups — group $GROUP_ID found in list"
else
  fail "Step 6: GET /api/groups — group $GROUP_ID not found in response"
fi
echo ""

# ──────────────────────────────────────────────────────────
# Step 7: POST /api/proposals
# ──────────────────────────────────────────────────────────
echo "--- Step 7: POST /api/proposals ---"
TOMORROW=$(python3 -c "from datetime import datetime, timedelta; print((datetime.utcnow()+timedelta(days=1)).strftime('%Y-%m-%dT%H:%M:%SZ'))")
PROPOSAL_RESP=$(curl -s -X POST "$BASE_URL/api/proposals" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"groupId\": \"$GROUP_ID\",
    \"title\": \"Smoke Proposal\",
    \"dateTime\": \"$TOMORROW\",
    \"options\": [
      {\"name\": \"Option A\", \"category\": \"Dining\"},
      {\"name\": \"Option B\", \"category\": \"Movies\"},
      {\"name\": \"Option C\", \"category\": \"Outdoors\"}
    ]
  }")
echo "Response: $PROPOSAL_RESP"

PROPOSAL_ID=$(echo "$PROPOSAL_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id') or d.get('proposal',{}).get('id',''))" 2>/dev/null)
OPT_COUNT=$(echo "$PROPOSAL_RESP" | python3 -c "
import sys,json
d=json.load(sys.stdin)
opts = d.get('options') or d.get('proposal',{}).get('options',[])
print(len(opts))
" 2>/dev/null)

if [ -n "$PROPOSAL_ID" ] && [ "$OPT_COUNT" = "3" ]; then
  pass "Step 7: Create proposal — id=$PROPOSAL_ID, options=$OPT_COUNT"
elif [ -n "$PROPOSAL_ID" ]; then
  fail "Step 7: Create proposal — id=$PROPOSAL_ID but options=$OPT_COUNT (expected 3)"
else
  fail "Step 7: Create proposal — no id in response"
fi
echo ""

# ──────────────────────────────────────────────────────────
# Step 8: GET /api/proposals/:id
# ──────────────────────────────────────────────────────────
echo "--- Step 8: GET /api/proposals/$PROPOSAL_ID ---"
GET_PROP_RESP=$(curl -s -X GET "$BASE_URL/api/proposals/$PROPOSAL_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "Response: $GET_PROP_RESP"

HAS_OPTIONS=$(echo "$GET_PROP_RESP" | python3 -c "
import sys,json
d=json.load(sys.stdin)
opts = d.get('options',[])
print('YES' if len(opts)>=3 else 'NO')
" 2>/dev/null)

HAS_TALLY=$(echo "$GET_PROP_RESP" | python3 -c "
import sys,json
d=json.load(sys.stdin)
# tally could be a field on options or on proposal
has_tally = 'tally' in d or any('votes' in o or 'voteCount' in o for o in d.get('options',[]))
print('YES' if has_tally else 'NO')
" 2>/dev/null)

OPTION_ID=$(echo "$GET_PROP_RESP" | python3 -c "
import sys,json
d=json.load(sys.stdin)
opts = d.get('options',[])
print(opts[0].get('id','') if opts else '')
" 2>/dev/null)

if [ "$HAS_OPTIONS" = "YES" ]; then
  pass "Step 8: GET proposal — has options, tally=$HAS_TALLY, first optionId=$OPTION_ID"
else
  fail "Step 8: GET proposal — options missing or <3"
fi
echo ""

# ──────────────────────────────────────────────────────────
# Step 9: POST /api/proposals/:id/vote
# ──────────────────────────────────────────────────────────
echo "--- Step 9: POST /api/proposals/$PROPOSAL_ID/vote ---"
VOTE_RESP=$(curl -s -X POST "$BASE_URL/api/proposals/$PROPOSAL_ID/vote" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"optionId\": \"$OPTION_ID\"}")
echo "Response: $VOTE_RESP"

VOTE_OK=$(echo "$VOTE_RESP" | python3 -c "
import sys,json
d=json.load(sys.stdin)
# Accept if we get back a vote/proposal object or a success message
has_id = 'id' in d
has_vote = 'vote' in d
has_status = d.get('status') in ('DECIDED','PENDING','OPEN','ACTIVE')
has_success = d.get('success') == True or d.get('message','').lower().find('vote') >= 0
has_votes = 'votes' in d or 'voted' in d or 'tally' in d
print('YES' if (has_id or has_vote or has_status or has_success or has_votes) else 'NO')
" 2>/dev/null)

PROPOSAL_DECIDED=$(echo "$VOTE_RESP" | python3 -c "
import sys,json
d=json.load(sys.stdin)
status = d.get('status') or d.get('proposal',{}).get('status','')
print('YES' if status == 'DECIDED' else 'NO')
" 2>/dev/null)

if [ "$VOTE_OK" = "YES" ]; then
  if [ "$PROPOSAL_DECIDED" = "YES" ]; then
    pass "Step 9: Vote recorded — proposal auto-DECIDED (single-member majority)"
  else
    pass "Step 9: Vote recorded"
  fi
else
  fail "Step 9: Vote — unexpected response: $VOTE_RESP"
fi
echo ""

# ──────────────────────────────────────────────────────────
# Step 10: DELETE /api/proposals/:id/votes
# ──────────────────────────────────────────────────────────
echo "--- Step 10: DELETE /api/proposals/$PROPOSAL_ID/votes ---"
RETRACT_RESP=$(curl -s -o /tmp/retract_body -w "%{http_code}" -X DELETE "$BASE_URL/api/proposals/$PROPOSAL_ID/votes" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
RETRACT_BODY=$(cat /tmp/retract_body)
echo "HTTP Status: $RETRACT_RESP"
echo "Response: $RETRACT_BODY"

if [ "$RETRACT_RESP" = "200" ] || [ "$RETRACT_RESP" = "204" ]; then
  pass "Step 10: Vote retracted (HTTP $RETRACT_RESP)"
elif [ "$RETRACT_RESP" = "409" ]; then
  pass "Step 10: Vote retraction blocked — proposal DECIDED (409 is acceptable, single-member group)"
elif [ "$RETRACT_RESP" = "400" ]; then
  # Some implementations return 400 when proposal is decided
  info "Step 10: Got HTTP 400 — checking if proposal is DECIDED"
  IS_DECIDED=$(echo "$RETRACT_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print('YES' if 'decided' in str(d).lower() or 'closed' in str(d).lower() else 'NO')" 2>/dev/null)
  if [ "$IS_DECIDED" = "YES" ]; then
    pass "Step 10: Vote retraction blocked — proposal DECIDED (400 acceptable, single-member group)"
  else
    fail "Step 10: Vote retraction — HTTP 400 without clear reason: $RETRACT_BODY"
  fi
else
  fail "Step 10: Vote retraction — unexpected HTTP $RETRACT_RESP: $RETRACT_BODY"
fi
echo ""

# ──────────────────────────────────────────────────────────
# Step 11: POST /api/invitations
# ──────────────────────────────────────────────────────────
echo "--- Step 11: POST /api/invitations ---"
INV_RESP=$(curl -s -X POST "$BASE_URL/api/invitations" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"groupId\": \"$GROUP_ID\", \"method\": \"LINK\"}")
echo "Response: $INV_RESP"

INV_TOKEN=$(echo "$INV_RESP" | python3 -c "
import sys,json
d=json.load(sys.stdin)
# token could be at top level or nested
t = d.get('token') or d.get('inviteToken') or d.get('invitation',{}).get('token','')
print(t)
" 2>/dev/null)

if [ -n "$INV_TOKEN" ]; then
  pass "Step 11: Create invitation — token=$INV_TOKEN"
else
  fail "Step 11: Create invitation — no token in response: $INV_RESP"
fi
echo ""

# ──────────────────────────────────────────────────────────
# Step 12: GET /api/invitations/:token
# ──────────────────────────────────────────────────────────
echo "--- Step 12: GET /api/invitations/$INV_TOKEN ---"
GET_INV_RESP=$(curl -s -X GET "$BASE_URL/api/invitations/$INV_TOKEN" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "Response: $GET_INV_RESP"

INV_GROUP=$(echo "$GET_INV_RESP" | python3 -c "
import sys,json
d=json.load(sys.stdin)
gid = d.get('groupId') or d.get('group',{}).get('id','') or d.get('invitation',{}).get('groupId','')
print(gid)
" 2>/dev/null)

if [ "$INV_GROUP" = "$GROUP_ID" ] || [ -n "$(echo "$GET_INV_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK' if '$GROUP_ID' in str(d) else '')" 2>/dev/null)" ]; then
  pass "Step 12: GET invitation — details confirmed"
else
  fail "Step 12: GET invitation — groupId mismatch or missing. got='$INV_GROUP' expected='$GROUP_ID'"
fi
echo ""

# ──────────────────────────────────────────────────────────
# Step 13: GET /api/suggestions
# ──────────────────────────────────────────────────────────
echo "--- Step 13: GET /api/suggestions?lat=39.74&lng=-104.99&radius=10 ---"
SUGG_RESP=$(curl -s -X GET "$BASE_URL/api/suggestions?lat=39.74&lng=-104.99&radius=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  --max-time 30)
echo "Response preview: $(echo "$SUGG_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d if isinstance(d,list) else d.get('suggestions',d.get('results',[])); print(f'count={len(items)}, first={items[0].get(\"name\",\"\") if items else \"none\"}')" 2>/dev/null)"

SUGG_COUNT=$(echo "$SUGG_RESP" | python3 -c "
import sys,json
d=json.load(sys.stdin)
items = d if isinstance(d, list) else d.get('suggestions', d.get('results', []))
print(len(items))
" 2>/dev/null)

if [ -n "$SUGG_COUNT" ] && [ "$SUGG_COUNT" -gt 20 ] 2>/dev/null; then
  pass "Step 13: GET suggestions — $SUGG_COUNT results (>20)"
elif [ -n "$SUGG_COUNT" ] && [ "$SUGG_COUNT" -gt 0 ] 2>/dev/null; then
  fail "Step 13: GET suggestions — only $SUGG_COUNT results (expected >20)"
else
  fail "Step 13: GET suggestions — no array found or 0 results. Response: $(echo "$SUGG_RESP" | head -c 300)"
fi
echo ""

# ──────────────────────────────────────────────────────────
# Step 14: GET /api/notifications
# ──────────────────────────────────────────────────────────
echo "--- Step 14: GET /api/notifications ---"
NOTIF_RESP=$(curl -s -X GET "$BASE_URL/api/notifications" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
echo "Response: $NOTIF_RESP"

HAS_COUNT=$(echo "$NOTIF_RESP" | python3 -c "
import sys,json
d=json.load(sys.stdin)
has_count = 'count' in d or 'total' in d
has_notifs = 'notifications' in d or isinstance(d, list)
print('YES' if (has_count or has_notifs) else 'NO')
" 2>/dev/null)

if [ "$HAS_COUNT" = "YES" ]; then
  pass "Step 14: GET /api/notifications — response has count/notifications fields"
else
  fail "Step 14: GET /api/notifications — unexpected response: $NOTIF_RESP"
fi
echo ""

# ──────────────────────────────────────────────────────────
# Step 15: DELETE /api/auth/me (cleanup)
# ──────────────────────────────────────────────────────────
echo "--- Step 15: DELETE /api/auth/me ---"
DELETE_RESP=$(curl -s -o /tmp/delete_body -w "%{http_code}" -X DELETE "$BASE_URL/api/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
DELETE_BODY=$(cat /tmp/delete_body)
echo "HTTP Status: $DELETE_RESP"
echo "Response: $DELETE_BODY"

if [ "$DELETE_RESP" = "200" ] || [ "$DELETE_RESP" = "204" ] || [ "$DELETE_RESP" = "202" ]; then
  pass "Step 15: DELETE /api/auth/me — user deleted (HTTP $DELETE_RESP)"
else
  fail "Step 15: DELETE /api/auth/me — HTTP $DELETE_RESP: $DELETE_BODY"
fi
echo ""

# ──────────────────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────────────────
echo "============================================"
echo " RESULTS: $PASS_COUNT PASSED / $FAIL_COUNT FAILED"
echo "============================================"

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
else
  exit 0
fi

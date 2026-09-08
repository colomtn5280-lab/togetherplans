# TogetherPlans API — Developer Quick-Start

Get up and running with the TogetherPlans API in under 5 minutes.

**Base URL:** `https://api.togetherplans.app`

---

## Prerequisites

- `curl` (or any HTTP client)
- A terminal / shell with `TOKEN` variable support
- The API running at `https://api.togetherplans.app` (or `http://localhost:3000` for local development)

---

## Part 1 — Get a Token (3 steps)

### Step 1 — Register an account

```bash
curl -s -X POST https://api.togetherplans.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alex@example.com",
    "password": "supersecure123",
    "displayName": "Alex"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "...", "email": "alex@example.com", "displayName": "Alex" }
}
```

### Step 2 — Save your token

```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

> **Tip:** On subsequent sessions, log in instead of registering:
> ```bash
> export TOKEN=$(curl -s -X POST https://api.togetherplans.app/api/auth/login \
>   -H "Content-Type: application/json" \
>   -d '{"email":"alex@example.com","password":"supersecure123"}' \
>   | jq -r .token)
> ```

### Step 3 — Verify your identity

```bash
curl -s https://api.togetherplans.app/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "id": "b3e1c2d4-5678-4abc-9def-000000000001",
  "email": "alex@example.com",
  "displayName": "Alex",
  "latitude": null,
  "longitude": null
}
```

✅ You're authenticated. Tokens are valid for **7 days**.

---

## Part 2 — Create a Group and Invite Someone (5 steps)

### Step 1 — Create a group

```bash
export GROUP_ID=$(curl -s -X POST https://api.togetherplans.app/api/groups \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Weekend Crew"}' \
  | jq -r .id)

echo "Group ID: $GROUP_ID"
```

### Step 2 — Confirm the group was created

```bash
curl -s https://api.togetherplans.app/api/groups/$GROUP_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Step 3 — Create an email invitation

```bash
curl -s -X POST https://api.togetherplans.app/api/invitations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"groupId\": \"$GROUP_ID\",
    \"method\": \"EMAIL\",
    \"target\": \"friend@example.com\"
  }"
```

**Response includes an `inviteUrl` with the token:**
```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "inviteUrl": "/api/invitations/accept/550e8400-e29b-41d4-a716-446655440000",
  "expiresAt": "2026-09-11T12:00:00.000Z",
  "status": "PENDING"
}
```

> **Tip:** For a shareable link (no email), use `"method": "LINK"` and omit `target`. Share the full URL: `https://togetherplans.app/join/<token>`

### Step 4 — Share the invite link with your friend

Send them the full accept URL:
```
https://api.togetherplans.app/api/invitations/accept/550e8400-e29b-41d4-a716-446655440000
```

### Step 5 — Friend accepts the invitation (using their token)

```bash
# Friend authenticates first, then:
curl -s -X POST https://api.togetherplans.app/api/invitations/accept/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $FRIEND_TOKEN"
```

**Response:**
```json
{
  "id": "m2000000-...",
  "groupId": "c4f2a1b3-...",
  "userId": "...",
  "role": "MEMBER",
  "joinedAt": "2026-09-08T13:00:00.000Z"
}
```

✅ Your friend is now a group member.

---

## Part 3 — Create a Proposal and Vote (4 steps)

### Step 1 — Get activity suggestions (optional)

```bash
curl -s "https://api.togetherplans.app/api/proposals/suggestions/list?category=restaurant" \
  -H "Authorization: Bearer $TOKEN"
```

Use these suggestions to populate your proposal options.

### Step 2 — Create a proposal

```bash
export PROPOSAL_ID=$(curl -s -X POST https://api.togetherplans.app/api/proposals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"groupId\": \"$GROUP_ID\",
    \"title\": \"Saturday Night Out\",
    \"dateTime\": \"2026-09-13T19:00:00.000Z\",
    \"options\": [
      {\"name\": \"Sushi Palace\", \"category\": \"restaurant\", \"description\": \"Best omakase in town\"},
      {\"name\": \"Bowling Alley\", \"category\": \"activity\", \"description\": \"Classic competitive fun\"},
      {\"name\": \"Rooftop Bar\", \"category\": \"activity\", \"description\": \"City views and cocktails\"}
    ]
  }" | jq -r .id)

echo "Proposal ID: $PROPOSAL_ID"
```

> **Requirement:** Proposals need **3–5 options**. Each option requires `name` and `category`.

### Step 3 — Get the proposal (with vote tally)

```bash
curl -s https://api.togetherplans.app/api/proposals/$PROPOSAL_ID \
  -H "Authorization: Bearer $TOKEN"
```

The response includes a `tally` array showing vote counts and whether any option has reached majority consensus.

### Step 4 — Vote for an option

```bash
# Get the option ID from the proposal response
export OPTION_ID="opt00001-0000-0000-0000-000000000001"

curl -s -X POST https://api.togetherplans.app/api/proposals/$PROPOSAL_ID/vote \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"optionId\": \"$OPTION_ID\"}"
```

**Response:**
```json
{
  "vote": { "id": "...", "optionId": "...", "userId": "..." },
  "decided": false,
  "voteCount": 1,
  "memberCount": 2
}
```

When `decided: true`, the proposal status has been updated to `DECIDED` — you've reached consensus! 🎉

---

## Common Integration Patterns

### Polling for consensus

Poll `GET /api/proposals/:id` periodically and check the `status` field:
- `OPEN` → still voting
- `DECIDED` → consensus reached; check `tally` for the winning option (highest vote count)
- `COUNTERED` → a counter-proposal was submitted; fetch the new proposal ID from `counters[]`

```bash
# Simple poll loop (bash)
while true; do
  STATUS=$(curl -s https://api.togetherplans.app/api/proposals/$PROPOSAL_ID \
    -H "Authorization: Bearer $TOKEN" | jq -r .status)
  echo "Status: $STATUS"
  [ "$STATUS" != "OPEN" ] && break
  sleep 10
done
```

### Counter-proposals

When a member disagrees with a proposal, they can submit a counter:

```bash
curl -s -X POST https://api.togetherplans.app/api/proposals/$PROPOSAL_ID/counter \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Friday Instead?",
    "dateTime": "2026-09-12T20:00:00.000Z",
    "options": [
      {"name": "Taco Crawl", "category": "restaurant"},
      {"name": "Mini Golf", "category": "activity"},
      {"name": "Karaoke Room", "category": "activity"}
    ]
  }'
```

The original proposal becomes `COUNTERED`, and a new proposal is created with `parentId` linking back.

### Google OAuth flow

For mobile or web apps using Google Sign-In:

```bash
# 1. Client authenticates with Google and receives an idToken
# 2. Exchange it for a TogetherPlans JWT:
curl -s -X POST https://api.togetherplans.app/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken": "<google-id-token-from-client>"}'
```

If the Google email matches an existing password account, the accounts are linked automatically.

### List all groups and their proposals

```bash
# Get all groups
GROUPS=$(curl -s https://api.togetherplans.app/api/groups \
  -H "Authorization: Bearer $TOKEN")

# For each group, the full detail endpoint includes proposals
GROUP_ID=$(echo $GROUPS | jq -r '.[0].id')
curl -s https://api.togetherplans.app/api/groups/$GROUP_ID \
  -H "Authorization: Bearer $TOKEN" | jq .proposals
```

### Error handling

All errors return `{ "error": "<message>" }`. Always check the HTTP status code:

```bash
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST https://api.togetherplans.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "wrong@example.com", "password": "bad"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -1)

if [ "$HTTP_CODE" -ne 200 ]; then
  echo "Error $HTTP_CODE: $(echo $BODY | jq -r .error)"
fi
```

### Local development

```bash
# Run the API locally
cd /path/to/DateNight/backend
npm run dev

# Use http://localhost:3000 instead of the production URL
export API="http://localhost:3000"
curl $API/health
```

---

## Reference

- [Full API Reference](./API-REFERENCE.md) — every endpoint with all parameters and response shapes
- [Changelog](./CHANGELOG.md) — release history
- Support: [hello@togetherplans.app](mailto:hello@togetherplans.app)

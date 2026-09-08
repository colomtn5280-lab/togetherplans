# TogetherPlans API Reference

**Base URL:** `https://api.togetherplans.app`  
**Version:** 1.0.0  
**Content-Type:** `application/json`

---

## Overview

### Authentication

All protected endpoints require a JWT Bearer token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are returned by `/api/auth/register`, `/api/auth/login`, and `/api/auth/google`. They expire after **7 days** by default (configurable via `JWT_EXPIRES_IN` environment variable).

### Rate Limiting

A global rate limit of **300 requests per 15 minutes** applies to all endpoints. Rate-limit headers are included in every response:

| Header | Description |
|--------|-------------|
| `RateLimit-Limit` | Maximum requests in the window |
| `RateLimit-Remaining` | Remaining requests in the current window |
| `RateLimit-Reset` | Timestamp when the window resets |

When the limit is exceeded, the API responds with `429 Too Many Requests`.

### Error Format

All errors follow a consistent JSON structure:

```json
{
  "error": "Human-readable error message"
}
```

In non-production environments, a `message` field with additional detail may be included.

### Pagination

List endpoints (e.g., `GET /api/groups`) currently return all results for the authenticated user. Cursor-based pagination may be added in a future version.

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | OK |
| `201` | Created |
| `204` | No Content |
| `400` | Bad Request — missing or invalid parameters |
| `401` | Unauthorized — missing or invalid token |
| `403` | Forbidden — authenticated but not permitted |
| `404` | Not Found |
| `409` | Conflict — duplicate resource |
| `410` | Gone — resource expired |
| `429` | Too Many Requests |
| `500` | Internal Server Error |

---

## Authentication

### Register

Create a new user account and receive a JWT.

**`POST /api/auth/register`**

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | ✅ | Valid email address |
| `password` | `string` | ✅ | Minimum 8 characters |
| `displayName` | `string` | ✅ | Non-empty display name |

#### Success Response — `201 Created`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "b3e1c2d4-5678-4abc-9def-000000000001",
    "email": "alex@example.com",
    "displayName": "Alex"
  }
}
```

#### Error Codes

| Status | Error |
|--------|-------|
| `400` | `Valid email is required` |
| `400` | `Password must be at least 8 characters` |
| `400` | `displayName is required` |
| `409` | `Email already registered` |

#### cURL Example

```bash
curl -X POST https://api.togetherplans.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alex@example.com",
    "password": "hunter2secure",
    "displayName": "Alex"
  }'
```

---

### Login

Authenticate with email and password.

**`POST /api/auth/login`**

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | ✅ | Registered email address |
| `password` | `string` | ✅ | Account password |

#### Success Response — `200 OK`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "b3e1c2d4-5678-4abc-9def-000000000001",
    "email": "alex@example.com",
    "displayName": "Alex"
  }
}
```

#### Error Codes

| Status | Error |
|--------|-------|
| `400` | `email and password are required` |
| `401` | `Invalid credentials` |
| `401` | `This account uses social sign-in. Please sign in with Google.` |

#### cURL Example

```bash
curl -X POST https://api.togetherplans.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alex@example.com", "password": "hunter2secure"}'
```

---

### Google Sign-In

Exchange a Google ID token for a TogetherPlans JWT. Creates the account if it doesn't exist; links to an existing email account if the email matches.

**`POST /api/auth/google`**

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `idToken` | `string` | ✅ | Google ID token from the client SDK |

#### Success Response — `200 OK`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "b3e1c2d4-5678-4abc-9def-000000000001",
    "email": "alex@gmail.com",
    "displayName": "Alex Smith"
  }
}
```

#### Error Codes

| Status | Error |
|--------|-------|
| `400` | `idToken is required` |
| `401` | Google token verification failed |

#### cURL Example

```bash
curl -X POST https://api.togetherplans.app/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken": "<google-id-token>"}'
```

---

### Get Current User

Returns the profile of the authenticated user.

**`GET /api/auth/me`** 🔒 *Requires Auth*

#### Success Response — `200 OK`

```json
{
  "id": "b3e1c2d4-5678-4abc-9def-000000000001",
  "email": "alex@example.com",
  "displayName": "Alex",
  "latitude": 39.7392,
  "longitude": -104.9903
}
```

> `latitude` and `longitude` are `null` if not set.

#### Error Codes

| Status | Error |
|--------|-------|
| `401` | `Missing or invalid Authorization header` |
| `404` | `User not found` |

#### cURL Example

```bash
curl https://api.togetherplans.app/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

### Delete Account

Soft-deletes the authenticated user's account (GDPR erasure). The account is immediately inaccessible; hard deletion occurs within 30 days via a scheduled job.

**`DELETE /api/auth/me`** 🔒 *Requires Auth*

#### Success Response — `204 No Content`

#### Error Codes

| Status | Error |
|--------|-------|
| `401` | `Missing or invalid Authorization header` |

#### cURL Example

```bash
curl -X DELETE https://api.togetherplans.app/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## Groups

All group endpoints require authentication.

### Create Group

Creates a new group. The creator is automatically assigned the `OWNER` role.

**`POST /api/groups`** 🔒 *Requires Auth*

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | ✅ | Group name (non-empty) |

#### Success Response — `201 Created`

```json
{
  "id": "c4f2a1b3-0000-4abc-8def-111111111111",
  "name": "Weekend Crew",
  "createdAt": "2026-09-08T12:00:00.000Z",
  "updatedAt": "2026-09-08T12:00:00.000Z",
  "members": [
    {
      "id": "m1000000-0000-0000-0000-000000000001",
      "groupId": "c4f2a1b3-0000-4abc-8def-111111111111",
      "userId": "b3e1c2d4-5678-4abc-9def-000000000001",
      "role": "OWNER",
      "joinedAt": "2026-09-08T12:00:00.000Z"
    }
  ]
}
```

#### Error Codes

| Status | Error |
|--------|-------|
| `400` | `name is required` |
| `401` | `Missing or invalid Authorization header` |

#### cURL Example

```bash
curl -X POST https://api.togetherplans.app/api/groups \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Weekend Crew"}'
```

---

### List Groups

Returns all groups the authenticated user belongs to, including member details.

**`GET /api/groups`** 🔒 *Requires Auth*

#### Success Response — `200 OK`

```json
[
  {
    "id": "c4f2a1b3-0000-4abc-8def-111111111111",
    "name": "Weekend Crew",
    "createdAt": "2026-09-08T12:00:00.000Z",
    "updatedAt": "2026-09-08T12:00:00.000Z",
    "members": [
      {
        "id": "m1000000-0000-0000-0000-000000000001",
        "groupId": "c4f2a1b3-0000-4abc-8def-111111111111",
        "userId": "b3e1c2d4-5678-4abc-9def-000000000001",
        "role": "OWNER",
        "joinedAt": "2026-09-08T12:00:00.000Z",
        "user": {
          "id": "b3e1c2d4-5678-4abc-9def-000000000001",
          "displayName": "Alex"
        }
      }
    ]
  }
]
```

#### cURL Example

```bash
curl https://api.togetherplans.app/api/groups \
  -H "Authorization: Bearer $TOKEN"
```

---

### Get Group

Returns a single group with members and proposals. Only accessible to group members.

**`GET /api/groups/:id`** 🔒 *Requires Auth*

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` (UUID) | Group ID |

#### Success Response — `200 OK`

```json
{
  "id": "c4f2a1b3-0000-4abc-8def-111111111111",
  "name": "Weekend Crew",
  "createdAt": "2026-09-08T12:00:00.000Z",
  "updatedAt": "2026-09-08T12:00:00.000Z",
  "members": [
    {
      "id": "m1000000-0000-0000-0000-000000000001",
      "userId": "b3e1c2d4-5678-4abc-9def-000000000001",
      "role": "OWNER",
      "user": { "id": "b3e1c2d4-5678-4abc-9def-000000000001", "displayName": "Alex" }
    }
  ],
  "proposals": [
    {
      "id": "p0000001-0000-4abc-0000-000000000001",
      "title": "Saturday Night Out",
      "dateTime": "2026-09-13T19:00:00.000Z",
      "status": "OPEN",
      "createdAt": "2026-09-08T12:00:00.000Z"
    }
  ]
}
```

#### Error Codes

| Status | Error |
|--------|-------|
| `404` | `Group not found` |

#### cURL Example

```bash
curl https://api.togetherplans.app/api/groups/c4f2a1b3-0000-4abc-8def-111111111111 \
  -H "Authorization: Bearer $TOKEN"
```

---

## Invitations

All invitation endpoints require authentication.

### Create Invitation

Creates an invitation to a group. Caller must be a group member. For `EMAIL` method, an invitation email is sent to the target address.

**`POST /api/invitations`** 🔒 *Requires Auth*

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `groupId` | `string` (UUID) | ✅ | ID of the group to invite to |
| `method` | `string` (enum) | ✅ | One of: `LINK`, `EMAIL`, `SMS`, `QR`, `USERNAME` |
| `target` | `string` | Conditional | Required for `EMAIL`, `SMS`, `USERNAME` methods |

Invitations expire after **72 hours**.

#### Success Response — `201 Created`

```json
{
  "id": "inv00001-0000-4abc-0000-000000000001",
  "groupId": "c4f2a1b3-0000-4abc-8def-111111111111",
  "inviterId": "b3e1c2d4-5678-4abc-9def-000000000001",
  "method": "EMAIL",
  "target": "friend@example.com",
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING",
  "expiresAt": "2026-09-11T12:00:00.000Z",
  "createdAt": "2026-09-08T12:00:00.000Z",
  "inviteUrl": "/api/invitations/accept/550e8400-e29b-41d4-a716-446655440000"
}
```

#### Error Codes

| Status | Error |
|--------|-------|
| `400` | `groupId is required` |
| `400` | `method must be one of LINK, EMAIL, SMS, QR, USERNAME` |
| `400` | `target is required for method EMAIL` |
| `403` | `Not a member of this group` |

#### cURL Examples

**Email invitation:**
```bash
curl -X POST https://api.togetherplans.app/api/invitations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "groupId": "c4f2a1b3-0000-4abc-8def-111111111111",
    "method": "EMAIL",
    "target": "friend@example.com"
  }'
```

**Link invitation (shareable URL):**
```bash
curl -X POST https://api.togetherplans.app/api/invitations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"groupId": "c4f2a1b3-0000-4abc-8def-111111111111", "method": "LINK"}'
```

---

### Accept Invitation

Accept an invitation using the invite token. Caller must be authenticated. Adds the user to the group as a `MEMBER` and marks the invitation `ACCEPTED`.

**`POST /api/invitations/accept/:token`** 🔒 *Requires Auth*

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `token` | `string` (UUID) | Invitation token (from `inviteUrl`) |

#### Success Response — `201 Created`

```json
{
  "id": "m2000000-0000-0000-0000-000000000002",
  "groupId": "c4f2a1b3-0000-4abc-8def-111111111111",
  "userId": "u2000000-0000-0000-0000-000000000002",
  "role": "MEMBER",
  "joinedAt": "2026-09-08T13:00:00.000Z"
}
```

#### Error Codes

| Status | Error |
|--------|-------|
| `404` | `Invitation not found` |
| `409` | `Invitation already accepted` / `Invitation already declined` |
| `409` | `Already a member of this group` |
| `410` | `Invitation expired` |

#### cURL Example

```bash
curl -X POST https://api.togetherplans.app/api/invitations/accept/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $TOKEN"
```

---

## Proposals & Voting

All proposal endpoints require authentication. Callers must be members of the relevant group.

### Create Proposal

Creates a new date proposal with 3–5 activity options.

**`POST /api/proposals`** 🔒 *Requires Auth*

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `groupId` | `string` (UUID) | ✅ | Group this proposal belongs to |
| `title` | `string` | ✅ | Proposal title |
| `dateTime` | `string` (ISO 8601) | ✅ | Proposed date and time |
| `options` | `OptionInput[]` | ✅ | 3–5 activity options (see below) |

**OptionInput object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | ✅ | Activity name |
| `category` | `string` | ✅ | e.g. `restaurant`, `movie`, `activity`, `outdoors`, `culture` |
| `description` | `string` | ❌ | Short description |
| `address` | `string` | ❌ | Physical address |
| `latitude` | `number` | ❌ | Latitude for map display |
| `longitude` | `number` | ❌ | Longitude for map display |
| `externalRef` | `string` | ❌ | External API reference (Yelp/Google Place ID) |

#### Success Response — `201 Created`

```json
{
  "id": "p0000001-0000-4abc-0000-000000000001",
  "groupId": "c4f2a1b3-0000-4abc-8def-111111111111",
  "creatorId": "b3e1c2d4-5678-4abc-9def-000000000001",
  "title": "Saturday Night Out",
  "dateTime": "2026-09-13T19:00:00.000Z",
  "status": "OPEN",
  "parentId": null,
  "createdAt": "2026-09-08T12:00:00.000Z",
  "updatedAt": "2026-09-08T12:00:00.000Z",
  "options": [
    {
      "id": "opt00001-0000-0000-0000-000000000001",
      "proposalId": "p0000001-0000-4abc-0000-000000000001",
      "name": "Sushi Palace",
      "category": "restaurant",
      "description": "Best omakase in town",
      "address": "123 Main St",
      "latitude": 39.7392,
      "longitude": -104.9903,
      "externalRef": null,
      "createdAt": "2026-09-08T12:00:00.000Z"
    }
  ]
}
```

#### Error Codes

| Status | Error |
|--------|-------|
| `400` | `groupId, title and dateTime are required` |
| `400` | `dateTime must be a valid ISO date` |
| `400` | `A proposal requires 3-5 activity options` |
| `400` | `Each option needs a name and a category` |
| `403` | `Not a member of this group` |

#### cURL Example

```bash
curl -X POST https://api.togetherplans.app/api/proposals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "groupId": "c4f2a1b3-0000-4abc-8def-111111111111",
    "title": "Saturday Night Out",
    "dateTime": "2026-09-13T19:00:00.000Z",
    "options": [
      {"name": "Sushi Palace", "category": "restaurant", "description": "Best omakase in town"},
      {"name": "Bowling Alley", "category": "activity", "description": "Classic fun"},
      {"name": "Rooftop Bar", "category": "activity", "description": "City views and cocktails"}
    ]
  }'
```

---

### Get Proposal

Returns a proposal with options, all votes, counter-proposals, and a consensus tally.

**`GET /api/proposals/:id`** 🔒 *Requires Auth*

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` (UUID) | Proposal ID |

#### Success Response — `200 OK`

```json
{
  "id": "p0000001-0000-4abc-0000-000000000001",
  "groupId": "c4f2a1b3-0000-4abc-8def-111111111111",
  "title": "Saturday Night Out",
  "dateTime": "2026-09-13T19:00:00.000Z",
  "status": "OPEN",
  "options": [
    {
      "id": "opt00001-0000-0000-0000-000000000001",
      "name": "Sushi Palace",
      "category": "restaurant",
      "votes": [
        {"id": "v0000001", "userId": "b3e1c2d4-5678-4abc-9def-000000000001", "createdAt": "2026-09-08T12:30:00.000Z"}
      ]
    }
  ],
  "counters": [],
  "memberCount": 3,
  "tally": [
    {
      "optionId": "opt00001-0000-0000-0000-000000000001",
      "name": "Sushi Palace",
      "votes": 1,
      "consensus": false
    }
  ]
}
```

> `consensus: true` when more than half the group members have voted for that option. When consensus is reached, the proposal status changes to `DECIDED`.

#### Error Codes

| Status | Error |
|--------|-------|
| `403` | `Not a member of this group` |
| `404` | `Proposal not found` |

#### cURL Example

```bash
curl https://api.togetherplans.app/api/proposals/p0000001-0000-4abc-0000-000000000001 \
  -H "Authorization: Bearer $TOKEN"
```

---

### Vote on Proposal

Cast an approval vote for a specific option. Each user can vote once per option. If more than half the group votes for the same option, the proposal automatically transitions to `DECIDED`.

**`POST /api/proposals/:id/vote`** 🔒 *Requires Auth*

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` (UUID) | Proposal ID |

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `optionId` | `string` (UUID) | ✅ | ID of the option to vote for |

#### Success Response — `201 Created`

```json
{
  "vote": {
    "id": "v0000001-0000-0000-0000-000000000001",
    "optionId": "opt00001-0000-0000-0000-000000000001",
    "userId": "b3e1c2d4-5678-4abc-9def-000000000001",
    "createdAt": "2026-09-08T12:30:00.000Z"
  },
  "decided": false,
  "voteCount": 1,
  "memberCount": 3
}
```

> When `decided: true`, the proposal status has been updated to `DECIDED`.

#### Error Codes

| Status | Error |
|--------|-------|
| `400` | `optionId is required` |
| `403` | `Not a member of this group` |
| `404` | `Option not found on this proposal` |
| `409` | `Already voted for this option` |
| `409` | `Proposal is decided` / `Proposal is countered` / `Proposal is cancelled` |

#### cURL Example

```bash
curl -X POST https://api.togetherplans.app/api/proposals/p0000001-0000-4abc-0000-000000000001/vote \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"optionId": "opt00001-0000-0000-0000-000000000001"}'
```

---

### Counter-Proposal

Submit a counter-proposal to an existing proposal. The original proposal is marked `COUNTERED`. The counter is a new proposal with its own options and voting.

**`POST /api/proposals/:id/counter`** 🔒 *Requires Auth*

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` (UUID) | Original proposal ID |

#### Request Body

Same as [Create Proposal](#create-proposal) but without `groupId` (inherited from the original):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | ✅ | Counter-proposal title |
| `dateTime` | `string` (ISO 8601) | ✅ | Alternative date/time |
| `options` | `OptionInput[]` | ✅ | 3–5 activity options |

#### Success Response — `201 Created`

Same shape as [Create Proposal](#create-proposal) response, with `parentId` set to the original proposal's ID.

#### Error Codes

| Status | Error |
|--------|-------|
| `400` | `title and dateTime are required` |
| `400` | `dateTime must be a valid ISO date` |
| `400` | `A proposal requires 3-5 activity options` |
| `403` | `Not a member of this group` |
| `404` | `Proposal not found` |

#### cURL Example

```bash
curl -X POST https://api.togetherplans.app/api/proposals/p0000001-0000-4abc-0000-000000000001/counter \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Friday Instead?",
    "dateTime": "2026-09-12T20:00:00.000Z",
    "options": [
      {"name": "Taco Spot", "category": "restaurant"},
      {"name": "Mini Golf", "category": "activity"},
      {"name": "Karaoke Bar", "category": "activity"}
    ]
  }'
```

---

### Get Activity Suggestions

Returns 3–5 randomized activity suggestions from the seed catalog. Optionally filtered by category and/or location. Results are cached for 5 minutes.

**`GET /api/proposals/suggestions/list`** 🔒 *Requires Auth*

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lat` | `number` | ❌ | Latitude for location-based ranking |
| `lng` | `number` | ❌ | Longitude for location-based ranking |
| `category` | `string` | ❌ | Filter by category: `restaurant`, `movie`, `activity`, `outdoors`, `culture` |

#### Success Response — `200 OK`

```json
{
  "suggestions": [
    {
      "name": "Sushi night",
      "category": "restaurant",
      "description": "Omakase or casual rolls"
    },
    {
      "name": "Escape room",
      "category": "activity",
      "description": "Team puzzle under pressure"
    },
    {
      "name": "Live music venue",
      "category": "culture",
      "description": "Local band or open mic"
    }
  ]
}
```

#### cURL Example

```bash
# All categories
curl "https://api.togetherplans.app/api/proposals/suggestions/list" \
  -H "Authorization: Bearer $TOKEN"

# Filter by category with location
curl "https://api.togetherplans.app/api/proposals/suggestions/list?lat=39.7392&lng=-104.9903&category=restaurant" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Utility

### Health Check

Returns the service health status. No authentication required.

**`GET /health`**

#### Success Response — `200 OK`

```json
{
  "status": "ok",
  "service": "datenight-api",
  "uptime": 3600.25
}
```

#### cURL Example

```bash
curl https://api.togetherplans.app/health
```

---

### Privacy Policy

Returns the full privacy policy as an HTML page.

**`GET /privacy`**

**Response:** `text/html`

---

### Terms of Service

Returns the full terms of service as an HTML page.

**`GET /terms`**

**Response:** `text/html`

---

## Data Models

### ProposalStatus Enum

| Value | Description |
|-------|-------------|
| `OPEN` | Accepting votes |
| `COUNTERED` | A counter-proposal was submitted |
| `DECIDED` | Majority consensus reached |
| `CANCELLED` | Proposal cancelled |

### InviteMethod Enum

| Value | Description |
|-------|-------------|
| `LINK` | Shareable link/token |
| `EMAIL` | Email invitation sent via Resend |
| `SMS` | SMS invitation |
| `QR` | QR code |
| `USERNAME` | Invite by username |

### InviteStatus Enum

| Value | Description |
|-------|-------------|
| `PENDING` | Awaiting acceptance |
| `ACCEPTED` | Accepted |
| `DECLINED` | Declined |
| `EXPIRED` | 72-hour TTL elapsed |

### Role Enum

| Value | Description |
|-------|-------------|
| `OWNER` | Group creator; full permissions |
| `MEMBER` | Regular member |

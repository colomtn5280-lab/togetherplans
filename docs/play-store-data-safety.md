# Google Play Console — Data Safety & Content Rating Answers
## App: DateMeUp (package: datemeup.app) — v1.3.0

These are the exact answers to enter in Play Console. Do not deviate without re-reviewing the backend data flows.

---

## Data Safety Form

### Section 1 — Data Security

| Question | Answer |
|---|---|
| Is all data from this app encrypted in transit? | **Yes** — HTTPS/TLS for all API calls |
| Do you provide a way for users to request data deletion? | **Yes** — Settings → Delete Account permanently removes the account and associated data |

---

### Section 2 — Data Types Collected and Shared

#### Personal Info
| Data Type | Collected | Shared | Sold | Purpose |
|---|---|---|---|---|
| Name | Yes | No | No | Account display name |
| Email Address | Yes | No | No | Authentication, transactional email |
| User ID | Yes | No | No | Account identification |

#### Location
| Data Type | Collected | Shared | Sold | Purpose | Notes |
|---|---|---|---|---|---|
| Approximate Location | Yes | No | No | Nearby activity suggestions | **Not precise**. Processed ephemerally — not stored tied to user identity. Used only in the moment to filter venue recommendations. |
| Precise Location | No | — | — | — | Not collected |

#### Photos & Videos
| Data Type | Collected |
|---|---|
| Photos | No |
| Videos | No |

#### Audio Files
| Data Type | Collected |
|---|---|
| Voice/Sound | No |

#### Files & Docs
| Data Type | Collected |
|---|---|
| Files | No |

#### Contacts, Calendar, Other Personal
| Data Type | Collected |
|---|---|
| Contacts | No |
| Calendar | No (Calendar *write* only — add date to calendar, no read) |

#### Financial Info
| Data Type | Collected |
|---|---|
| Purchase history | No |
| Credit/debit card info | No |
| In-app purchase history | No |

#### Health & Fitness
| Data Type | Collected |
|---|---|
| Health info | No |
| Fitness info | No |

#### Messages
| Data Type | Collected | Notes |
|---|---|---|
| Emails | No | Transactional email is *sent* to users; no messages are stored in-app |
| SMS/Text | No | — |
| In-app messages | No | No in-app messaging feature |

#### App Activity
| Data Type | Collected | Shared | Sold | Purpose |
|---|---|---|---|---|
| App interactions | Yes | No | No | Feature analytics, improving suggestions |
| Other user-generated content | Yes | No | No | Group names, plan titles entered by users |

#### Web Browsing
| Data Type | Collected |
|---|---|
| Web browsing history | No |

#### App Info & Performance
| Data Type | Collected | Shared | Sold | Purpose |
|---|---|---|---|---|
| Crash logs | Yes | No | No | Bug detection and stability improvements |
| Diagnostics | No | — | — | — |

---

### Section 3 — Data Handling Practices (for each collected type)

For **every** data type checked above, answer:

| Question | Answer |
|---|---|
| Is this data required for the app to function? | Yes |
| Is this data processed ephemerally (never stored)? | Location only: Yes. All others: No (stored for account operation) |
| Is this data shared with third parties? | **No** for all types |
| Is this data sold? | **No** for all types |

---

## Content Rating Questionnaire (IARC / Google Play)

Answer these in the Play Console Content Rating section exactly:

| Question | Answer |
|---|---|
| Violence (realistic, graphic) | **No** |
| Sexual content | **No** |
| Suggestive references | **Yes** — After Dark section contains suggestive (non-explicit) romantic activity ideas |
| Alcohol references | **Yes** — venue suggestions may include bars and cocktail lounges |
| Controlled substances (drugs, tobacco) | **No** |
| Profanity or crude language | **No** |
| Social features — users interact with each other | **Yes** (group planning within invited contacts) |
| Users can share their location with other users | **No** |
| In-app purchases | **No** |
| Users can block or report other users | **No** (not yet implemented) |
| Chat or user messages moderated | **No** |
| Interactions limited to invited / known contacts | **Yes** — users join groups via private invite link only |

### Expected Rating: **Teen (T)**

The suggestive references and alcohol references push it from Everyone to Teen, which is correct and intentional. This does NOT prevent the app from targeting adults 18+.

---

## Target Audience & Content

| Field | Value |
|---|---|
| Target age group | **18 and over** |
| App category | Lifestyle / Social |
| After Dark note | "After Dark" section contains suggestive (non-explicit) romantic content references only — no explicit material. Venue suggestions may include bars. Both are disclosed via the Suggestive/Alcohol content flags above. |

---

## Notes for Jake

1. **Location storage**: Confirm with backend team that approximate location sent in suggestion requests is NOT logged to the database tied to user ID. If it is logged (even transiently), update "processed ephemerally" to "No" and add a retention period.
2. **Google Sign-In**: If Google OAuth is used, the email/user ID obtained is covered above. No additional disclosure needed unless profile picture is accessed — if it is, add "Profile Picture" under Personal Info.
3. **Camera permission**: Camera is declared for QR code scanning only — no photos are stored. This does not require disclosing "Photos" as a collected data type.
4. **Data deletion timeline**: Ensure the backend actually deletes data (not just soft-deletes) within a reasonable timeframe (30 days max) when user triggers "Delete Account".
5. **Third-party SDKs**: If you use any analytics SDK (Sentry, Amplitude, etc.), those SDKs may independently collect crash/usage data. Review each SDK's Play Store disclosure requirements and add them here.

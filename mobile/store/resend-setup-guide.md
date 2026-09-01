# Resend Email Setup Guide
### DateNight: Plan Together — Production Email Configuration

**For:** Jake  
**Backend:** Google Cloud Run at `api.togetherplans.app`  
**Email provider:** [Resend](https://resend.com) (npm package `resend`)  
**Env var needed:** `RESEND_API_KEY`

---

## Context

The backend is already deployed on Google Cloud Run and the Resend npm package is already integrated. The only missing piece is the **API key** — without it, welcome emails and invitation emails silently fail (the code is fire-and-forget, so the app continues to work normally, but users won't receive emails).

This guide covers:
1. Verifying the domain is set up in Resend
2. Getting the API key
3. Adding it to Cloud Run

---

## 1. CHECK RESEND DOMAIN STATUS

1. Go to [resend.com](https://resend.com) and sign in
2. Click **Domains** in the left sidebar
3. Look for **togetherplans.app**
4. The status should show **Verified** with green checkmarks on all three records:
   - SPF ✅
   - DKIM ✅
   - DMARC ✅

**If any records show "Pending"**, add the DNS records to your domain provider (Cloudflare or wherever `togetherplans.app` DNS is managed) and wait up to 24 hours for propagation.

**Required DNS records** (Resend shows the exact values in their UI — copy from there):

| Type | Name | Value |
|---|---|---|
| TXT | `resend._domainkey.togetherplans.app` | Your DKIM key _(shown in Resend UI)_ |
| TXT | `_dmarc.togetherplans.app` | `v=DMARC1; p=none;` |
| TXT | `togetherplans.app` | SPF record _(usually already present if using Cloudflare)_ |

> **Don't proceed to step 2 until the domain shows Verified.** Emails sent with an unverified domain will be rejected.

---

## 2. GET YOUR API KEY

1. In Resend, click **API Keys** in the left sidebar
2. Click **Create API Key**
3. Fill in:
   - **Name:** `DateNight Production`
   - **Permission:** Sending access
   - **Domain:** togetherplans.app _(select if prompted)_
4. Click **Add**
5. **⚠️ COPY THE KEY NOW — it only shows once!**

Paste it somewhere safe temporarily (password manager, notes) — you'll add it to Cloud Run in the next step.

---

## 3. ADD API KEY TO CLOUD RUN

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Navigate to **Cloud Run**
3. Click on the **`datenight-api`** service (name may vary — look for the service at `api.togetherplans.app`)
4. Click **Edit & Deploy New Revision**
5. Scroll down to the **Variables & Secrets** section
6. Click **Add Variable**
7. Set:
   - **Name:** `RESEND_API_KEY`
   - **Value:** paste your API key
8. Click **Deploy**
9. Wait ~60 seconds for the new revision to go live

> **Tip:** You can verify the new revision is live by checking the **Revisions** tab — the new revision should show 100% traffic with a green status indicator.

---

## 4. VERIFY IT'S WORKING

Test by registering a new account:

```bash
# Using curl (replace with a real test email address)
curl -X POST https://api.togetherplans.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "your-test-email@example.com", "password": "TestPass123!", "displayName": "Test User"}'
```

Or register via the app or Postman.

**Then check:**

1. ✅ Check your email inbox for a welcome email from `hello@togetherplans.app`
2. ⏱️ If not received after 5 minutes:
   - Go to **Resend dashboard > Logs**
   - Look for the send attempt — it should appear with a status (delivered, bounced, etc.)
3. If it appears in Resend Logs but not your inbox → **check spam folder**
4. If it doesn't appear in Resend Logs at all → the API key wasn't saved correctly — **repeat step 3**

---

## 5. WHAT EMAILS THE APP SENDS

Both emails send from: **DateNight \<hello@togetherplans.app\>**

| Email | Trigger | Behavior |
|---|---|---|
| Welcome email | User registers a new account | Fire-and-forget, non-blocking |
| Invitation email | User invites someone to a group by email | Fire-and-forget, non-blocking |

> Fire-and-forget means email failures are logged but **do not cause API errors** — the registration and invitation flows succeed regardless of email delivery.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| No emails at all, nothing in Resend Logs | API key missing or wrong in Cloud Run | Re-add the key (step 3) |
| Emails in Resend Logs, not in inbox | Spam filtering or domain reputation | Check spam; ensure DMARC/DKIM are verified |
| Resend Logs show "Domain not verified" | Domain verification incomplete | Complete step 1 |
| Cloud Run deploy fails | IAM permissions issue | Check that your GCP account has `Cloud Run Developer` role |

---

*Last updated for DateNight backend at api.togetherplans.app*

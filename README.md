# High-Volume Outbound Email — POC

A basic email sending micro-system built with Node.js, Express, BullMQ, Redis, MongoDB, and Brevo (Sendinblue) API.

## Live Demo

**Production URL**: `https://email-system-production-6a93.up.railway.app`

```bash
# Health check
curl https://email-system-production-6a93.up.railway.app/health

# Send emails
curl -F "file=@test.csv" https://email-system-production-6a93.up.railway.app/api/upload
```

## Requirements Coverage

| Requirement | Implementation |
|---|---|
| Email sending pipeline | `src/services/emailService.js` (Brevo transactional API) |
| Queueing system | `src/queue/queue.js` + `worker.js` (BullMQ, retries, exponential backoff, concurrency) |
| Domain & IP rotation strategy | `src/services/rotationService.js` (round-robin over `SENDERS` env list) |
| Personalization engine | `src/services/templateService.js` (per-row name/company merge) |
| Bounce & complaint handling | `src/webhook/sendgridWebhook.js` (writes bounces/spam to `Suppression` collection) |
| Reputation management | Worker checks `Suppression` before sending + retry/backoff + per-sender rotation |
| Accept a CSV | `POST /api/upload` with multipart `file` field |
| Send personalized emails | Worker merges template with CSV row data |

## Architecture

```
         ┌─────────────┐
         │   CSV File  │
         └──────┬──────┘
                │  multipart/form-data
                ▼
     ┌──────────────────────┐
     │  Express API         │   POST /api/upload
     │  (app.js / routes)   │
     └──────────┬───────────┘
                │  per row
                ▼
     ┌──────────────────────┐           ┌──────────────┐
     │   BullMQ Queue       │◄─────────►│  Redis       │
     │   "email-queue"      │           │  (Upstash)   │
     └──────────┬───────────┘           └──────────────┘
                │  job
                ▼
     ┌──────────────────────┐     ┌──────────────────┐
     │   Worker (5 conc.)   │────►│  Suppression?    │──► skip
     │                      │     └──────────────────┘
     │  1. personalize      │
     │  2. rotate sender    │◄────── SENDERS list (domain/IP rotation)
     │  3. send via Brevo   │────────────────────┐
     │  4. log to Mongo     │                    ▼
     └──────────┬───────────┘             ┌─────────────┐
                │                         │  Brevo API  │
                ▼                         └──────┬──────┘
         ┌────────────┐                          │ bounce / spam
         │  MongoDB   │                          │
         │  Email     │◄──── POST /webhook ◄─────┘
         │  Suppress. │
         └────────────┘
```

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js + Express | API server |
| BullMQ | Job queue with retries & backoff |
| Redis (Upstash) | Queue storage |
| MongoDB (Atlas) | Email logs & suppression list |
| Brevo API | Transactional email delivery |
| Railway | Cloud deployment (API + Worker) |

## Setup (Local)

```bash
npm install
cp .env.example .env   # fill in values
```

### Required env vars (`.env`)

```
PORT=3000
MONGO_URI=mongodb+srv://...
REDIS_URL=rediss://...            # Upstash or local redis://127.0.0.1:6379
BREVO_API_KEY=xkeysib-...
SENDERS=sender1@yourdomain.com,sender2@yourdomain.com
```

## Run (Local)

Two processes — API + worker:

```bash
# Terminal 1: API server
npm run dev

# Terminal 2: Queue worker
npm run worker
```

## Usage

### 1. Create a CSV file

```csv
email,name,company
alice@example.com,Alice,Acme Inc
bob@example.com,Bob,Globex Corp
```

### 2. Upload and send

```bash
curl -F "file=@your-file.csv" http://localhost:3000/api/upload
```

Response:
```json
{"message":"Emails queued successfully","count":2}
```

### 3. Check your email

> **Important**: Emails may not appear in your Primary inbox immediately.
> Please check the following locations in your email client:
>
> - **Spam / Junk folder** — Most likely location for first-time senders. Mark as "Not Spam" to receive future emails in inbox.
> - **Promotions tab** (Gmail) — HTML-styled emails may be filtered here.
> - **Updates tab** (Gmail) — Some transactional emails land here.
> - **All Mail** (Gmail) — Search for `from:your-sender@email.com` to find it.
>
> **Tip**: After finding the email, click "Not Spam" or drag it to Primary. Add the sender to your contacts to ensure future delivery to inbox.

## Bounce / Complaint Webhook

Configure your Brevo webhook to hit:

```
POST https://your-app.up.railway.app/webhook
```

Payload example:
```json
[
  {"event": "bounce", "email": "bad@example.com"},
  {"event": "spam", "email": "complainant@example.com"}
]
```

Bounced and spam-reported addresses are saved to the `suppressions` collection and automatically blocked on future sends.

## Deployment (Railway)

### Services Required

| Service | Start Command | Needs Domain? |
|---|---|---|
| API | `npm start` | Yes (Generate Domain) |
| Worker | `npm run worker` | No |

### Environment Variables (both services)

```
MONGO_URI=mongodb+srv://...
REDIS_URL=rediss://...
BREVO_API_KEY=xkeysib-...
SENDERS=sender@yourdomain.com
```

API also needs: `PORT=3000`

### Steps

1. Create API service from GitHub repo → set start command `npm start` → generate domain
2. Create Worker service from same repo → set start command `npm run worker`
3. Add environment variables to both services
4. Set Brevo webhook URL to `https://your-domain.up.railway.app/webhook`

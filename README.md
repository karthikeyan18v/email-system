# High-Volume Outbound Email — POC

A basic email sending micro-system built with Node.js, Express, BullMQ, Redis, MongoDB, and Brevo (Sendinblue) API.

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
     │   BullMQ Queue       │◄─────────►│    Redis     │
     │   "email-queue"      │           └──────────────┘
     └──────────┬───────────┘
                │  job
                ▼
     ┌──────────────────────┐     ┌──────────────────┐
     │   Worker (N conc.)   │────►│  Suppression?    │──► skip
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

## Setup

```bash
npm install
cp .env.example .env   # fill in values
```

### Required env vars (`.env`)

```
PORT=3000
MONGO_URI=mongodb+srv://...
REDIS_URL=rediss://...            # Upstash or local redis://127.0.0.1:6379
BREVO_API_KEY=xkeysib-...         # (or SENDGRID_API_KEY as fallback)
SENDERS=sender1@yourdomain.com,sender2@yourdomain.com
```

## Run

Two processes — API + worker:

```bash
npm run dev        # API server on :3000
npm run worker     # BullMQ worker (separate terminal)
```

## Usage

```bash
curl -F "file=@sample.csv" http://localhost:3000/api/upload
```

CSV format: `email,name,company`

## Bounce / Complaint Webhook

Configure your Brevo/SendGrid webhook to hit:

```
POST http://<host>/webhook
```


### 4. Set Webhook URL

In your Brevo dashboard, set the webhook URL to:

```
https://your-app.onrender.com/webhook
```

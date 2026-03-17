# Hari Prabodham Matrimonial API

Node.js + PostgreSQL backend scaffold for approved **Phase 1 + Phase 2** scope:
- Auth and OTP
- Registration and login
- Profile section APIs
- Discovery/search/filter APIs
- App bootstrap/home content APIs
- Local folder photo upload APIs (`uploads/`)

## 1) Setup

1. Copy env file:
```bash
cp .env.example .env
```

2. Create PostgreSQL database (example: `hp_matrimonial`).

3. Apply schema:
```bash
psql "$DATABASE_URL" -f db/schema.sql
```

4. Install dependencies:
```bash
npm install
```

5. Run server:
```bash
npm run dev
```

Base URL: `http://localhost:4000/api/v1`

## Local Folder (Default Image Storage)

Set in `.env`:
```env
STORAGE_PROVIDER=local
STORAGE_LOCAL_DIR=uploads
STORAGE_PUBLIC_BASE_URL=http://localhost:4000
```

Use API:
- `POST /profiles/me/photos/upload-local`

## Local Upload (Default)
Use `POST /profiles/me/photos/upload-local` with base64 image payload.

## 2) Core Endpoints

### Auth
- `POST /auth/otp/send`
- `POST /auth/otp/verify`
- `POST /auth/register`
- `POST /auth/login/password`
- `POST /auth/login/otp`
- `POST /auth/token/refresh`
- `POST /auth/logout`
- `POST /auth/password/change`

### Profile
- `GET /profiles/me`
- `PATCH /profiles/me/basic`
- `PATCH /profiles/me/spiritual`
- `PATCH /profiles/me/education-career`
- `PATCH /profiles/me/family`
- `PATCH /profiles/me/partner-preferences`
- `PATCH /profiles/me/privacy`
- `GET /profiles/me/photos`
- `PATCH /profiles/me/photos/:photoId/primary`
- `DELETE /profiles/me/photos/:photoId`
- `GET /profiles/:profileId`

### Discovery
- `GET /discovery/profiles`
- `GET /discovery/filters/meta`

### App Content
- `GET /app/bootstrap`
- `GET /app/home`

## 3) Notes
- OTP is logged to server console by default. To send OTP via email, set `OTP_DELIVERY=email` and SMTP configs in `.env`.
- Photo/family privacy is enforced server-side in profile/discovery responses.
- This implementation does not yet include connections, shortlist, chat, notifications, or membership renewal flows (planned for next phase).
- For complete image architecture and Flutter usage flow, see `docs/IMAGE_STORAGE_AND_UPLOAD_FLOW.md`.

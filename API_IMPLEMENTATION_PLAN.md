# Hari Prabodham Matrimonial - API Implementation Plan

## 1) Goal
Build production-ready backend APIs for iOS and Android using Node.js and PostgreSQL, aligned with the provided app screens and ERD.

This document is planning-only. No implementation will start until explicit approval.

## 2) Product Scope Mapped From Screens

### Public/Guest
- Splash/branding and app config bootstrap
- Landing/home content (banners, highlights, counters)
- Browse profiles (limited fields, blurred/locked content)
- Profile preview (public-safe fields)
- Registration step 1 (mobile/email + OTP + password)
- Login (password + OTP flow)

### Member (Authenticated)
- Registration step 2/profile completion (spiritual + basic details)
- My profile dashboard + completeness
- Edit sections:
  - Basic information
  - Spiritual details
  - Education & career
  - Family details
  - Partner preferences
  - Photos
  - Privacy settings
- Search + advanced filters (age, caste, region, city, education, height, sort)
- Shortlist management
- Interest/connection requests (send/accept/reject)
- Private detail access/photo unlock requests (send/approve/reject)
- Matches list, request inbox, chat room + messages
- Notifications
- Account page (membership status, renewal, logout, change password)

## 3) ERD Alignment (Given Tables)
Core tables from ERD to be used:
- users
- otp_logs
- profiles
- spiritual_info
- education_career
- family_details
- partner_preferences
- memberships
- shortlists
- connection_requests
- photo_access_requests
- chat_rooms
- messages
- notifications

Planned additions (if not already present in SQL migration set):
- indexes for search-heavy columns (`profiles.caste`, `profiles.city`, `profiles.state`, `profiles.date_of_birth`, `profiles.is_verified`)
- unique constraints where required (e.g., one active profile row per user)
- enum/check constraints for request status fields

## 4) Technical Stack
- Runtime: Node.js (LTS)
- Framework: Express.js
- DB: PostgreSQL
- Query layer: Prisma ORM (preferred) or Knex (fallback)
- Validation: Zod/Joi
- Auth: JWT (access + refresh) with password hash (bcrypt)
- OTP: DB-backed OTP with expiry + attempt limits (SMS/email provider abstraction)
- File storage for photos: S3-compatible abstraction (local mock in dev)
- Docs: OpenAPI (Swagger)
- Testing: Jest + Supertest

## 5) API Module Design

### Auth Module
- `POST /api/v1/auth/otp/send`
- `POST /api/v1/auth/otp/verify`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login/password`
- `POST /api/v1/auth/login/otp`
- `POST /api/v1/auth/token/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/password/change`

### Profile Module
- `GET /api/v1/profiles/me`
- `PATCH /api/v1/profiles/me/basic`
- `PATCH /api/v1/profiles/me/spiritual`
- `PATCH /api/v1/profiles/me/education-career`
- `PATCH /api/v1/profiles/me/family`
- `PATCH /api/v1/profiles/me/partner-preferences`
- `PATCH /api/v1/profiles/me/privacy`
- `POST /api/v1/profiles/me/photos`
- `DELETE /api/v1/profiles/me/photos/:photoId`
- `GET /api/v1/profiles/:profileId` (public/member-view aware)

### Discovery/Search Module
- `GET /api/v1/discovery/profiles`
  - supports keyword + filters + pagination + sort
- `GET /api/v1/discovery/filters/meta`

### Shortlist Module
- `GET /api/v1/shortlists`
- `POST /api/v1/shortlists/:targetProfileId`
- `DELETE /api/v1/shortlists/:targetProfileId`

### Interest/Connection Module
- `POST /api/v1/connections/requests`
- `GET /api/v1/connections/requests/incoming`
- `GET /api/v1/connections/requests/sent`
- `PATCH /api/v1/connections/requests/:requestId` (accept/reject)

### Private Access/Photo Access Module
- `POST /api/v1/private-access/requests`
- `GET /api/v1/private-access/requests/incoming`
- `PATCH /api/v1/private-access/requests/:requestId` (approve/reject)

### Chat Module
- `GET /api/v1/chats/rooms`
- `POST /api/v1/chats/rooms` (create after accepted connection)
- `GET /api/v1/chats/rooms/:roomId/messages`
- `POST /api/v1/chats/rooms/:roomId/messages`
- `PATCH /api/v1/chats/messages/:messageId/read`

### Notifications Module
- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/:id/read`
- `PATCH /api/v1/notifications/read-all`

### Membership & Account Module
- `GET /api/v1/account/membership`
- `POST /api/v1/account/membership/renew`
- `GET /api/v1/account/summary`

### App Content Module
- `GET /api/v1/app/bootstrap`
- `GET /api/v1/app/home`

## 6) Privacy Rules (Critical)
- Guest users see only limited public profile fields.
- Photo blur/lock enforced server-side via response serializer.
- Family/contact/private details visible only when:
  - requester is authenticated, and
  - target approved private access request.
- Chat allowed only on accepted connection.
- All sensitive actions audited in logs.

## 7) API Response Pattern
Standard JSON envelope:
- success: boolean
- message: string
- data: object/array
- meta: pagination/request metadata
- error: structured code + details (for failures)

## 8) Delivery Phases

### Phase 1 - Foundation
- Project bootstrap, env config, DB connection
- migrations for ERD-aligned schema
- auth + OTP + base middleware

### Phase 2 - Profile & Discovery
- registration step 2 data capture
- profile CRUD sections
- browse/search/filter APIs

### Phase 3 - Social Flow
- shortlists
- interests/connection requests
- private details/photo access requests

### Phase 4 - Chat, Notifications, Membership
- chat rooms/messages
- notifications APIs
- account + membership APIs

### Phase 5 - Hardening
- validations, rate limit, security headers
- test coverage + OpenAPI docs
- production checklist

## 9) Non-Functional Requirements
- JWT auth, RBAC checks, request validation
- rate limiting on OTP/login endpoints
- secure password hashing
- pagination for all list endpoints
- DB indexes for query performance
- structured logging + error tracing
- input sanitization and SQL injection protection via ORM

## 10) What I Need Approved Before Coding
Please confirm these implementation choices:
1. Use **Express + Prisma + PostgreSQL**.
2. Use **JWT access/refresh token auth**.
3. OTP provider integration will start with **mock/provider abstraction** (real SMS/email adapter pluggable).
4. API base path: **`/api/v1`**.
5. I should start with **Phase 1 + Phase 2 first** in code.

Once you approve, I will immediately begin implementing the backend in this repository.

# Image Storage and Upload Flow (Local Folder)

This document explains the complete image flow for backend + Flutter app.

## 1) Where Images Are Stored

- **Local folder mode** (`STORAGE_PROVIDER=local`)
- Files stored in `uploads/`
- Served from `http://27.116.52.24:8093/uploads/...`

- PostgreSQL stores only metadata in `profile_photos`:
  - `id`
  - `user_id`
  - `storage_key`
  - `file_url`
  - `visibility` (`public` or `locked`)
  - `is_primary`

## 2) Why This Architecture

- DB is not used for heavy binaries.
- Upload/download is faster via object storage.

## 3) Local Folder Mode

Use these `.env` values:

```env
STORAGE_PROVIDER=local
STORAGE_LOCAL_DIR=uploads
STORAGE_PUBLIC_BASE_URL=http://27.116.52.24:8093
```

Upload API in local mode:
- `POST /api/v1/profiles/me/photos/upload-local`

Payload:
```json
{
  "fileName": "profile_1.jpg",
  "contentType": "image/jpeg",
  "fileBase64": "<base64-string>",
  "visibility": "locked",
  "is_primary": true
}
```

## 4) Backend APIs for Image Flow

All endpoints require bearer token.

1. `POST /api/v1/profiles/me/photos/upload-local`
2. `GET /api/v1/profiles/me/photos`
3. `PATCH /api/v1/profiles/me/photos/:photoId/primary`
4. `DELETE /api/v1/profiles/me/photos/:photoId`

## 6.1) Photo Access Request Flow (Unlock)

When a user wants to view locked photos:

1. Request access:
`POST /api/v1/private-access/requests`

2. Profile owner sees incoming requests:
`GET /api/v1/private-access/requests/incoming`

3. Owner approves/rejects:
`PATCH /api/v1/private-access/requests/:requestId`

Once approved, profile photos are visible to the requester in:
- `GET /api/v1/profiles/:profileId`
- `GET /api/v1/discovery/profiles`

## 5) End-to-End Upload Sequence

1. App uploads base64 image:
```json
POST /profiles/me/photos/upload-local
{
  "fileName": "profile_1.png",
  "contentType": "image/png",
  "fileBase64": "<base64-string>",
  "visibility": "locked",
  "is_primary": true
}
```

2. App reads images:
- `GET /profiles/me/photos`

5. Optional actions:
- set primary photo
- delete photo

## 6) Flutter Integration Notes

- Render returned `file_url` using `Image.network`.
- For locked visibility flows, keep using backend privacy logic.

## 7) Migration/DB Note

Apply latest schema after pulling changes:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

This creates `profile_photos` if not already present.

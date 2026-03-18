# Hari Prabodham API - Flutter Integration Guide

This guide is for Flutter developers integrating with the Node.js backend APIs.

## 1) Base Setup

- Base URL (local): `http://27.116.52.24:8093`
- API prefix: `/api/v1`
- Full base for requests: `http://27.116.52.24:8093/api/v1`
- Content type: `application/json`
- Auth type: `Bearer <accessToken>`

## 2) Common Response Format

Success:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {},
  "meta": {}
}
```

Error:
```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "details": []
  }
}
```

## 3) Auth Flow (Recommended)

### A. Register Flow
1. `POST /auth/otp/send`
2. Read OTP (in dev from server log / via email if `OTP_DELIVERY=email`)
3. `POST /auth/register`
4. Save `accessToken` + `refreshToken`

### B. Login Flow
1. `POST /auth/login/password`
2. Save `accessToken` + `refreshToken`
3. On token expiry call `POST /auth/token/refresh`

## 4) Endpoint Catalog

## Health
- `GET /health`

## App Content
- `GET /app/bootstrap`
- `GET /app/home`

## Auth
- `POST /auth/otp/send`
- `POST /auth/otp/verify`
- `POST /auth/register`
- `POST /auth/login/password`
- `POST /auth/login/otp`
- `POST /auth/token/refresh`
- `POST /auth/logout`
- `POST /auth/password/change` (auth required)

## Profile
- `GET /profiles/me` (auth required)
- `PATCH /profiles/me/basic` (auth required)
- `PATCH /profiles/me/spiritual` (auth required)
- `PATCH /profiles/me/education-career` (auth required)
- `PATCH /profiles/me/family` (auth required)
- `PATCH /profiles/me/partner-preferences` (auth required)
- `PATCH /profiles/me/privacy` (auth required)
 - `POST /profiles/me/photos/upload-local` (auth required)
- `GET /profiles/me/photos` (auth required)
- `PATCH /profiles/me/photos/:photoId/primary` (auth required)
- `DELETE /profiles/me/photos/:photoId` (auth required)
- `GET /profiles/:profileId` (supports UUID or public profile code like `HPM-123456`)

## Discovery / Feed
- `GET /discovery/profiles`
- `GET /discovery/filters/meta`

## Private Access (Photo Unlock)
- `POST /private-access/requests`
- `GET /private-access/requests/incoming`
- `GET /private-access/requests/sent`
- `PATCH /private-access/requests/:requestId`

## 5) Key Request Payloads

### Send OTP
`POST /auth/otp/send`
```json
{
  "mobileOrEmail": "9979646602"
}
```

### Register
`POST /auth/register`
```json
{
  "mobileOrEmail": "9979646602",
  "password": "Password@123",
  "otp": "217106"
}
```

### Login Password
`POST /auth/login/password`
```json
{
  "identifier": "9979646602",
  "password": "Password@123"
}
```

### Login OTP
`POST /auth/login/otp`
```json
{
  "mobileOrEmail": "9979646602",
  "otp": "217106"
}
```

### Update Basic Profile
`PATCH /profiles/me/basic`
```json
{
  "full_name": "Rajesh Patel",
  "gender": "Male",
  "date_of_birth": "1995-08-15",
  "height": "5'10\"",
  "marital_status": "Never Married",
  "mother_tongue": "Gujarati",
  "caste": "Leva Patel",
  "city": "Surat",
  "state": "Gujarat",
  "country": "India",
  "about_me": "Devout follower",
  "income_range": "15L-20L"
}
```

### Upload Local Photo
`POST /profiles/me/photos/upload-local`
```json
{
  "fileName": "profile_1.png",
  "contentType": "image/png",
  "fileBase64": "<base64-image-content>",
  "visibility": "locked",
  "is_primary": true
}
```

### Request Photo Access
`POST /private-access/requests`
```json
{
  "profileId": "<target_profile_uuid>",
  "message": "I would like to request access to your photos."
}
```

### Approve/Reject Request
`PATCH /private-access/requests/:requestId`
```json
{
  "action": "approve"
}
```

### Feed
`GET /discovery/profiles?q=rajesh&caste=Leva Patel&state=Gujarat&city=Surat&ageMin=23&ageMax=35&page=1&limit=20&sortBy=recent`

## 6) Feed Query Params

- `q`: name/profile search text
- `caste`: exact caste filter
- `state`: state filter
- `city`: city filter
- `education`: education filter
- `ageMin`: minimum age
- `ageMax`: maximum age
- `page`: page number (default `1`)
- `limit`: page size (default `20`, max `50`)
- `sortBy`: `recent` | `age_asc` | `age_desc`

## 7) Flutter (Dio) Integration Skeleton

```dart
import 'package:dio/dio.dart';

class ApiClient {
  final Dio dio;
  String? accessToken;
  String? refreshToken;

  ApiClient(String baseUrl)
      : dio = Dio(BaseOptions(
          baseUrl: '$baseUrl/api/v1',
          connectTimeout: const Duration(seconds: 20),
          receiveTimeout: const Duration(seconds: 20),
          headers: {'Content-Type': 'application/json'},
        )) {
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        if (accessToken != null && accessToken!.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $accessToken';
        }
        handler.next(options);
      },
      onError: (e, handler) async {
        if (e.response?.statusCode == 401 && refreshToken != null) {
          try {
            final r = await dio.post('/auth/token/refresh', data: {
              'refreshToken': refreshToken,
            });
            accessToken = r.data['data']['accessToken'];
            refreshToken = r.data['data']['refreshToken'];

            final requestOptions = e.requestOptions;
            requestOptions.headers['Authorization'] = 'Bearer $accessToken';
            final cloned = await dio.fetch(requestOptions);
            return handler.resolve(cloned);
          } catch (_) {}
        }
        handler.next(e);
      },
    ));
  }
}
```

## 8) Suggested Flutter Service Methods

- `sendOtp(String mobileOrEmail)`
- `register(String mobile, String password, String otp)`
- `loginWithPassword(String identifier, String password)`
- `getMyProfile()`
- `updateBasicProfile(Map<String, dynamic> payload)`
 - `uploadLocalPhoto(Map<String, dynamic> payload)`
- `getMyPhotos()`
- `setPrimaryPhoto(String photoId)`
- `deletePhoto(String photoId)`
- `getDiscoveryProfiles(Map<String, dynamic> query)`
- `getFilterMeta()`
- `getProfileById(String profileId)`
- `sendPhotoAccessRequest(String profileId, String message)`
- `getIncomingPhotoRequests()`
- `getSentPhotoRequests()`
- `updatePhotoRequest(String requestId, String action)`

## 9) Status Codes to Handle

- `200` success
- `201` created (register)
- `400` validation / OTP invalid / bad request
- `401` unauthorized / invalid token / invalid credentials
- `403` inactive account
- `404` not found
- `409` user already exists
- `500` server error

## 10) Integration Notes

- `GET /profiles/:profileId` accepts public IDs like `HPM-123456`.
- For locked photos, API may return `photo_url: null`.
- For locked family details, API returns a locked object message.
- Always store tokens securely (e.g., `flutter_secure_storage`).
- Use pagination fields from `meta` in discovery responses.

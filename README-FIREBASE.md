# The Call Prayer Ministry — Firebase Foundation

Firebase project: `thcphm`

This version uses **Firebase Authentication + Cloud Firestore only**. Firebase Storage is intentionally not used.

## 1. Enable Authentication

In Firebase Console:
1. Open project `thcphm`.
2. Go to Authentication → Sign-in method.
3. Enable Email/Password.

## 2. Create the first admin account

Create an Email/Password user in Firebase Authentication.

Copy that user's UID.

Then create this Firestore document:

Collection: `users`
Document ID: `<THE_AUTH_USER_UID>`

Fields:
- `role` = `admin`
- `email` = the admin email
- `displayName` = the admin name

The admin login will reject authenticated users who do not have `role: admin`.

## 3. Firestore

Create a Firestore database, then publish `firestore.rules`.

The rules in this project allow:
- public reads for announcements, programs, sermons, gallery and settings;
- unauthenticated prayer-request submissions;
- unauthenticated testimony submissions with `approved: false`;
- admin-only management of church data.

## 4. Image handling

`js/image-helper.js` resizes images in the browser and converts them to JPEG Base64 data URLs. The default target is below 700 KB so documents stay comfortably below Firestore's 1 MiB document limit.

For large galleries, we should still keep each image in its own document and avoid putting multiple images into one document.

## 5. First test

Run the website through VS Code Live Server (or another HTTP server).

Open:
`admin/login.html`

Sign in with the Firebase Authentication admin account.

Then open Announcements and create a test announcement.


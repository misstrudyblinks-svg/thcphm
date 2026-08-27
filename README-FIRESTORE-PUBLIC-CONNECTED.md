# The Call Prayer Ministry — Firestore Public Connection Update

## What was fixed

- Public Programs / Events now read published Firestore records and display Base64 images correctly.
- Public Announcements now display announcement images saved by the admin.
- Public Prayer Request form writes to `prayerRequests`.
- Public Testimony form writes pending records to `testimonies` and supports an optional compressed image.
- Admin Testimonies supports Approve, Unpublish and Reject.
- Public Give Today opens a giving-details modal populated from Church Settings.
- Church Settings now includes giving information fields.
- Admin Visit Requests uses responsive readable cards instead of a cramped table.
- Admin typography was increased slightly for comfortable reading without changing the public website typography.
- Firestore rules allow public reading only of published announcements, programs, sermons and gallery items.

## Giving fields

In `admin/settings.html`, configure:

- Giving Title
- Mobile Money / Giving Details
- Bank Name
- Account Name
- Account Number
- Giving Note

The public Give Today modal reads these values from `settings/church`.

## Firestore collections

- `announcements`
- `programs`
- `sermons`
- `gallery`
- `prayerRequests`
- `testimonies`
- `members`
- `visitRequests`
- `settings/church`

## Deploy rules

After replacing your project files, deploy the updated `firestore.rules` to Firebase so the new public-read restrictions are active.

Example Firebase CLI command:

```bash
firebase deploy --only firestore:rules
```

## Local testing

1. Run the project from a local web server (for example VS Code Live Server).
2. Sign in at `admin/login.html`.
3. Add a Program / Event and choose **Published**.
4. Add an announcement with an image and choose **Published**.
5. Open the public homepage and refresh.
6. Submit a prayer request and confirm it appears in Admin > Prayer Requests.
7. Submit a testimony with an image and confirm it is Pending in Admin > Testimonies.
8. Approve it and refresh the public homepage.
9. Configure giving details in Admin > Church Settings and test Give Today.
10. Submit Come Visit Us and confirm it appears in Admin > Visit Requests.

# RxCheck — Prescription review assistant

RxCheck is an Android prototype that helps organise text from a prescription for HUMAN VERIFICATION. It is not a medical device or a validated clinical decision-support system.

> CLINICAL SAFETY: RxCheck does not diagnose, prescribe, calculate safe doses, confirm that a medicine combination is safe, recommend substitutions, or tell a user to start/stop/change treatment. OCR can misread medicine names, decimal points, units and handwriting. A missing warning is not evidence of safety. Always verify the original prescription and consult a qualified pharmacist or prescriber.

## What the current app does

- Capture a prescription photo or select up to five images.
- Read printed text on-device with Google ML Kit Text Recognition v2 (expo-mlkit-ocr).
- Apply conservative, local pattern matching to identify some patient fields and medicine candidates.
- Let the user correct or enter patient and medicine details manually, including strength, dose, frequency and duration.
- Query the public openFDA Drug Label API for individual label excerpts by medicine name. This is NOT a pairwise interaction checker.
- Provide external medicine-name search links for prescribed medicines only. RxCheck does not confirm availability, price or suitability.
- Show that prescription history is not saved. Do not enter real patient data into a prototype unless an appropriate privacy/security review has been completed.

## Free OCR and privacy

The current scanner uses on-device ML Kit. NO Google Cloud Vision billing account, API key, OmniRoute account, AI gateway URL or hosted OCR service is required. The scanner code does not upload prescription images for OCR. There is no cloud AI autofill path in the current app.

The medicine-label screen sends the medicine names entered by the user to the public openFDA API for label lookup. It does not send the prescription image or patient demographics to openFDA. No validated drug-interaction database is connected.

If an older Cloudflare Worker was deployed for RxCheck, the current app no longer uses it. Removing the legacy worker files from this repository does not delete a Worker that is already deployed in Cloudflare; delete that old Worker and remove its Google API key secret in Cloudflare/Google Cloud separately.

## OCR limitations

ML Kit recognises text; the local parser only recognises common labelled demographics and simple row/column medicine layouts. It may miss or mis-map handwriting, dense tables, abbreviations, brand names, or unusual prescription formats. It does not understand clinical context.

Every OCR field is an UNVERIFIED CANDIDATE. The user must compare each field with the original prescription before continuing. If any name, strength, dose, decimal, unit or instruction is unclear, do not guess; ask a pharmacist or prescriber.

## Interaction and label lookup limitations

The app queries individual openFDA product labels for up to eight medicine names. The lookup may return no match or be unavailable/rate-limited. A matching label excerpt is not a pairwise interaction result and does not establish safety. Remaining names beyond the eight-item lookup limit are not queried and are labelled as such in the UI.

No automated integration is configured for Drugs.com, Medscape, FDA FDALabel full-text search or Cyntegrity. The app must not imply that those sources have been queried. No validated dose-range, allergy, pregnancy, kidney/liver, duplicate-therapy or interaction engine is included.

## Build requirements

- Node.js 22 or newer.
- Android phone or tablet for camera and on-device OCR end-to-end testing.
- The ML Kit native module does not run in Expo Go. Use the standalone APK built by GitHub Actions or build a custom native APK.

Install and run checks:

    npm install
    npm run typecheck
    npm test
    npx expo-doctor

The GitHub Actions workflow builds a standalone release APK on pushes to main that affect app, services, backend, package configuration, app configuration, brand assets, or the Android build workflow itself. APK artifacts are retained for 14 days. The workflow does not require a cloud OCR secret or endpoint.

## Privacy and production readiness

- Prescription images and OCR text are handled locally by the scan flow.
- Medicine names are sent to openFDA only when the user opens the label lookup screen.
- No patient/prescription history is stored by the current prototype.
- PDF export utility code is not currently exposed as a user-facing screen.
- Before production use, add a threat model, validated data sources, encryption and access controls for any future storage, retention/deletion controls, clinical governance, usability validation, and applicable Indian privacy/regulatory review.

## Project checks

    npm run typecheck
    npm test
    npx expo-doctor

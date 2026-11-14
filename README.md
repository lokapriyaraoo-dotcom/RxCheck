# Rx/Check — Prescription Review Assistant

React Native / Expo Android app starter with on-device Google ML Kit Text Recognition v2. It helps capture prescription images, read printed text, and organise details for human verification.

> **Clinical safety:** This is a prototype, not a medical device or validated clinical decision-support system. It must not diagnose, prescribe, change doses, stop medicines, or suggest substitutions. OCR is fallible and is not a clinical interpretation. A missing interaction warning does not mean medicines are safe together. Always consult a qualified pharmacist or prescriber.

## Current features

- Home-first navigation: scanner, manual verification, and history.
- Camera capture and multi-image gallery selection (up to five images).
- Google ML Kit Text Recognition v2 via `expo-mlkit-ocr`, running on-device. Images are not sent to an OCR cloud service by this OCR integration.
- OCR text is displayed for correction and passed to manual entry as a reading aid; it is **not** silently converted into medicine names or doses.
- Manual patient and medicine entry with explicit unverified status.
- Conservative interaction-check placeholder that refuses to declare combinations safe without a validated source.
- Review findings and PDF export.
- Vitest checks and GitHub Actions CI.
- EAS development and preview APK profiles.

## Requirements

- **Node.js 22 (LTS)** and npm. The project declares Node.js 22 or newer as its supported runtime.
- **Android phone or tablet** for end-to-end camera capture and on-device ML Kit OCR testing. An emulator can be used for UI checks, but a physical device is recommended for camera/OCR validation.
- **Expo account with EAS access** for cloud builds. Install the EAS CLI and sign in before starting a cloud build; local app development and CI checks do not require an EAS account.
- **Expo SDK 54 / React Native 0.81** are pinned by the project dependencies; do not independently upgrade one without checking Expo SDK compatibility.

## Install and run

```bash
npm install
npm run typecheck
npm test
npx expo-doctor
```

The ML Kit native module does **not** run in Expo Go. Build a custom development APK:

```bash
npm install -g eas-cli
eas login
eas build --profile development --platform android
```

Install the generated development APK on your Android phone. Keep the phone and development computer on the same network, then start Metro:

```bash
npx expo start --dev-client
```

For a shareable preview APK:

```bash
eas build --profile preview --platform android
```

EAS prints a build URL when finished. The repository does not contain signing credentials. Builds require your EAS login and may use your EAS build quota.

## How OCR works

1. Take a photo or select up to five prescription images.
2. The app calls Google ML Kit Text Recognition v2 locally on the device.
3. Recognized text is displayed as editable raw text.
4. The user compares it with the original prescription and manually enters the confirmed medicine name, strength, dose, unit, frequency, and duration.
5. The report labels entries as unverified and includes a warning that OCR is not clinical verification.

ML Kit performs text recognition only. It does not understand prescriptions, resolve ambiguous handwriting, calculate safe doses, detect interactions, or determine whether a prescription is appropriate. It may misread drug names, decimal points, units, and handwritten text. If any value is unclear, do not guess.

## Drug-interaction and clinical rules status

No validated drug-interaction database is bundled or connected. `services/interactions.ts` deliberately returns an unknown/incomplete status rather than a false “safe” result. Do not use the app to make treatment decisions. A production integration requires a legally usable, maintained clinical data source, documented coverage and provenance, clinical governance, testing against known cases, and review by qualified pharmacists/clinicians. No automatic medicine alternatives are offered.

## Privacy and security

- OCR is on-device; this code does not upload prescription images for recognition.
- This starter does not persist patient records or create a cloud history.
- PDF sharing is user-initiated and may expose health information to the selected app/person.
- Do not commit real patient prescriptions, personal health data, API keys, signing files, or credentials.
- Before adding storage or a backend, implement consent, encryption, access controls, retention/deletion, threat modelling, and applicable Indian privacy/regulatory review.

## Known limitations before production

- Printed-text OCR only; handwriting recognition is not guaranteed.
- No automated field extraction or confidence score is presented because the selected ML Kit API does not provide a calibrated clinical confidence score.
- No validated dose-range, allergy, pregnancy, renal/hepatic, duplicate-therapy, or interaction engine.
- History is a placeholder; patient data is not saved.
- No clinical validation, regulatory clearance, or production security audit has been completed.

## Build and test

```bash
npm test
npm run typecheck
eas build --profile preview --platform android
```

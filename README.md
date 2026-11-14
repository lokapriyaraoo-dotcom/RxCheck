# Rx/Check — AI Prescription Safety Assistant

A React Native / Expo Android starter for reviewing prescription text and presenting medication-safety checks. The app opens on **Home**, with separate scan, manual-entry, and history paths.

> **Clinical safety:** This is a software prototype, not a medical device or a validated clinical decision-support system. It must not be used to diagnose, prescribe, change doses, stop medication, or automatically substitute medicines. OCR output is untrusted until a person verifies it. Interaction and dose checks in this starter are deliberately limited and must not be treated as complete or clinically validated. For any concern, contact the prescribing clinician or pharmacist. In an emergency, seek urgent medical care.

## Included

- Home-first navigation, manual medicine entry, image selection, and history screen.
- Prescription image capture / gallery selection using Expo APIs.
- OCR adapter boundary with explicit “not configured” behavior rather than pretending that OCR has occurred. Integrate a vetted on-device OCR engine (for example, Google ML Kit through a maintained native Expo module or development build) before production use.
- Explicit manual review of extracted values; no silently inferred medicine names or doses.
- Basic data model for patient context, medicine entries, confidence, and review state.
- Conservative interaction-analysis adapter: does not claim comprehensive coverage or FDA endorsement; no automatic alternatives or medication changes.
- HTML-based printable report export, Vitest tests, and GitHub Actions CI.

## Run locally

```bash
npm install
npx expo start
```

For a native ML Kit integration, use an EAS development build (Expo Go cannot load arbitrary native modules):

```bash
npm install -g eas-cli
eas build --profile development --platform android
```

## Build an Android APK

```bash
npm install -g eas-cli
eas login
eas build --profile preview --platform android
```

EAS will provide a build URL when the build completes. This repository does not include signing credentials.

## OCR integration status

The current scanner can collect images but intentionally does **not** claim to extract text until an OCR adapter is implemented. `services/ocr.ts` defines the boundary. A production implementation should use on-device OCR, image-size limits, preprocessing, and field-level confidence. Every medicine name, strength, unit, frequency, and duration must be shown to the user for verification. Handwriting is particularly error-prone.

## Interaction-check integration status

`services/interactions.ts` is a safe adapter placeholder, not a drug database. Do not ship clinical interaction rules from sample arrays or scraped consumer sites as authoritative. Any future data integration must record source, version/date, evidence, severity, and coverage; escalate uncertain/high-risk cases to a pharmacist/clinician. FDA approval pertains to specific products/labels and does not mean FDA approves a pairwise drug combination or this application.

## Tests

```bash
npm test
```

## GitHub Actions

Vitest runs on pushes and pull requests. The workflow does not publish secrets or build signed release APKs.

## Privacy checklist before production

- Decide whether patient data stays entirely on-device. Avoid uploading prescription images by default.
- Add explicit consent and a retention/deletion policy before any backend storage.
- Never put API keys in `EXPO_PUBLIC_*`; those are bundled into the app.
- Perform security, privacy, accessibility, clinical validation, and regulatory reviews for the target market.

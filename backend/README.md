# Legacy OCR gateway — retired

The current RxCheck Android app uses on-device Google ML Kit text recognition and does not call a Cloudflare Worker for prescription OCR or AI autofill.

- No Google Cloud Vision API key is required by the current app.
- No billing account, OmniRoute settings, OCR gateway URL or hosted OCR service is required.
- Do not configure EXPO_PUBLIC_RXCHECK_AI_URL or add provider credentials to the app.

A Cloudflare Worker may still exist from an earlier setup. Removing legacy source from GitHub does not remove a deployed Worker or its stored secrets. Delete the old Worker in Cloudflare and revoke/delete the old Google Cloud API key separately. Never paste API keys into chat, source control or the Android app.

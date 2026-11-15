# RxCheck prescription OCR gateway

RxCheck uses a Cloudflare Worker with Google Cloud Vision DOCUMENT_TEXT_DETECTION to read prescription images. The Google API key stays in a Cloudflare Worker Secret and is never shipped in the Android app or repository.

## Configure Google Cloud Vision

1. In Google Cloud Console, select the RxCheck project and enable **Cloud Vision API**.
2. Create an API key restricted to **Cloud Vision API**.
3. In Cloudflare, open the `rxcheck-ai-proxy` Worker → Settings → Variables and Secrets.
4. Add `GOOGLE_CLOUD_VISION_API_KEY` as a **Secret** and paste the key value.
5. Save and deploy the Worker.

Do not add OmniRoute settings. The Worker no longer uses OmniRoute.

## Endpoints

- `POST /extract-image`: accepts `{ "imageBase64": "...", "mimeType": "image/jpeg" }`, calls Google Cloud Vision and returns recognized text plus conservative structured field candidates.
- `POST /extract`: accepts `{ "prescriptionText": "..." }` and structures supplied OCR text using the same conservative parser.

The response includes `extracted.patient`, `extracted.medicines`, raw recognized `text`, and a `source` field. The parser intentionally leaves uncertain fields blank; medicine rows are only candidate matches and may be incomplete, especially for handwriting or complex tables.

## App configuration

Set the GitHub Actions variable `RXCHECK_AI_URL` to the deployed Worker URL (without a trailing slash), then rebuild the Android app so it uses the gateway. Never put the Google API key in an Expo public variable.

## Safety and validation

OCR is not a clinical interpretation. Users must compare every patient and medicine field against the original prescription before saving or relying on interaction results. Google Vision may not accurately read handwriting. Test printed and handwritten sample prescriptions and confirm patient demographics and medicine rows before considering prescription autofill complete.

Protect the Worker with rate limiting and appropriate request controls. CORS is not authentication.

## Drug-interaction report

The app currently queries the public openFDA Drug Label API for matching product-label excerpts. It does not have authorized programmatic integrations for Drugs.com, Medscape, Cyntegrity or FDA FDALabel full-text portal. It must not imply that those sources were checked. openFDA label excerpts are not a validated pairwise interaction verdict; a pharmacist or prescriber must review the complete regimen.

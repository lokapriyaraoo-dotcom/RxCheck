# RxCheck AI extraction gateway

The app uses a Cloudflare Worker gateway. After explicit consent, it sends the prescription image to Google Cloud Vision `DOCUMENT_TEXT_DETECTION`, then sends the recognized text to the configured OmniRoute-compatible model to map patient and medicine fields. This removes the need to host a separate PaddleOCR-VL server. The text-only `/extract` endpoint remains as a fallback. This is prescription data extraction only, not diagnosis or clinical interaction validation.

Claude, ChatGPT, Grok and OmniRoute are development/model-provider tools. The app must not expose separate in-app assistant/review buttons for these tools. Do not put provider API keys in the Android app, Expo public variables, or this repository.

## Configure the AI gateway

1. Deploy an OmniRoute-compatible endpoint reachable over HTTPS.
2. In OmniRoute, configure a model for prescription text extraction and create an API key.
3. Enable the Google Cloud Vision API in Google Cloud Console. Create an API key and restrict it to the Cloud Vision API.
4. From the repository root, deploy the Cloudflare Worker:

```sh
npm install
npm install -g wrangler
wrangler login
wrangler deploy
wrangler secret put OMNIROUTE_API_KEY
wrangler secret put GOOGLE_CLOUD_VISION_API_KEY
```

5. In Cloudflare Worker settings, configure:
   - `OMNIROUTE_BASE_URL`: HTTPS base URL for OmniRoute, without `/v1/chat/completions`.
   - `OMNIROUTE_MODEL`: exact model ID configured in OmniRoute.
   - `OMNIROUTE_API_KEY`: encrypted Worker secret only.
   - `GOOGLE_CLOUD_VISION_API_KEY`: encrypted Worker secret only.

The Worker calls Google's `POST https://vision.googleapis.com/v1/images:annotate` endpoint with `DOCUMENT_TEXT_DETECTION`. This is a managed API; no PaddleOCR-VL service or separate OCR server URL is required. See the [official Cloud Vision OCR guide](https://docs.cloud.google.com/vision/docs/ocr) and [document text detection details](https://docs.cloud.google.com/vision/docs/fulltext-annotations).

6. In GitHub repository Settings → Secrets and variables → Actions → Variables, create:
   - `RXCHECK_AI_URL`: deployed Worker URL, for example `https://rxcheck-ai-proxy.<your-subdomain>.workers.dev`, without a trailing slash.

7. Rebuild the Android APK after setting the variable. The build workflow injects only the public Worker URL, never the provider key.

Protect the Worker with rate limits, request-size limits and an authentication/rate-limiting strategy appropriate to your deployment. CORS is not authentication. Do not send real patient prescription data to a provider unless its data handling is appropriate and the patient has been informed.

## AI extraction endpoint

The app sends the prescription image to `POST /extract-image` only after explicit user consent. Google Cloud Vision recognizes document text; OmniRoute maps that text into patient demographics and medicine name, strength, dose, unit, frequency, duration, route and instructions. The prompt instructs the model to leave unreadable or absent values blank rather than invent them. Users must verify every extracted value against the original prescription.

The text-only `POST /extract` endpoint remains available as a fallback. If the gateway URL or Worker secrets are missing, the app falls back to on-device OCR candidates and displays an explicit configuration warning. Cloud OCR and AI results remain unverified and may misread handwriting, medicine names, strengths, units or doses.

## Drug-interaction report

The app currently queries the public openFDA Drug Label API for matching product-label excerpts. It does not yet have authorized programmatic integrations for the Drugs.com Interaction Checker, Medscape Drug Interactions Checker, Cyntegrity Drug Interaction Visualizer or FDA FDALabel full-text portal. The consolidated report must identify these sources as unavailable until a supported, authorized connection is implemented; it must never imply that they were checked.

openFDA label excerpts are not a validated pairwise interaction verdict and must not be used alone for medical-care decisions. Cyntegrity visualizations based on FDA adverse-event reports are signals, not proof of causation. A pharmacist or prescriber must review the complete regimen.

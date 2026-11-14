# RxCheck AI extraction gateway

The app uses an optional Cloudflare Worker as a secure proxy to an OmniRoute-compatible AI endpoint for structuring OCR text into patient and medicine fields. This is a prescription data-extraction feature only; it is not a diagnosis or clinical interaction engine.

Claude, ChatGPT, Grok and OmniRoute are development/model-provider tools. The app must not expose separate in-app assistant/review buttons for these tools. Do not put provider API keys in the Android app, Expo public variables, or this repository.

## Configure the AI gateway

1. Deploy an OmniRoute-compatible endpoint reachable over HTTPS.
2. In OmniRoute, configure the model/provider you choose for prescription text extraction and create an API key.
3. From the repository root, deploy the Cloudflare Worker:

```sh
npm install
npm install -g wrangler
wrangler login
wrangler deploy
wrangler secret put OMNIROUTE_API_KEY
```

4. In Cloudflare Worker settings, configure:
   - `OMNIROUTE_BASE_URL`: HTTPS base URL for the OmniRoute endpoint, without `/v1/chat/completions`.
   - `OMNIROUTE_MODEL`: exact model ID configured in OmniRoute.
   - `OMNIROUTE_API_KEY`: encrypted Worker secret only.

5. In GitHub repository Settings → Secrets and variables → Actions → Variables, create:
   - `RXCHECK_AI_URL`: deployed Worker URL, for example `https://rxcheck-ai-proxy.<your-subdomain>.workers.dev`, without a trailing slash.

6. Rebuild the Android APK after setting the variable. The build workflow injects only the public Worker URL, never the provider key.

Protect the Worker with rate limits, request-size limits and an authentication/rate-limiting strategy appropriate to your deployment. CORS is not authentication. Do not send real patient prescription data to a provider unless its data handling is appropriate and the patient has been informed.

## AI extraction endpoint

The app sends OCR text to `POST /extract` only after user consent. The model returns structured patient demographics and medicine name, strength, dose, unit, frequency, duration, route and instructions. The prompt instructs the model to leave unreadable or absent values blank rather than invent them. Users must verify every extracted value against the original prescription.

If the gateway URL or Worker secrets are missing, the app falls back to on-device OCR candidates and displays an explicit configuration warning. Local OCR alone is not reliable enough to interpret prescription tables or handwriting.

## Drug-interaction report

The app currently queries the public openFDA Drug Label API for matching product-label excerpts. It does not yet have authorized programmatic integrations for the Drugs.com Interaction Checker, Medscape Drug Interactions Checker, Cyntegrity Drug Interaction Visualizer or FDA FDALabel full-text portal. The consolidated report must identify these sources as unavailable until a supported, authorized connection is implemented; it must never imply that they were checked.

openFDA label excerpts are not a validated pairwise interaction verdict and must not be used alone for medical-care decisions. Cyntegrity visualizations based on FDA adverse-event reports are signals, not proof of causation. A pharmacist or prescriber must review the complete regimen.

# RxCheck AI extraction gateway

The app uses a Cloudflare Worker gateway. After explicit consent, it sends the prescription image directly to a vision-capable model through the existing OmniRoute-compatible API. The model reads the document image and returns structured patient and medicine fields. No separately hosted PaddleOCR-VL or Google Cloud Vision service is required. The text-only `/extract` endpoint remains available for on-device OCR text fallback.

Claude, ChatGPT, Grok and OmniRoute are development/model-provider tools. The app must not expose separate in-app assistant/review buttons for these tools. Do not put provider API keys in the Android app, Expo public variables, or this repository.

## Configure the AI gateway

1. Ensure your OmniRoute account has a model that supports image/vision input and prescription/document image reading. Set `OMNIROUTE_MODEL` to that exact model ID. A text-only model will not work for image autofill.
2. Configure the OmniRoute-compatible HTTPS base URL and create an API key.
3. Deploy the Cloudflare Worker from the repository root:

```sh
npm install
npm install -g wrangler
wrangler login
wrangler deploy
wrangler secret put OMNIROUTE_API_KEY
```

4. In Cloudflare Worker settings, configure:
   - `OMNIROUTE_BASE_URL`: HTTPS base URL for the OmniRoute endpoint, without `/v1/chat/completions`.
   - `OMNIROUTE_MODEL`: exact vision-capable model ID configured in OmniRoute.
   - `OMNIROUTE_API_KEY`: encrypted Worker secret only.

5. In GitHub repository Settings → Secrets and variables → Actions → Variables, create:
   - `RXCHECK_AI_URL`: deployed Worker URL, for example `https://rxcheck-ai-proxy.<your-subdomain>.workers.dev`, without a trailing slash.

6. Rebuild the Android APK after setting the variable. The build workflow injects only the public Worker URL, never the provider key.

The Worker accepts `POST /extract-image` with a base64 JPEG, PNG or WebP image and sends it as an OpenAI-compatible multimodal `image_url` message. The image is sent only after the app's explicit AI consent. The Worker accepts images up to approximately 12 MB. Use a model/provider that supports this image input format. Protect the Worker with rate limits and an authentication/rate-limiting strategy appropriate to your deployment. CORS is not authentication.

## AI extraction endpoint

The app sends OCR text to `POST /extract` or the original image to `POST /extract-image` only after user consent. The model returns structured patient demographics and medicine name, strength, dose, unit, frequency, duration, route and instructions. The prompt instructs the model to leave unreadable or absent values blank rather than invent them. Users must verify every extracted value against the original prescription.

If the gateway URL or Worker secrets are missing, the app falls back to on-device OCR candidates and displays an explicit configuration warning. Image-to-autofill requires a vision-capable OmniRoute model and must be tested with sample prescriptions before being relied on. This is data extraction, not clinical interpretation or validation.

## Drug-interaction report

The app currently queries the public openFDA Drug Label API for matching product-label excerpts. It does not yet have authorized programmatic integrations for the Drugs.com Interaction Checker, Medscape Drug Interactions Checker, Cyntegrity Drug Interaction Visualizer or FDA FDALabel full-text portal. The consolidated report must identify these sources as unavailable until a supported, authorized connection is implemented; it must never imply that they were checked.

openFDA label excerpts are not a validated pairwise interaction verdict and must not be used alone for medical-care decisions. Cyntegrity visualizations based on FDA adverse-event reports are signals, not proof of causation. A pharmacist or prescriber must review the complete regimen.

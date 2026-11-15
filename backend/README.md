# RxCheck AI extraction gateway

The app uses a Cloudflare Worker gateway. After explicit consent, it sends the prescription image to a full PaddleOCR-VL layout-parsing service, then sends the structured OCR/layout result to the configured OmniRoute-compatible model to map patient and medicine fields. The text-only `/extract` endpoint remains as a fallback. This is a prescription data-extraction feature only; it is not a diagnosis or clinical interaction engine.

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
wrangler secret put OMNIROUTE_API_KEY\nwrangler secret put PADDLEOCR_VL_API_KEY # only if your Paddle service requires it
```

4. Deploy the **full PaddleOCR-VL service** (not only its standalone VLM inference component) on a machine/service that can run PaddleOCR-VL. The official service listens on port 8080 and exposes `POST /layout-parsing`. For a manual CPU-capable deployment, install PaddleOCR with the document-parser extra and run `paddlex --serve --pipeline PaddleOCR-VL`; a GPU deployment using the official Docker Compose setup is recommended for production throughput. The gateway sends `{ file: <base64 image>, fileType: 1, useDocOrientationClassify: true, useDocUnwarping: true, useLayoutDetection: true }` to this endpoint. See the [official PaddleOCR-VL deployment guide](https://www.paddleocr.ai/latest/en/version3.x/pipeline_usage/PaddleOCR-VL.html).\n\n5. In Cloudflare Worker settings, configure:
   - `OMNIROUTE_BASE_URL`: HTTPS base URL for the OmniRoute endpoint, without `/v1/chat/completions`.
   - `OMNIROUTE_MODEL`: exact model ID configured in OmniRoute.\n   - `PADDLEOCR_VL_URL`: full HTTPS URL to the PaddleOCR-VL service endpoint, including `/layout-parsing`.\n   - `PADDLEOCR_VL_API_KEY`: optional encrypted Worker secret if the PaddleOCR service requires bearer authentication.
   - `OMNIROUTE_API_KEY`: encrypted Worker secret only.

6. In GitHub repository Settings → Secrets and variables → Actions → Variables, create:
   - `RXCHECK_AI_URL`: deployed Worker URL, for example `https://rxcheck-ai-proxy.<your-subdomain>.workers.dev`, without a trailing slash.

7. Rebuild the Android APK after setting the variable. The build workflow injects only the public Worker URL, never the provider key.

Protect the Worker with rate limits, request-size limits and an authentication/rate-limiting strategy appropriate to your deployment. CORS is not authentication. Do not send real patient prescription data to a provider unless its data handling is appropriate and the patient has been informed.

## AI extraction endpoint

The app sends OCR text to `POST /extract` only after user consent. The model returns structured patient demographics and medicine name, strength, dose, unit, frequency, duration, route and instructions. The prompt instructs the model to leave unreadable or absent values blank rather than invent them. Users must verify every extracted value against the original prescription.

If the gateway URL, Worker secrets, or PaddleOCR-VL service URL are missing, the app falls back to on-device OCR candidates and displays an explicit configuration warning. The app does not bundle or run PaddleOCR-VL on the Android device; it requires the separately deployed server. Local OCR alone is not reliable enough to interpret prescription tables or handwriting.

## Drug-interaction report

The app currently queries the public openFDA Drug Label API for matching product-label excerpts. It does not yet have authorized programmatic integrations for the Drugs.com Interaction Checker, Medscape Drug Interactions Checker, Cyntegrity Drug Interaction Visualizer or FDA FDALabel full-text portal. The consolidated report must identify these sources as unavailable until a supported, authorized connection is implemented; it must never imply that they were checked.

openFDA label excerpts are not a validated pairwise interaction verdict and must not be used alone for medical-care decisions. Cyntegrity visualizations based on FDA adverse-event reports are signals, not proof of causation. A pharmacist or prescriber must review the complete regimen.

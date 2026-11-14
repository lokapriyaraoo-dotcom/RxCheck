# RxCheck Claude + OmniRoute gateway

RxCheck's Claude review is an optional AI helper. The Android app calls this Cloudflare Worker; the Worker calls OmniRoute. **Never put an Anthropic or OmniRoute API key in the Android app, Expo public variables, or this repository.**

## 1. Prepare OmniRoute

1. Deploy/run an OmniRoute instance reachable over HTTPS.
2. In its dashboard, connect an Anthropic provider (or another provider that offers a Claude model).
3. Create an OmniRoute endpoint API key.
4. Confirm the Claude model ID in the OmniRoute model catalog. Use the exact provider/model ID, not a guessed alias.

OmniRoute's OpenAI-compatible endpoint is `/v1/chat/completions`.

## 2. Deploy the RxCheck proxy

From a computer with Node.js and Wrangler installed, at the repository root:

```sh
npm install -g wrangler
wrangler login
wrangler deploy
wrangler secret put OMNIROUTE_API_KEY
```

Paste the OmniRoute endpoint key only when Wrangler prompts for it. In Cloudflare Dashboard → Workers & Pages → rxcheck-ai-proxy → Settings → Variables and Secrets, add:
- `OMNIROUTE_BASE_URL`: the HTTPS base URL of the OmniRoute server (without the `/v1/chat/completions` path)
- `OMNIROUTE_MODEL`: exact Claude model ID from the OmniRoute catalog

Set `OMNIROUTE_API_KEY` as an encrypted secret, not a plain variable.

**Protect the public Worker endpoint:** configure Cloudflare rate limiting/WAF rules for `POST /analyze` and `POST /extract` and monitor usage. The Worker limits input size but the endpoint is publicly reachable; CORS is not authentication.

## 3. Connect the Android build

In GitHub repository Settings → Secrets and variables → Actions → Variables, create:
- Name: `RXCHECK_AI_URL`
- Value: the deployed Worker origin, for example `https://rxcheck-ai-proxy.<your-subdomain>.workers.dev` (no trailing slash)

Run the Android APK workflow again. It injects this public proxy URL into the app. No provider key is included in the APK.

## What the AI feature does and does not do

The prescription flow sends on-device Google ML Kit OCR text to `POST /extract` so the configured AI model can organize patient demographics and medicine names, strengths, doses, frequency, duration, route and instructions into form fields. The app does not show the raw editable OCR transcript. The manual details page also has a **Review prescription with Claude AI** action. Before AI processing, the user should be informed that prescription text is sent to the configured Worker/OmniRoute/provider. It does not perform validated drug-interaction checking, confirm FDA approval, diagnose, prescribe, or recommend substitutions. Continue to use the linked clinical interaction checkers and ask a pharmacist/prescriber to review findings.

Prescription and patient information is sent to the configured Worker/OmniRoute/provider when the user consents. Use only a provider and deployment whose data handling is appropriate for the information being processed.

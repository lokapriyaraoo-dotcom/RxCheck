# Offline handwriting OCR integration plan

## Goal
Add a second, fully on-device OCR path for handwritten and printed prescription images without sending images or OCR text to a cloud OCR provider.

## Current behaviour (do not overstate)
- Google ML Kit Text Recognition v2 is the only OCR engine currently wired into the app.
- It is used for printed text.
- Handwriting recognition is not integrated. Handwritten fields must be entered manually.
- Local extraction is heuristic and every extracted value is unverified.

## Selected implementation direction
Evaluate the official PaddleOCR PP-OCRv5 mobile Android SDK as a separate handwriting-capable engine, while retaining ML Kit for the existing printed-text path. The English recognition model is a candidate, not a guarantee of reliable handwriting recognition. It must be tested on real prescriptions before enabling automatic routing.

## Implementation status (2026-11-15)

- Vendored the official PaddleOCR Android SDK Kotlin source under `modules/rxcheck-paddle-ocr/android/src/main/java/com/paddle/ocr/`.
- Added an Expo local native module bridge named `RxCheckPaddleOcr` that reads only local `file://` and `content://` image URIs.
- Added pinned PP-OCRv5 mobile detection and English recognition ONNX model downloads to the Android Gradle build, with SHA-256 verification for both ONNX weight files. The matching YAML recognition dictionary is fetched from the same pinned revision.
- Added a separate **TRY HANDWRITING OCR (EXPERIMENTAL)** action in the scanner. Printed OCR remains on Google ML Kit.
- Android release build and real-device behaviour still need to pass; handwriting accuracy on prescription writing is not validated.

## Required engineering work
1. Pin an immutable upstream PaddleOCR SDK revision and inspect its licence and transitive dependencies. (Source and Apache-2.0 licence are now vendored; a full dependency/build audit remains.)
2. Obtain the matching PP-OCRv5 mobile detection and English recognition ONNX models plus the required model configuration. Pin immutable model revisions and verify SHA-256 hashes during build; never download an unpinned model from a moving branch.
3. Integrate the SDK through an Expo Modules API Android native module compatible with Expo SDK 54, React Native 0.81, Java 17 and the generated Gradle project. (Bridge and local module registration are now added; Gradle verification remains.)
4. Expose a narrow native API accepting a local image URI/bytes and returning ordered text lines plus engine metadata. Do not add any network upload path. (Implemented for local Android URIs.)
5. Add deterministic error handling for missing models, unsupported images, low-confidence output, cancellation and native runtime failures.
6. Keep the existing ML Kit path as the printed-text fallback. Do not silently treat PaddleOCR output as verified.
7. Add tests for native-module availability, result mapping, empty output and parser regression. Build a release APK in CI.
8. Test with diverse real-world printed and handwritten prescriptions, including poor lighting, cursive writing, mixed scripts, abbreviations and multi-column layouts. Record failure rates before enabling the handwriting option.

## Clinical safety requirements
- Every OCR field is a candidate requiring user confirmation against the original prescription.
- Never auto-correct or infer a medicine, strength, dose, decimal, unit, frequency or duration as though confirmed.
- Low confidence or ambiguous output must be shown as unclear and sent to manual entry.
- Do not claim a medicine combination is safe based on OCR or a missing database match.
- Do not upload prescription images or OCR content to a cloud OCR service.

## Acceptance criteria
- The native engine runs entirely on-device in a standalone Android build.
- No image or OCR text is transmitted to a remote OCR endpoint (verify with code review/network inspection).
- Model files are pinned and checksum-verified.
- Existing printed OCR and current tests continue to work.
- CI successfully builds the APK.
- Handwriting support is only announced after representative device testing; otherwise the UI continues to state that handwriting must be entered manually.

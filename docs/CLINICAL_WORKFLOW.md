# RxCheck clinical workflow

## Execution sequence

1. Prescription OCR extracts medicine candidates. The user confirms each name and dose against the original.
2. Normalize entered medicine names and resolve ingredients against the on-device SQLite catalogue. Unmatched names stay unknown and require confirmation.
3. Deduplicate medicine names and generate every unique pair (n × (n − 1) / 2).
4. Check each pair against the pharmacist-reviewed interaction records. Only a reviewed record may produce a severity; missing or unreviewed coverage remains UNKNOWN.
5. Retrieve individual FDA label evidence where the existing openFDA lookup is available. A label excerpt is supporting product information, not a pairwise DDI verdict.
6. Food–drug interactions remain NOT ASSESSED until RxCheck has a maintained, evidence-linked food interaction dataset and relevant food/exposure inputs.
7. Compile the interaction findings and verification gaps into FINAL REPORT for pharmacist/prescriber review.

## Current execution limits

- The bundled interaction record list is currently empty; therefore no pair can receive a clinical severity from the bundled DDI database yet.
- The starter SQLite catalogue contains 12 generic/synonym entries, not a comprehensive drug-information database.
- openFDA lookup is limited to the first 8 medicine names in the current screen and returns individual labels only.
- FDA FDALabel, licensed interaction databases and pharmacology-study ingestion are not connected.
- No food-interaction rules are currently loaded.
- These gaps are displayed as UNKNOWN / NOT ASSESSED and must never be interpreted as a negative interaction check.

## Release gates

- Confirm licences and API permissions for each external dataset.
- Add provenance, source version/date and update metadata to imported records.
- Require named pharmacist verification, evidence citation and review date for clinical interaction rules.
- Test ingredient resolution, exhaustive pair generation, unknown handling, source failures and stale-report invalidation.

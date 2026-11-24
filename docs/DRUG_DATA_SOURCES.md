# RxCheck drug-data integration plan

This project must not bundle or redistribute a source until its current licence and permitted use have been checked. A public API or publicly downloadable file is not automatically licensed for redistribution inside a commercial mobile app.

## Candidate sources and intended use

| Source | Intended use | Integration status | Release gate |
|---|---|---|---|
| RxNorm / RxNav | Normalised ingredient and medicine concepts; possible brand-to-ingredient mapping | Not integrated | Confirm current API terms, attribution and redistribution rights; verify current interaction API availability before depending on it |
| WHO Essential Medicines List | Reference list of essential generic medicines | Not integrated | Check WHO terms and permitted redistribution |
| WHO ATC | Drug-class coding and classification | Not integrated | Check WHO licensing and attribution requirements |
| openFDA Drug Label API | Secondary US label evidence, queried by generic/brand name | Existing individual-label lookup only | Keep explicitly secondary; no-match remains UNKNOWN; no pairwise interaction checker |
| DailyMed (NLM) | US structured product labels | Not integrated | Check bulk-data terms and suitability for offline redistribution |
| CDSCO | Indian regulatory/approval reference data | Not integrated | Confirm source terms, update cadence and permitted reuse |
| PMBJP / Jan Aushadhi | Indian generic medicine catalogue | Not integrated | Obtain official reusable data and confirm redistribution terms |
| NLEM | Indian National List of Essential Medicines | Not integrated | Confirm current edition and permitted reuse |
| Indian Pharmacopoeia Commission | Indian quality standards and PvPI references | Not integrated | Do not reproduce protected standards without permission; use public safety notices only where permitted |
| DrugBank | Ingredient and interaction knowledge | Not integrated | Commercial licence required for commercial use; academic/open data terms are not a commercial-app licence |
| Lexicomp / Micromedex / Medscape / Drugs.com | Potential professional interaction checking | Not integrated | Require an authorised licence/API agreement; do not scrape or automate consumer websites |
| Indian pharmacy catalogues (1mg, Apollo, PharmEasy, Truemeds) | User-directed product search only | Search links exist | Do not scrape, bulk-copy or imply live stock/price/product verification without a partnership/API |

## Local database target

The planned versioned local database should contain, only where legally licensed:
- Normalised ingredient/generic concepts and synonyms
- Indian brand-to-salt mappings, including source and last-verified date
- ATC identifiers and classification
- High-alert medicine reference entries
- Look-alike / sound-alike medicine pairs
- High-risk interaction pairs reviewed and signed off by a qualified pharmacist
- Provenance, licence, dataset version, effective date and update date for every imported dataset

## Safety and release requirements

- No interaction pair may be labelled safe merely because it is absent from the local table or openFDA.
- Distinguish matched, no-match/unknown, not-checked, and source-unavailable states.
- Pairwise high-risk content must have a named pharmacist reviewer, evidence reference, review date and review/expiry policy.
- Do not present adverse-event co-reporting as proof of a causal interaction.
- Background updates must be signed/versioned, integrity-checked and able to roll back to the last known-good dataset.
- Send only the minimum medicine-name query data to external sources; never send patient identifiers or prescription images.
- Do not enable clinical interaction clearance until a licensed/authorised source or pharmacist-governed validated dataset is integrated and tested.

## Decisions needed before implementation

1. Which licensed interaction source/API will RxCheck use, if any, and what is the licence scope/cost?
2. Who is the named pharmacist responsible for reviewing and maintaining the high-risk pair table?
3. Which sources have written permission for offline redistribution in the app?
4. Is the first release limited to India, or must it support other markets?

Until these are resolved, RxCheck must show interaction results as unknown/not checked rather than generating unsupported safety conclusions.

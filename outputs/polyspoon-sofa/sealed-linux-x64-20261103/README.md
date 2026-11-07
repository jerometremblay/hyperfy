# Cognac leather sofa: sealed review subject

Polyspoon's original verifier completed successfully on Linux x86-64 with Node 22.22.1. The subject was sealed using `recipe:review seal` and binds the complete unchanged verification evidence in `verification/`.

- Subject ID: `cd3b03bb46af2739e857f2fefd0e3e02686deafff23c85e9b73e4f5563452ac9`
- Recipe: `cognac-leather-sofa` 1.1.0
- Evidence: 233 files, 38,000,049 bytes
- Tests: 73 recipe tests and the sofa-specific behavior test passed; 21 validation cases, renders, export and package checks passed.
- The subject is technical evidence, not publication or independent human approval.

## Upload blocker

The checked Polyspoon server accepts at most 16 MiB for all evidence and 2 MiB per file. This evidence is 38,000,049 bytes; `validation/report.json` alone is 2,286,800 bytes. The server's subject input rejects it. No evidence has been removed or altered to bypass these limits.

The source and reproducibility inputs are in `../submission-20261103/` and `../polyspoon-recipe/`. The verifier recorded paths from its temporary Linux checkout. Uploaders should select `subject.json` and the complete `verification/` folder; the local sealing tool must be rerun from the original checkout paths to reproduce its original local verification context.

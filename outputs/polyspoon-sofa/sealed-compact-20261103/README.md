# Compact sofa review subject

Status: **submitted for review** under Jérôme Tremblay’s Polyspoon account. The site verified all 93 files and queued the contribution for independent technical processing. `submission-status.jpg` records the confirmation.

The complete unchanged verification evidence is in `verification/`, with its sealed subject in `subject.json`. The checked Polyspoon server accepts at most 16 MiB in total and 2 MiB per file.

- Subject: `799b2b4eb723af806e6e09f9113a43ce2d6eb8c879f003b7fcdcb297ed8416de`
- Recipe: `cognac-leather-sofa` 1.1.0; content license CC0-1.0, recipe code Apache-2.0
- Evidence: 93 files, 9,062,287 bytes; largest file 1,430,702 bytes (`validation/report.json`)
- All 74 recipe tests, sofa behavior tests, 21 validation cases, two Unity fixtures, renders, export, source package and package integrity passed on Linux x86-64 and Node 22.22.1.
- This run uses the compact workflow change in `compact-workflow.patch`: validation GLBs are retained as gzip files and verified after decompression; only the selected recipe is packaged. The original large seal is preserved separately.
- This is technical evidence; independent review and site-side processing remain separate.

Recipe source and the base contribution patch are in `../polyspoon-recipe/` and `../submission-20261103/`.

# Rebuild editable generator source

This package contains the default design. It does not capture later browser edits.
Save your current design separately, then pass it with --config.

Review the manifest, executable sources, dependency lockfile and notices first.
Use an isolated workspace for external code. Validation and hashes do not establish trusted authorship.
Extraction and inspection do not run generation. These commands deliberately install and execute code.

Use Node.js 22.22.1 and npm 10 or later. Other versions are not covered by the recorded rebuild evidence.

    npm ci --ignore-scripts --no-audit --no-fund
    npm run rebuild -- --config config.json --out output.glb
    npm run rebuild -- --config my-saved-design.json --out changed.glb

The pinned compiler emits JavaScript into .recipe-build, then invokes the shared production catalog.
Original TypeScript remains editable. Compilation uses --noCheck only for portable execution;
contributors must run the repository typecheck and tests before review.
Build produces a GLB and a .report.json file containing geometry/config hashes and bounds.
Palette, shading, and per-part colors use the same saved-design loading and appearance path as the catalog.

Only config.json supplied in this package has the author-declared content license CC0-1.0.
Editable project-authored software and control schemas are Apache-2.0. Dependencies retain their notices.
Your edits and private inputs are not automatically published or assigned a license by this tool.
Rigged recipes retain bound skeletons and animation clips in GLB exports. Other recipes remain static. The .mjs snapshot download from the site is a separate, non-procedural product.

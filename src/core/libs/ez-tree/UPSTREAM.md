# EZ-Tree source

This folder contains the library source from [dgreenheck/ez-tree](https://github.com/dgreenheck/ez-tree) at commit `dcf309bd86bd521083d9c70f01f2de45fdc7c457`.

The published npm package is still at 1.1.0 and does not contain the LOD API used here. The source is vendored so Hyperfy's client build can bundle the upstream implementation directly. Hyperfy also updates each Stage-cloned leaf shader from `Tree.update()` so wind remains animated across all detail levels. The upstream library leaves bark and leaf maps to its host application; `textures.js` restores the default maps from the published package. See `LICENSE` for the upstream MIT license and `TEXTURES.md` for texture sources.

Upstream was checked on 2026-10-18: `main` was at `dcf309bd86bd521083d9c70f01f2de45fdc7c457`, and `release/v2.0.0` was at `9c4428c16c003a0d7619e3113ee75484bcc8794c`. The vendored tree generator includes the release branch's LOD implementation, with Hyperfy's Stage wind update retained. The repository had no separate `dev` branch.

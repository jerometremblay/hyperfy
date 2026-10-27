# Upstream code

BananaDarts: Lightstreamer/BananaDarts-client-javascript, commit
`57931676d00d524ecc1a8586bc8391eb804ef7aa`, Apache-2.0.
`vendor/bananadarts/Dart.upstream.js` preserves the original class.
`flight.js` extracts its ballistic position and boundary-time calculations.
Changes: pure array inputs, explicit elapsed time, metres/seconds, Earth gravity,
exact forward-time board/floor termination from the actual player position;
renderer, networking and wall-clock removed.
See `vendor/bananadarts/LICENSE`.

Dart Room: crispierry/dart-room, commit
`eb2bc2c9be6beb8649141bf68de81bfca0a6c9c7`, MIT, copyright Cris Pierry.
`vendor/dart-room/darts.ts` contains the upstream scoring and game-rule helpers.
Changes: board radii, target positions and CPU dispersion expressed in regulation
steel-tip metres. 501 uses the same countdown rules as 301.
See `vendor/dart-room/LICENSE`.

Mixamo: `Generic/throw.fbx`, sourced from S-N-D-R/UnityMixamoLibrary commit
`9f33e463b63bc593d78b30374117638cd0d2ddd5`; SHA-256
`5e3ab8ffcc10d4a6382c2aca4589ca8ed28050222241152051e22cac41e58479`.
Adobe's Mixamo FAQ permits royalty-free use of its animations in commercial games:
https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html
This animation remains governed by Adobe's terms; it is not GPL or CC0.
`prepare-throw.mjs` extracts only the right shoulder, upper arm, forearm and wrist
rotation tracks, plays them at double speed, and exports `throw.glb` for embedding
in the game. It includes no animated root, torso, legs, left arm or model meshes.
The game releases at 0.45 seconds, during the forward arm motion.

The surrounding integration is part of this GPL-3.0-only Hyperfy repository.
Packaging retains upstream license notices. No upstream renderer or hosted
network service is required.

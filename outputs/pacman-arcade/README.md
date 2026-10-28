# Playable Pac-Man cabinet — world 3333

Live app `qvd9yxCHYg`, instance `lrtr77gRDH`. Click the CRT to play;
WASD (or arrow keys) steers, Space pauses, Escape leaves. E offers a close
view before clicking. Click again to resume; click or Enter restarts after
Game Over. Each player has an independent local game.

The idle CRT uses `idle-screen.png`, a fixed capture of the existing game's title
artwork with its controls and attribution, through the native Image node. Clicking
it or pressing E mounts the game WebView in the same inclined CRT plane. The local
camera and captured movement controls prevent the avatar from walking while playing.
Escape unloads the game, restores the fixed texture and releases those controls.
Each visit starts a fresh local game; Space still pauses during a visit.
An idle cabinet has no game iframe, CSS layer or app update callback.

## Source and licenses

Reused [mumuy/pacman](https://github.com/mumuy/pacman), upstream commit
`8a96194f7cf0102db2d7f0e69450166beb1d7116`, by HaoLe Zheng / passer-by.com.
The original gameplay, ghosts, collisions, scoring, lives, and twelve levels are
in `src/client/public/games/pacman/vendor/`. The MIT license is included. The
Press Start 2P font has its separate SIL Open Font License alongside it.

Changes to vendored JavaScript: WASD aliases, allow non-game keys through,
ignore repeated pause/start presses, correct scaled canvas click coordinates,
expose the game object to the cabinet adapter, use a local font URL, and initialize
even if the font fails. The original website wrapper (external scripts and
redirects) is replaced with a small local page and a visible attribution link.

`src/client/public/games/pacman/arcade.js` adds click-to-start/restart, focus
handling, pause on blur, and Escape messaging. All game assets are served by
world 3333 itself. The normal build copies these files into `build/public`.

## Validation

Run from the repository root:

```sh
node outputs/pacman-arcade/verify.mjs
node --test src/core/nodes/WebView.test.mjs
```

The first check executes the cabinet with the real Hyperfy node constructors
and tests its screen normal, message origin check, movement capture, and release.
It also runs the vendored game with its actual animation loop and input handlers
to verify WASD in all four directions, blocked walls, pellet collection, score
rendering, four ghosts, pause/resume, focus loss, Escape, restart, and twelve levels.
The generic skill smoke harness lacks Matrix4, so the target constructor check
is used for this app instead.

Verified live in the browser: the tilted screen displays the game without
mirroring, clicking enters the close view, score advances, Space pauses, and
Escape restores the world view and its normal controls.

The original script and blueprint are backed up here. `cabinet.js` is the live
replacement source; `blueprint-deployed.json` records its latest live version.
No engine changes or Git commits are needed.

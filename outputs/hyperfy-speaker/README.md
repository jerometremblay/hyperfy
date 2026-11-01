# Connected world speaker

The `Hyperfy Speaker` app is deployed to the `online-world` profile at
`https://monstre.duckdns.org:3333`, beside the pool table.

- Instance: `3460b708-9c49-557d-ba1d-7fa78b6cd182`
- Position: `[32.1, 0.121, 9.7]`
- Mac helper: `/Applications/Hyperfy Speaker.app`
- Helper settings: `~/Library/Application Support/Hyperfy Speaker/config.json`
- World write token: macOS Keychain, service `org.hyperfy.speaker`

Open the helper. With saved world and speaker settings, it starts streaming
automatically and shows **Streaming to Hyperfy** in its window and menu bar.
If stopped, choose **Start Streaming** in that window. Select **Hyperfy Speaker**
as the Mac sound output, then play music. Keep Hyperfy's playback device on
**Haut-parleurs MacBook Pro** or physical headphones.
Sound follows the app when moved and fades out over 40 meters.

Keep the helper running while sending music to the world. Opening it again
brings its status window forward. No Mac system output is changed automatically.

## Local services

LiveKit and its TLS proxy run as the user's launch agents:

- `org.hyperfy.speaker.livekit`: signaling on loopback port 7884, media on
  TCP 7881 and UDP 7882.
- `org.hyperfy.speaker.proxy`: TLS signaling at
  `wss://monstre.duckdns.org:7880`, using the world's existing certificate.

Private service configuration lives under
`~/Library/Application Support/Hyperfy Speaker/LiveKit`. The engine's ignored
`.env.local` contains its LiveKit connection settings. Both services start at
login. The existing Hyperfy development server was restarted to load the settings.
This setup targets the Mac and its current local network address.

## Verification

`deployment.json` records the version-safe live creation and asset readback.
`audio-validation.json` records received audio frames from the full path:

Mac virtual output → installed Mac capture worker → TLS LiveKit → remote track.

The check sends a generated test tone to the virtual output. It saves only frame
counts and peak amplitude; no audio samples or credentials are written here.
`stream-validation.json` records a subsequent check of the running native helper
with the Mac's existing audio: 499 decoded frames, a nonzero signal, and the
virtual output selected. Browser playback confirmation is recorded separately.
`receiver-validation.json` records the browser fix: Chrome received packets but
did not start audio playout until LiveKit's normal playback element was attached.
The SDK's extra output stays muted; sound uses the spatial Music path. The user
confirmed hearing music, and a regression test covers attachment and cleanup.
`quality-validation.json` records the capture timing fix: Core Audio's default
high latency delivered roughly 85 ms bursts into a 60 ms capture buffer, dropping
281 ten-millisecond blocks in 15 seconds. Low-latency capture and 200 ms bounded
capture/SDK buffers preserved every block in the isolated publisher check.
`speaker.js` and `hyperfy-speaker.hyp` passed primitive and package validation.
The exact-package `preview.html` was visually inspected from multiple sides.

`deploy.mjs` refuses an existing speaker with changed source and preserves all
other app blueprints and placements. A repeated setup preserves the speaker's
current placement.

# Complete fork change inventory

Pinned official main: `5d20037435a1d86cda088382bb12737e9f18d5f6`. Documented checkout: `192087f8bc776b3733573dad5156fb3e6d57d7d5`.

Generated from the exact two-tree Git diff: **254 paths**. A = added, M = modified, D = deleted. Line counts are added/deleted lines; binary files show “binary”. Every path appears once below. Shared files can serve several features; the guide describes those overlaps.

[Read the behavior and screenshot guide](fork-changes.md).

## Changed files

### 1. Gaussian splats (15 files)

[Behavior and evidence](fork-changes.md#1-gaussian-splats-and-their-loading-pipeline).

| Status | Path | Lines + / − |
| --- | --- | --- |
| A | [apps/GaussianSplat.js](../apps/GaussianSplat.js) | 176 / 0 |
| A | [docs/gaussian-splatting-implementation.md](../docs/gaussian-splatting-implementation.md) | 370 / 0 |
| A | [docs/gaussian-splatting-todo.md](../docs/gaussian-splatting-todo.md) | 281 / 0 |
| A | [examples/spark-advanced-test.js](../examples/spark-advanced-test.js) | 154 / 0 |
| A | [examples/spark-debug-test.js](../examples/spark-debug-test.js) | 79 / 0 |
| A | [examples/spark-splat-controls.js](../examples/spark-splat-controls.js) | 174 / 0 |
| A | [examples/spark-splat-test.js](../examples/spark-splat-test.js) | 94 / 0 |
| A | [src/core/nodes/GaussianSplat.js](../src/core/nodes/GaussianSplat.js) | 483 / 0 |
| M | [src/core/systems/ClientLoader.js](../src/core/systems/ClientLoader.js) | 64 / 5 |
| M | [src/core/systems/ServerLoader.js](../src/core/systems/ServerLoader.js) | 2 / 2 |
| A | [src/core/utils/sparkCache.js](../src/core/utils/sparkCache.js) | 24 / 0 |
| A | [src/core/utils/splatFormats.js](../src/core/utils/splatFormats.js) | 96 / 0 |
| A | [src/core/utils/splatFormats.test.mjs](../src/core/utils/splatFormats.test.mjs) | 15 / 0 |
| A | [src/world/collections/default/gs-icon.png](../src/world/collections/default/gs-icon.png) | binary |
| A | [src/world/collections/default/gs.hyp](../src/world/collections/default/gs.hyp) | binary |

### 2. Rendering, lights, and shadow culling (21 files)

[Behavior and evidence](fork-changes.md#2-rendering-lights-and-live-shadow-performance).

| Status | Path | Lines + / − |
| --- | --- | --- |
| A | [docs/lighting-optimization-e4.json](../docs/lighting-optimization-e4.json) | 131 / 0 |
| A | [docs/lighting-optimization-e5.json](../docs/lighting-optimization-e5.json) | 156 / 0 |
| A | [docs/lighting-optimization-e6.json](../docs/lighting-optimization-e6.json) | 338 / 0 |
| A | [docs/lighting-optimization-e7.json](../docs/lighting-optimization-e7.json) | 116 / 0 |
| A | [docs/lighting-optimization-e8.json](../docs/lighting-optimization-e8.json) | 87 / 0 |
| A | [docs/lighting-optimization-e9.json](../docs/lighting-optimization-e9.json) | 228 / 0 |
| A | [docs/lighting-optimization-results.json](../docs/lighting-optimization-results.json) | 152 / 0 |
| A | [docs/lighting-optimization.md](../docs/lighting-optimization.md) | 406 / 0 |
| A | [docs/scripting/nodes/types/Light.md](../docs/scripting/nodes/types/Light.md) | 141 / 0 |
| A | [scripts/caster-culling-experiment.js](../scripts/caster-culling-experiment.js) | 56 / 0 |
| A | [scripts/lighting-benchmark.js](../scripts/lighting-benchmark.js) | 171 / 0 |
| A | [scripts/point-shadow-refresh-experiment.js](../scripts/point-shadow-refresh-experiment.js) | 79 / 0 |
| A | [scripts/staggered-point-shadow-experiment.js](../scripts/staggered-point-shadow-experiment.js) | 110 / 0 |
| A | [scripts/test-light-shadows.mjs](../scripts/test-light-shadows.mjs) | 26 / 0 |
| A | [src/core/libs/csm/CSM.browser-test.js](../src/core/libs/csm/CSM.browser-test.js) | 99 / 0 |
| M | [src/core/libs/csm/CSM.js](../src/core/libs/csm/CSM.js) | 4 / 4 |
| A | [src/core/nodes/Light.js](../src/core/nodes/Light.js) | 306 / 0 |
| A | [src/core/nodes/Light.test.mjs](../src/core/nodes/Light.test.mjs) | 58 / 0 |
| M | [src/core/systems/ClientGraphics.js](../src/core/systems/ClientGraphics.js) | 118 / 34 |
| M | [src/core/systems/Stage.js](../src/core/systems/Stage.js) | 382 / 13 |
| A | [src/core/systems/Stage.test.mjs](../src/core/systems/Stage.test.mjs) | 184 / 0 |

### 3. Day-night and synchronized time (9 files)

[Behavior and evidence](fork-changes.md#3-location-based-daynight-cycle-and-synchronized-world-time).

| Status | Path | Lines + / − |
| --- | --- | --- |
| A | [docs/day-night-cycle.md](../docs/day-night-cycle.md) | 103 / 0 |
| A | [scripts/test-day-night-lighting.mjs](../scripts/test-day-night-lighting.mjs) | 29 / 0 |
| A | [src/core/extras/dayNight.js](../src/core/extras/dayNight.js) | 121 / 0 |
| A | [src/core/extras/dayNight.test.mjs](../src/core/extras/dayNight.test.mjs) | 120 / 0 |
| M | [src/core/systems/ClientEnvironment.js](../src/core/systems/ClientEnvironment.js) | 118 / 0 |
| A | [src/core/systems/ClientEnvironment.test.mjs](../src/core/systems/ClientEnvironment.test.mjs) | 237 / 0 |
| A | [src/core/systems/ClientNetwork.time.test.mjs](../src/core/systems/ClientNetwork.time.test.mjs) | 188 / 0 |
| A | [src/core/systems/ServerNetwork.settings.test.mjs](../src/core/systems/ServerNetwork.settings.test.mjs) | 185 / 0 |
| M | [src/core/systems/Settings.js](../src/core/systems/Settings.js) | 39 / 2 |

### 4. Portals (9 files)

[Behavior and evidence](fork-changes.md#4-native-portal-views-and-traversal).

| Status | Path | Lines + / − |
| --- | --- | --- |
| A | [docs/scripting/nodes/types/Portal.md](../docs/scripting/nodes/types/Portal.md) | 72 / 0 |
| A | [outputs/world-portal/WorldPortal.hyp](../outputs/world-portal/WorldPortal.hyp) | binary |
| A | [outputs/world-portal/WorldPortal_preview.html](../outputs/world-portal/WorldPortal_preview.html) | 86 / 0 |
| A | [outputs/world-portal/portal-camera-clearance.jpg](../outputs/world-portal/portal-camera-clearance.jpg) | binary |
| A | [outputs/world-portal/portal-preview.jpg](../outputs/world-portal/portal-preview.jpg) | binary |
| A | [outputs/world-portal/world_portal.js](../outputs/world-portal/world_portal.js) | 264 / 0 |
| A | [src/core/extras/portalCamera.js](../src/core/extras/portalCamera.js) | 80 / 0 |
| A | [src/core/nodes/Portal.js](../src/core/nodes/Portal.js) | 196 / 0 |
| A | [src/world/collections/default/WorldPortal.hyp](../src/world/collections/default/WorldPortal.hyp) | binary |

### 5. Extruded/invisible primitives (4 files)

[Behavior and evidence](fork-changes.md#5-extruded-primitives-and-invisible-interaction-geometry).

| Status | Path | Lines + / − |
| --- | --- | --- |
| M | [docs/scripting/nodes/types/Prim.md](../docs/scripting/nodes/types/Prim.md) | 87 / 2 |
| A | [examples/irregular-extrude.hyp](../examples/irregular-extrude.hyp) | binary |
| A | [examples/irregular-extrude.js](../examples/irregular-extrude.js) | 25 / 0 |
| M | [src/core/nodes/Prim.js](../src/core/nodes/Prim.js) | 346 / 28 |

### 6. Private/shared browsers (18 files)

[Behavior and evidence](fork-changes.md#6-private-webviews-and-shared-browsers).

| Status | Path | Lines + / − |
| --- | --- | --- |
| A | [docs/scripting/nodes/types/Browser.md](../docs/scripting/nodes/types/Browser.md) | 59 / 0 |
| A | [docs/scripting/nodes/types/WebView.md](../docs/scripting/nodes/types/WebView.md) | 129 / 0 |
| A | [examples/PrivateBrowser.hyp](../examples/PrivateBrowser.hyp) | binary |
| A | [examples/SharedBrowser.hyp](../examples/SharedBrowser.hyp) | binary |
| A | [examples/browser.hyp](../examples/browser.hyp) | binary |
| A | [examples/browser.js](../examples/browser.js) | 13 / 0 |
| A | [examples/private-browser.js](../examples/private-browser.js) | 13 / 0 |
| A | [src/core/nodes/Browser.js](../src/core/nodes/Browser.js) | 466 / 0 |
| A | [src/core/nodes/Browser.test.mjs](../src/core/nodes/Browser.test.mjs) | 286 / 0 |
| A | [src/core/nodes/WebView.js](../src/core/nodes/WebView.js) | 454 / 0 |
| A | [src/core/nodes/WebView.test.mjs](../src/core/nodes/WebView.test.mjs) | 40 / 0 |
| A | [src/core/systems/ClientEnvironment.browser-test.js](../src/core/systems/ClientEnvironment.browser-test.js) | 163 / 0 |
| A | [src/core/utils/browser.js](../src/core/utils/browser.js) | 8 / 0 |
| A | [src/server/BrowserCapture.js](../src/server/BrowserCapture.js) | 538 / 0 |
| A | [src/server/BrowserCapture.test.mjs](../src/server/BrowserCapture.test.mjs) | 206 / 0 |
| A | [src/server/WebViewProxy.js](../src/server/WebViewProxy.js) | 190 / 0 |
| A | [src/server/WebViewProxy.test.mjs](../src/server/WebViewProxy.test.mjs) | 84 / 0 |
| A | [src/server/webURL.js](../src/server/webURL.js) | 23 / 0 |

### 7. Sitting poses and export (20 files)

[Behavior and evidence](fork-changes.md#7-sitting-pose-editor-reusable-calibration-and-glb-export).

| Status | Path | Lines + / − |
| --- | --- | --- |
| M | [docs/scripting/nodes/types/Anchor.md](../docs/scripting/nodes/types/Anchor.md) | 13 / 0 |
| M | [docs/scripting/world/Player.md](../docs/scripting/world/Player.md) | 22 / 0 |
| A | [src/client/components/PoseEditorPanel.js](../src/client/components/PoseEditorPanel.js) | 841 / 0 |
| A | [src/core/extras/avatarScene.test.mjs](../src/core/extras/avatarScene.test.mjs) | 52 / 0 |
| A | [src/core/extras/cloneAvatarScene.js](../src/core/extras/cloneAvatarScene.js) | 68 / 0 |
| A | [src/core/extras/exportPose.js](../src/core/extras/exportPose.js) | 67 / 0 |
| A | [src/core/extras/exportPose.test.mjs](../src/core/extras/exportPose.test.mjs) | 127 / 0 |
| A | [src/core/extras/normalizedPose.js](../src/core/extras/normalizedPose.js) | 138 / 0 |
| A | [src/core/extras/normalizedPose.test.mjs](../src/core/extras/normalizedPose.test.mjs) | 195 / 0 |
| A | [src/core/extras/poseEditorMath.js](../src/core/extras/poseEditorMath.js) | 155 / 0 |
| A | [src/core/extras/poseEditorMath.test.mjs](../src/core/extras/poseEditorMath.test.mjs) | 63 / 0 |
| A | [src/core/extras/seatPose.js](../src/core/extras/seatPose.js) | 338 / 0 |
| A | [src/core/extras/seatPose.test.mjs](../src/core/extras/seatPose.test.mjs) | 169 / 0 |
| M | [src/core/nodes/Anchor.js](../src/core/nodes/Anchor.js) | 7 / 1 |
| A | [src/core/nodes/Anchor.test.mjs](../src/core/nodes/Anchor.test.mjs) | 36 / 0 |
| M | [src/core/systems/Anchors.js](../src/core/systems/Anchors.js) | 12 / 1 |
| A | [src/core/systems/Anchors.test.mjs](../src/core/systems/Anchors.test.mjs) | 36 / 0 |
| A | [src/core/systems/ClientPoseEditor.js](../src/core/systems/ClientPoseEditor.js) | 1782 / 0 |
| A | [src/core/systems/ClientPoseEditor.test.mjs](../src/core/systems/ClientPoseEditor.test.mjs) | 1021 / 0 |
| A | [src/core/systems/ServerNetwork.seatPose.test.mjs](../src/core/systems/ServerNetwork.seatPose.test.mjs) | 247 / 0 |

### 8. Avatars, movement, and hands (21 files)

[Behavior and evidence](fork-changes.md#8-avatar-selection-first-person-movement-and-vr-hands).

| Status | Path | Lines + / − |
| --- | --- | --- |
| A | [docs/xr-hands.md](../docs/xr-hands.md) | 73 / 0 |
| A | [scripts/replay-xr-hands.mjs](../scripts/replay-xr-hands.mjs) | 105 / 0 |
| M | [src/core/entities/PlayerLocal.js](../src/core/entities/PlayerLocal.js) | 409 / 208 |
| A | [src/core/entities/PlayerLocal.test.mjs](../src/core/entities/PlayerLocal.test.mjs) | 250 / 0 |
| A | [src/core/entities/PlayerLocalTurn.test.mjs](../src/core/entities/PlayerLocalTurn.test.mjs) | 23 / 0 |
| M | [src/core/entities/PlayerRemote.js](../src/core/entities/PlayerRemote.js) | 27 / 0 |
| A | [src/core/extras/avatarFocus.js](../src/core/extras/avatarFocus.js) | 30 / 0 |
| A | [src/core/extras/avatarFocus.test.mjs](../src/core/extras/avatarFocus.test.mjs) | 43 / 0 |
| M | [src/core/extras/createPlayerProxy.js](../src/core/extras/createPlayerProxy.js) | 11 / 1 |
| A | [src/core/extras/createVRMFactory.handTracking.test.mjs](../src/core/extras/createVRMFactory.handTracking.test.mjs) | 423 / 0 |
| M | [src/core/extras/createVRMFactory.js](../src/core/extras/createVRMFactory.js) | 464 / 2 |
| A | [src/core/extras/handRetargeting.js](../src/core/extras/handRetargeting.js) | 65 / 0 |
| A | [src/core/extras/handTracking.js](../src/core/extras/handTracking.js) | 137 / 0 |
| A | [src/core/extras/handTracking.test.mjs](../src/core/extras/handTracking.test.mjs) | 61 / 0 |
| M | [src/core/nodes/Avatar.js](../src/core/nodes/Avatar.js) | 37 / 0 |
| A | [src/core/nodes/Avatar.test.mjs](../src/core/nodes/Avatar.test.mjs) | 46 / 0 |
| M | [src/core/nodes/Controller.js](../src/core/nodes/Controller.js) | 6 / 5 |
| M | [src/core/nodes/SkinnedMesh.js](../src/core/nodes/SkinnedMesh.js) | 14 / 0 |
| M | [src/core/systems/ClientActions.js](../src/core/systems/ClientActions.js) | 20 / 4 |
| A | [src/core/systems/ClientActions.test.mjs](../src/core/systems/ClientActions.test.mjs) | 141 / 0 |
| M | [src/core/systems/XR.js](../src/core/systems/XR.js) | 1 / 0 |

### 9. XR sidebar and pointer input (10 files)

[Behavior and evidence](fork-changes.md#9-in-world-vr-sidebar-and-pointer-routing).

| Status | Path | Lines + / − |
| --- | --- | --- |
| A | [docs/xr-sidebar.md](../docs/xr-sidebar.md) | 73 / 0 |
| A | [src/client/components/XRSidebar.js](../src/client/components/XRSidebar.js) | 101 / 0 |
| A | [src/core/extras/XRDOMSurface.js](../src/core/extras/XRDOMSurface.js) | 196 / 0 |
| A | [src/core/extras/xrUI.js](../src/core/extras/xrUI.js) | 39 / 0 |
| A | [src/core/extras/xrUI.test.mjs](../src/core/extras/xrUI.test.mjs) | 58 / 0 |
| A | [src/core/systems/ClientControls.xrUI.test.mjs](../src/core/systems/ClientControls.xrUI.test.mjs) | 50 / 0 |
| M | [src/core/systems/ClientPointer.js](../src/core/systems/ClientPointer.js) | 55 / 20 |
| A | [src/core/systems/ClientPointer.test.mjs](../src/core/systems/ClientPointer.test.mjs) | 148 / 0 |
| A | [src/core/systems/ClientXRUI.js](../src/core/systems/ClientXRUI.js) | 282 / 0 |
| A | [src/core/systems/ClientXRUI.test.mjs](../src/core/systems/ClientXRUI.test.mjs) | 384 / 0 |

### 10. Prompt-box workflow (7 files)

[Behavior and evidence](fork-changes.md#10-prompt-box-generation-and-construction-edits).

| Status | Path | Lines + / − |
| --- | --- | --- |
| A | [docs/prompt-box.md](../docs/prompt-box.md) | 139 / 0 |
| A | [src/client/components/PromptBoxPanel.js](../src/client/components/PromptBoxPanel.js) | 225 / 0 |
| A | [src/core/extras/PromptBoxResizeControls.js](../src/core/extras/PromptBoxResizeControls.js) | 144 / 0 |
| A | [src/core/extras/PromptBoxWorkflow.js](../src/core/extras/PromptBoxWorkflow.js) | 452 / 0 |
| A | [src/core/extras/promptBox.test.mjs](../src/core/extras/promptBox.test.mjs) | 975 / 0 |
| A | [src/core/extras/promptBoxIntersections.js](../src/core/extras/promptBoxIntersections.js) | 115 / 0 |
| A | [src/core/extras/promptBoxTools.js](../src/core/extras/promptBoxTools.js) | 383 / 0 |

### 11. App replacement and builder UI (35 files)

[Behavior and evidence](fork-changes.md#11-general-app-replacement-and-builder-usability).

| Status | Path | Lines + / − |
| --- | --- | --- |
| M | [docs/commands.md](../docs/commands.md) | 16 / 1 |
| M | [docs/scripting/README.md](../docs/scripting/README.md) | 18 / 2 |
| M | [docs/scripting/world/World.md](../docs/scripting/world/World.md) | 36 / 0 |
| M | [docs/supported-files/hyp-format.md](../docs/supported-files/hyp-format.md) | 23 / 0 |
| A | [scripts/create-gs-hyp.js](../scripts/create-gs-hyp.js) | 114 / 0 |
| M | [src/client/components/CoreUI.js](../src/client/components/CoreUI.js) | 22 / 3 |
| M | [src/client/components/Fields.js](../src/client/components/Fields.js) | 197 / 113 |
| M | [src/client/components/Inputs.js](../src/client/components/Inputs.js) | 6 / 0 |
| M | [src/client/components/Menu.js](../src/client/components/Menu.js) | 9 / 3 |
| M | [src/client/components/MenuApp.js](../src/client/components/MenuApp.js) | 37 / 1 |
| M | [src/client/components/ScriptEditor.js](../src/client/components/ScriptEditor.js) | 1 / 0 |
| M | [src/client/components/Sidebar.js](../src/client/components/Sidebar.js) | 344 / 38 |
| A | [src/client/components/addableBlueprints.js](../src/client/components/addableBlueprints.js) | 13 / 0 |
| A | [src/client/components/addableBlueprints.test.mjs](../src/client/components/addableBlueprints.test.mjs) | 34 / 0 |
| M | [src/client/public/ai-docs.md](../src/client/public/ai-docs.md) | 57 / 1 |
| M | [src/client/world-client.js](../src/client/world-client.js) | 11 / 1 |
| M | [src/core/createClientWorld.js](../src/core/createClientWorld.js) | 6 / 0 |
| M | [src/core/entities/App.js](../src/core/entities/App.js) | 75 / 13 |
| M | [src/core/extras/ControlPriorities.js](../src/core/extras/ControlPriorities.js) | 1 / 0 |
| M | [src/core/extras/appTools.js](../src/core/extras/appTools.js) | 79 / 1 |
| A | [src/core/extras/appTools.test.mjs](../src/core/extras/appTools.test.mjs) | 223 / 0 |
| A | [src/core/extras/createMoon.js](../src/core/extras/createMoon.js) | 43 / 0 |
| M | [src/core/extras/simpleCamLerp.js](../src/core/extras/simpleCamLerp.js) | 5 / 2 |
| M | [src/core/nodes/Node.js](../src/core/nodes/Node.js) | 3 / 3 |
| M | [src/core/nodes/UI.js](../src/core/nodes/UI.js) | 1 / 0 |
| M | [src/core/nodes/index.js](../src/core/nodes/index.js) | 5 / 0 |
| M | [src/core/systems/Apps.js](../src/core/systems/Apps.js) | 11 / 1 |
| M | [src/core/systems/Chat.js](../src/core/systems/Chat.js) | 2 / 1 |
| M | [src/core/systems/ClientBuilder.js](../src/core/systems/ClientBuilder.js) | 474 / 32 |
| A | [src/core/systems/ClientBuilder.upload.test.mjs](../src/core/systems/ClientBuilder.upload.test.mjs) | 78 / 0 |
| A | [src/core/systems/ClientCSS.js](../src/core/systems/ClientCSS.js) | 67 / 0 |
| M | [src/core/systems/ClientControls.js](../src/core/systems/ClientControls.js) | 50 / 4 |
| M | [src/world/collections/default/manifest.json](../src/world/collections/default/manifest.json) | 10 / 1 |
| A | [src/world/collections/default/primitive_cottage_detailed.hyp](../src/world/collections/default/primitive_cottage_detailed.hyp) | binary |
| A | [src/world/collections/default/primitive_cottage_script_app.hyp](../src/world/collections/default/primitive_cottage_script_app.hyp) | binary |

### 12. Server/configuration/AI/protocol (8 files)

[Behavior and evidence](fork-changes.md#12-server-operations-configuration-and-ai-compatibility).

| Status | Path | Lines + / − |
| --- | --- | --- |
| M | [.env.example](../.env.example) | 10 / 3 |
| M | [src/core/packets.js](../src/core/packets.js) | 5 / 0 |
| A | [src/core/packets.test.mjs](../src/core/packets.test.mjs) | 20 / 0 |
| M | [src/core/systems/ClientNetwork.js](../src/core/systems/ClientNetwork.js) | 43 / 1 |
| M | [src/core/systems/ServerAI.js](../src/core/systems/ServerAI.js) | 143 / 54 |
| M | [src/core/systems/ServerNetwork.js](../src/core/systems/ServerNetwork.js) | 205 / 4 |
| M | [src/server/Storage.js](../src/server/Storage.js) | 9 / 0 |
| M | [src/server/index.js](../src/server/index.js) | 214 / 13 |

### 13. Dependencies/build/lint/container (14 files)

[Behavior and evidence](fork-changes.md#13-dependencies-build-lint-and-container-changes).

| Status | Path | Lines + / − |
| --- | --- | --- |
| D | [.eslintignore](https://github.com/hyperfy-xyz/hyperfy/blob/5d20037435a1d86cda088382bb12737e9f18d5f6/.eslintignore) | 0 / 4 |
| D | [.eslintrc](https://github.com/hyperfy-xyz/hyperfy/blob/5d20037435a1d86cda088382bb12737e9f18d5f6/.eslintrc) | 0 / 55 |
| M | [.github/workflows/docker.yml](../.github/workflows/docker.yml) | 6 / 6 |
| M | [.gitignore](../.gitignore) | 2 / 1 |
| M | [.nvmrc](../.nvmrc) | 1 / 1 |
| M | [Dockerfile](../Dockerfile) | 2 / 2 |
| A | [eslint.config.js](../eslint.config.js) | 52 / 0 |
| M | [package-lock.json](../package-lock.json) | 3299 / 4663 |
| M | [package.json](../package.json) | 54 / 43 |
| M | [scripts/build-client.mjs](../scripts/build-client.mjs) | 3 / 2 |
| M | [scripts/build-node-client.mjs](../scripts/build-node-client.mjs) | 3 / 2 |
| M | [scripts/build-viewer.mjs](../scripts/build-viewer.mjs) | 3 / 2 |
| M | [scripts/build.mjs](../scripts/build.mjs) | 7 / 4 |
| A | [scripts/hyperfy-skill-plugin.mjs](../scripts/hyperfy-skill-plugin.mjs) | 37 / 0 |

### 14. Authoring, examples, prototypes, and records (63 files)

[Behavior and evidence](fork-changes.md#14-authoring-resources-prototypes-examples-and-tracked-artifacts).

| Status | Path | Lines + / − |
| --- | --- | --- |
| A | [.claude/skills/building-hyperfy-apps/SKILL.md](../.claude/skills/building-hyperfy-apps/SKILL.md) | 354 / 0 |
| A | [.claude/skills/building-hyperfy-apps/references/common-mistakes.md](../.claude/skills/building-hyperfy-apps/references/common-mistakes.md) | 543 / 0 |
| A | [.claude/skills/building-hyperfy-apps/references/networking-patterns.md](../.claude/skills/building-hyperfy-apps/references/networking-patterns.md) | 410 / 0 |
| A | [.claude/skills/building-hyperfy-apps/references/node-types.md](../.claude/skills/building-hyperfy-apps/references/node-types.md) | 659 / 0 |
| A | [.claude/skills/building-hyperfy-apps/references/prims-guide.md](../.claude/skills/building-hyperfy-apps/references/prims-guide.md) | 396 / 0 |
| M | [README.md](../README.md) | 67 / 98 |
| A | [TODO.md](../TODO.md) | 82 / 0 |
| A | [docs/deployment.md](../docs/deployment.md) | 93 / 0 |
| A | [hunters_pt.sog](../hunters_pt.sog) | binary |
| A | [hyperfy-skill/README.md](../hyperfy-skill/README.md) | 57 / 0 |
| A | [hyperfy-skill/SKILL.md](../hyperfy-skill/SKILL.md) | 389 / 0 |
| A | [hyperfy-skill/docs/extrusion.md](../hyperfy-skill/docs/extrusion.md) | 69 / 0 |
| A | [hyperfy-skill/docs/orientation.md](../hyperfy-skill/docs/orientation.md) | 73 / 0 |
| A | [hyperfy-skill/docs/physics.md](../hyperfy-skill/docs/physics.md) | 44 / 0 |
| A | [hyperfy-skill/docs/sitting.md](../hyperfy-skill/docs/sitting.md) | 324 / 0 |
| A | [hyperfy-skill/examples/orientation_regression/README.md](../hyperfy-skill/examples/orientation_regression/README.md) | 11 / 0 |
| A | [hyperfy-skill/examples/orientation_regression/fire_lookout_tower_fixed.hyp](../hyperfy-skill/examples/orientation_regression/fire_lookout_tower_fixed.hyp) | binary |
| A | [hyperfy-skill/examples/orientation_regression/fire_lookout_tower_fixed.js](../hyperfy-skill/examples/orientation_regression/fire_lookout_tower_fixed.js) | 229 / 0 |
| A | [hyperfy-skill/examples/orientation_regression/fire_lookout_tower_fixed_preview.html](../hyperfy-skill/examples/orientation_regression/fire_lookout_tower_fixed_preview.html) | 54 / 0 |
| A | [hyperfy-skill/manifest.json](../hyperfy-skill/manifest.json) | 6 / 0 |
| A | [hyperfy-skill/templates/minimal_primitive_app.js](../hyperfy-skill/templates/minimal_primitive_app.js) | 120 / 0 |
| A | [hyperfy-skill/templates/orientation_helpers.js](../hyperfy-skill/templates/orientation_helpers.js) | 84 / 0 |
| A | [hyperfy-skill/tests/self_test.py](../hyperfy-skill/tests/self_test.py) | 116 / 0 |
| A | [hyperfy-skill/tools/hyp_extract.py](../hyperfy-skill/tools/hyp_extract.py) | 30 / 0 |
| A | [hyperfy-skill/tools/hyp_pack.py](../hyperfy-skill/tools/hyp_pack.py) | 64 / 0 |
| A | [hyperfy-skill/tools/make_embedded_preview.py](../hyperfy-skill/tools/make_embedded_preview.py) | 26 / 0 |
| A | [hyperfy-skill/tools/smoke_test.js](../hyperfy-skill/tools/smoke_test.js) | 172 / 0 |
| A | [hyperfy-skill/tools/validate_app.py](../hyperfy-skill/tools/validate_app.py) | 43 / 0 |
| A | [hyperfy-skill/tools/validate_result.py](../hyperfy-skill/tools/validate_result.py) | 197 / 0 |
| A | [hyperfy-skill/viewer/hyp_primitive_viewer.html](../hyperfy-skill/viewer/hyp_primitive_viewer.html) | 86 / 0 |
| A | [hyperfy-skill/viewer/hyp_primitive_viewer_template.html](../hyperfy-skill/viewer/hyp_primitive_viewer_template.html) | 86 / 0 |
| A | [hyperfy-skill/viewer/navigation_wasd.js](../hyperfy-skill/viewer/navigation_wasd.js) | 12 / 0 |
| A | [loading_logs_temp.md](../loading_logs_temp.md) | 136 / 0 |
| A | [outputs/luxury-log-cabin/README.md](../outputs/luxury-log-cabin/README.md) | 33 / 0 |
| A | [outputs/luxury-log-cabin/build_cabin.mjs](../outputs/luxury-log-cabin/build_cabin.mjs) | 73 / 0 |
| A | [outputs/luxury-log-cabin/exterior.jpg](../outputs/luxury-log-cabin/exterior.jpg) | binary |
| A | [outputs/luxury-log-cabin/extracted/2b332a8c564f68a0b5be0b283c1859979bfe8a0bd7fce465a8de8339e530fa41.glb](../outputs/luxury-log-cabin/extracted/2b332a8c564f68a0b5be0b283c1859979bfe8a0bd7fce465a8de8339e530fa41.glb) | binary |
| A | [outputs/luxury-log-cabin/extracted/d9d7fa7c9e01879e97bbce21a5bd0eea1ba100d8eb50a0c81403ef9fee764603.js](../outputs/luxury-log-cabin/extracted/d9d7fa7c9e01879e97bbce21a5bd0eea1ba100d8eb50a0c81403ef9fee764603.js) | 436 / 0 |
| A | [outputs/luxury-log-cabin/extracted/header.json](../outputs/luxury-log-cabin/extracted/header.json) | 33 / 0 |
| A | [outputs/luxury-log-cabin/great_room.jpg](../outputs/luxury-log-cabin/great_room.jpg) | binary |
| A | [outputs/luxury-log-cabin/luxury_log_cabin.hyp](../outputs/luxury-log-cabin/luxury_log_cabin.hyp) | binary |
| A | [outputs/luxury-log-cabin/luxury_log_cabin.js](../outputs/luxury-log-cabin/luxury_log_cabin.js) | 436 / 0 |
| A | [outputs/luxury-log-cabin/luxury_log_cabin_preview.html](../outputs/luxury-log-cabin/luxury_log_cabin_preview.html) | 3878 / 0 |
| A | [outputs/luxury-log-cabin/mezzanine.jpg](../outputs/luxury-log-cabin/mezzanine.jpg) | binary |
| A | [outputs/luxury-log-cabin/plan.jpg](../outputs/luxury-log-cabin/plan.jpg) | binary |
| A | [outputs/luxury-log-cabin/preview.mjs](../outputs/luxury-log-cabin/preview.mjs) | 163 / 0 |
| A | [outputs/luxury-log-cabin/runtime_adapter.mjs](../outputs/luxury-log-cabin/runtime_adapter.mjs) | 65 / 0 |
| A | [outputs/luxury-log-cabin/validate_cabin.mjs](../outputs/luxury-log-cabin/validate_cabin.mjs) | 130 / 0 |
| A | [outputs/luxury-log-cabin/validation_report.json](../outputs/luxury-log-cabin/validation_report.json) | 78 / 0 |
| A | [prototypes/snowman.js](../prototypes/snowman.js) | 90 / 0 |
| A | [prototypes/snowman.test.mjs](../prototypes/snowman.test.mjs) | 92 / 0 |
| A | [prototypes/spiral-climb-leaderboard.js](../prototypes/spiral-climb-leaderboard.js) | 264 / 0 |
| A | [prototypes/spiral-climb.js](../prototypes/spiral-climb.js) | 290 / 0 |
| A | [prototypes/spiral-climb.test.mjs](../prototypes/spiral-climb.test.mjs) | 371 / 0 |
| A | [prototypes/watch-snowman.mjs](../prototypes/watch-snowman.mjs) | 188 / 0 |
| A | [prototypes/watch-spiral-climb.mjs](../prototypes/watch-spiral-climb.mjs) | 214 / 0 |
| A | [scripts/README.md](../scripts/README.md) | 20 / 0 |
| A | [wiki/.obsidian/app.json](../wiki/.obsidian/app.json) | 1 / 0 |
| A | [wiki/.obsidian/appearance.json](../wiki/.obsidian/appearance.json) | 1 / 0 |
| A | [wiki/.obsidian/core-plugins.json](../wiki/.obsidian/core-plugins.json) | 33 / 0 |
| A | [wiki/.obsidian/workspace.json](../wiki/.obsidian/workspace.json) | 195 / 0 |
| A | [wiki/app-design-rules.md](../wiki/app-design-rules.md) | 158 / 0 |
| A | [wiki/index.md](../wiki/index.md) | 11 / 0 |

## Dependency declarations

All changed entries from `package.json`; ranges are declarations, not resolved package versions. `package-lock.json` contains the complete transitive graph and integrity changes.

| Group | Package | Official main | Documented checkout |
| --- | --- | --- | --- |
| dependencies | `@anthropic-ai/sdk` | `^0.60.0` | `^0.133.0` |
| dependencies | `@aws-sdk/client-s3` | `^3.859.0` | `^3.1149.0` |
| dependencies | `@fastify/compress` | `^8.0.1` | `^9.2.1` |
| dependencies | `@fastify/cors` | `^10.0.1` | `^11.3.1` |
| dependencies | `@fastify/multipart` | `^9.0.1` | `^10.1.3` |
| dependencies | `@fastify/static` | `^8.0.1` | `^10.1.6` |
| dependencies | `@fastify/websocket` | `^11.0.1` | `^11.3.4` |
| dependencies | `@pixiv/three-vrm` | `^3.3.3` | `^3.5.5` |
| dependencies | `@sparkjsdev/spark` | — | `^2.3.1` |
| dependencies | `better-sqlite3` | `^11.7.2` | `^13.0.3` |
| dependencies | `eventemitter3` | `^5.0.1` | `^5.0.4` |
| dependencies | `fastify` | `^5.0.0` | `^5.12.5` |
| dependencies | `fflate` | — | `^0.8.3` |
| dependencies | `find-cache-dir` | `^5.0.0` | `^6.0.0` |
| dependencies | `fs-extra` | `^11.2.0` | `^11.4.1` |
| dependencies | `hls.js` | `^1.6.1` | `^1.7.3` |
| dependencies | `jsonwebtoken` | `^9.0.2` | `^9.0.3` |
| dependencies | `knex` | `^3.1.0` | `^3.3.0` |
| dependencies | `livekit-client` | `^2.9.9` | `^2.22.4` |
| dependencies | `livekit-server-sdk` | `^2.11.0` | `^2.19.1` |
| dependencies | `lodash-es` | `^4.17.21` | `^4.18.1` |
| dependencies | `lucide-react` | `^0.469.0` | `^1.54.0` |
| dependencies | `moment` | `^2.30.1` | `^2.31.0` |
| dependencies | `msgpackr` | `^1.11.0` | `^2.1.0` |
| dependencies | `n8ao` | `^1.10.0` | `^2.0.1` |
| dependencies | `nanoid` | `^5.0.6` | `^6.0.2` |
| dependencies | `openai` | `^5.12.2` | `^7.32.0` |
| dependencies | `pg` | `^8.16.3` | `^8.23.1` |
| dependencies | `postprocessing` | `^6.36.4` | `^6.39.5` |
| dependencies | `react` | `^19.1.0` | `^19.3.0` |
| dependencies | `react-colorful` | `^5.6.1` | `^5.8.1` |
| dependencies | `react-dom` | `^19.1.0` | `^19.3.0` |
| dependencies | `ses` | `^1.10.0` | `^2.3.0` |
| dependencies | `suncalc` | — | `^2.1.1` |
| dependencies | `three` | `^0.173.0` | `^0.186.1` |
| dependencies | `three-mesh-bvh` | `^0.8.3` | `^0.9.16` |
| devDependencies | `@babel/core` | — | `^8.0.7` |
| devDependencies | `@babel/eslint-parser` | `^7.23.10` | `^8.0.7` |
| devDependencies | `@babel/preset-react` | `^7.23.10` | `^8.0.1` |
| devDependencies | `@eslint/js` | — | `^9.39.5` |
| devDependencies | `esbuild` | `^0.24.0` | `^0.28.2` |
| devDependencies | `eslint` | `^8.57.0` | `^9.39.5` |
| devDependencies | `eslint-config-prettier` | `^9.1.0` | `^10.1.8` |
| devDependencies | `eslint-plugin-react` | `^7.34.0` | `^7.37.5` |
| devDependencies | `eslint-plugin-react-hooks` | `^4.6.0` | `^7.1.1` |
| devDependencies | `globals` | — | `^17.13.0` |
| devDependencies | `prettier` | `^3.4.2` | `^3.9.9` |
| engines | `node` | `22.11.0` | `^22.18.0 || >=24.11.0` |
| overrides | `fast-xml-parser` | — | `^5.11.2` |
| overrides | `three` | `^0.173.0` | — |

## Complete commit history

All 125 commits reachable from the documented checkout but not official main, newest first. Includes merges, intermediate experiments, fixes, and reverts; a commit title is historical context rather than evidence that its behavior remains in the final tree.

| Commit | Date | Subject |
| --- | --- | --- |
| [192087f](https://github.com/jerometremblay/hyperfy/commit/192087f8bc776b3733573dad5156fb3e6d57d7d5) | 2026-10-10 | Optimize live shadows with instanced-batch frustum culling |
| [7cea690](https://github.com/jerometremblay/hyperfy/commit/7cea6907993604cdfd0ec1dd7f1db5edb0a3c90d) | 2026-10-10 | Merge pull request #1 from jerometremblay/3d-portal-preview |
| [ee807c6](https://github.com/jerometremblay/hyperfy/commit/ee807c68d399813fb0dce12634300d49506223bb) | 2026-10-10 | Add max portal preview resolution matching viewer render size |
| [fa5e33d](https://github.com/jerometremblay/hyperfy/commit/fa5e33de07b785cbe2d1e6d14c941b51502daf2d) | 2026-10-10 | Make portal preview quality configurable with low defaults |
| [8089f85](https://github.com/jerometremblay/hyperfy/commit/8089f8546e4a0e5577fa0572afce8d4e42ed96c0) | 2026-10-10 | Add native 3D portal previews and matching traversal |
| [994eede](https://github.com/jerometremblay/hyperfy/commit/994eedea58af7f62a8535f8d963c078e7e052557) | 2026-10-10 | Revert portal preview from main |
| [65fc21a](https://github.com/jerometremblay/hyperfy/commit/65fc21a3af190c3f2b9580facb85d0368383e379) | 2026-10-10 | Fix world portal preview |
| [7eaf1c4](https://github.com/jerometremblay/hyperfy/commit/7eaf1c449a4429b9fdf38ba80655c93f482a6118) | 2026-10-10 | Add linkable world portals |
| [1679534](https://github.com/jerometremblay/hyperfy/commit/1679534130a03822d468bfa87819866ca0d94479) | 2026-10-10 | Group valid world timezones in settings dropdown |
| [90cbe67](https://github.com/jerometremblay/hyperfy/commit/90cbe67fe0fff46cf9fdd3a26b28973955a7e895) | 2026-10-10 | fix first-person avatar visibility |
| [93a6655](https://github.com/jerometremblay/hyperfy/commit/93a6655d8c99ac6c25358b565fb00835fec705ba) | 2026-10-10 | Synchronize world time and share time commands across players |
| [6cf5874](https://github.com/jerometremblay/hyperfy/commit/6cf5874120c8b0fbf8dad3eb5ab1127858b0b5ab) | 2026-10-09 | Document day-night cycle and scripting light examples |
| [d08ef0d](https://github.com/jerometremblay/hyperfy/commit/d08ef0d733e0e043301157ff61490af5dc6e43b2) | 2026-10-09 | Add location-based day-night cycle with moon phases and time controls |
| [910c9da](https://github.com/jerometremblay/hyperfy/commit/910c9dab7bf011971b224ad3f91d1789b8981d6c) | 2026-10-09 | Update dependencies and fix light shadows |
| [f0e1d12](https://github.com/jerometremblay/hyperfy/commit/f0e1d12995f540140cb7cf61d70d08b2d1a825bc) | 2026-10-07 | promptbox updates |
| [445d9b3](https://github.com/jerometremblay/hyperfy/commit/445d9b3893c1f2d31a1ae7be470ad108e90e16b4) | 2026-10-05 | Fix pose editor camera zoom reset |
| [ce4029b](https://github.com/jerometremblay/hyperfy/commit/ce4029b573ac6aa2866b47e06054142b78749520) | 2026-10-05 | Allow wearing placed VRM avatars |
| [62380bb](https://github.com/jerometremblay/hyperfy/commit/62380bb4d75e1c1c1d8bfa8d45b98e959cbc0008) | 2026-10-05 | Use PhysX CCT for local player movement |
| [d120257](https://github.com/jerometremblay/hyperfy/commit/d12025797536c4ea4a81f1248cdef20d079b70e9) | 2026-10-05 | remove file size limitation |
| [d3c5d96](https://github.com/jerometremblay/hyperfy/commit/d3c5d9657ffdb9c1717517ea26cd249b78336158) | 2026-10-05 | fix: make skinned GLB models selectable |
| [d363a71](https://github.com/jerometremblay/hyperfy/commit/d363a71768f905a2598987c545a5bffdaab41a1b) | 2026-10-05 | Add avatar-attached XR sidebar with point-and-pinch input |
| [5e0bcdc](https://github.com/jerometremblay/hyperfy/commit/5e0bcdce6338584fd6daaf85afe6b3aa13d5210b) | 2026-10-05 | Polish luxury cabin preview packaging |
| [d192908](https://github.com/jerometremblay/hyperfy/commit/d19290836ba409814aa8fd0fa93bdd9c0d134c8d) | 2026-10-05 | Process overlapping prompt boxes as one generation request |
| [54b9a16](https://github.com/jerometremblay/hyperfy/commit/54b9a161890870113094acde46d218c54b1bb034) | 2026-10-05 | Add GLB download to sitting pose editor |
| [afabb4d](https://github.com/jerometremblay/hyperfy/commit/afabb4d6faf1c4a8220063b3d1e9f3b3728fcf9b) | 2026-10-03 | Add Hyperfy pre-save result validation |
| [13dcb82](https://github.com/jerometremblay/hyperfy/commit/13dcb82874eb1e312d4a68ab66ac0b64536a61c7) | 2026-10-03 | docs: add sitting behavior to Hyperfy authoring skill |
| [aaf8921](https://github.com/jerometremblay/hyperfy/commit/aaf89218b38d8cb44f21e717251ddfe4df0de350) | 2026-10-03 | Add prompt-box construction edits and bundled .hyp authoring tools |
| [ddaf3e1](https://github.com/jerometremblay/hyperfy/commit/ddaf3e1a0cda9d7cb7e501e907aa8ebf58cf2e01) | 2026-10-03 | Add generic .hyp replacement for app instances |
| [067f2c4](https://github.com/jerometremblay/hyperfy/commit/067f2c478431e78bd0ca89d007b2aaa81c01fa66) | 2026-10-02 | Add prompt-box object creation and replacement workflow |
| [e43d36d](https://github.com/jerometremblay/hyperfy/commit/e43d36da4075c52894cc0c0b24f05294d68d92ae) | 2026-10-01 | docs: describe VR avatar hands and movement |
| [999d416](https://github.com/jerometremblay/hyperfy/commit/999d416144ba6e46408c9851340fa2b2e952d1fd) | 2026-10-01 | fix: respect joint limits in VR arm tracking |
| [42233af](https://github.com/jerometremblay/hyperfy/commit/42233aff5bb9f5b9d4d64f213a8bedcd42ca9162) | 2026-10-01 | feat: add shared VR avatar hand tracking |
| [55dffac](https://github.com/jerometremblay/hyperfy/commit/55dffac2cc2dfb43ac9912efb1e5e54f3cf63611) | 2026-10-01 | fix: stabilize seated camera collision |
| [495b361](https://github.com/jerometremblay/hyperfy/commit/495b3618b323b72b1db6cb73fbbcdf3a10ad36a7) | 2026-09-30 | fix: recenter XR camera when sitting |
| [9871692](https://github.com/jerometremblay/hyperfy/commit/98716928594b292c1a99b3e221de02fbb421109b) | 2026-09-30 | fix: make XR right-stick turning continuous |
| [113108d](https://github.com/jerometremblay/hyperfy/commit/113108d5cf5b385ef1c0a36e7c58cd2a2e455aad) | 2026-09-30 | fix: align camera with avatar head in XR |
| [dfb025a](https://github.com/jerometremblay/hyperfy/commit/dfb025ae48ae99807fff86164d08b55826453eb7) | 2026-09-22 | Add resettable default sitting pose |
| [da9db04](https://github.com/jerometremblay/hyperfy/commit/da9db04f869200e61ae765e04f01cd30368bd50e) | 2026-09-22 | Add WebView proxy support |
| [8d1acd3](https://github.com/jerometremblay/hyperfy/commit/8d1acd3636d656ad0bdfd713358f23d5d6613dc7) | 2026-09-21 | Improve pose editor and browser URL handling |
| [54bb478](https://github.com/jerometremblay/hyperfy/commit/54bb478a791c09185ab5fe0dcbf87fbe6f4ec6dc) | 2026-09-21 | Document Hyperfy fork features |
| [b428da0](https://github.com/jerometremblay/hyperfy/commit/b428da05062f00135528d26208259f6a98b0a41a) | 2026-09-21 | Fix sitting pose editor interactions |
| [2d4cd5a](https://github.com/jerometremblay/hyperfy/commit/2d4cd5a2e937722b065b1f6e7bd6b92e43a52af8) | 2026-09-20 | Add in-world VRM seat pose editor |
| [d969c8e](https://github.com/jerometremblay/hyperfy/commit/d969c8e8f5f54439d70918b1a5b6c68cc977f07e) | 2026-09-20 | Fix browser teardown with server window shim |
| [1ad94d5](https://github.com/jerometremblay/hyperfy/commit/1ad94d5d669e79d99738aa329ed4eb53e6b56821) | 2026-09-20 | Add first working version of shared browser |
| [82ae56b](https://github.com/jerometremblay/hyperfy/commit/82ae56b48046b002fb61927707265fc898d1e8e5) | 2026-09-19 | Merge Codex browser integration into main |
| [c634c93](https://github.com/jerometremblay/hyperfy/commit/c634c932cfafbccb2091735cd8f32e8042d53337) | 2026-09-19 | feat: add shared browser screen |
| [ec23c26](https://github.com/jerometremblay/hyperfy/commit/ec23c26056660812345c7e14d3eb5a56fd03c783) | 2026-09-19 | Add Obsidian workspace settings |
| [8f123d2](https://github.com/jerometremblay/hyperfy/commit/8f123d2e29f1169a818a0452fc5a728e7aaf2583) | 2026-09-19 | Add browser, primitive, and leaderboard features |
| [27d619e](https://github.com/jerometremblay/hyperfy/commit/27d619e39d22e7e1379a355903f769f472fb1306) | 2026-09-18 | feat: add read-only browser screen |
| [7ee848a](https://github.com/jerometremblay/hyperfy/commit/7ee848ab1d28842f2a2222fa99ef1db0469f9ba7) | 2026-09-18 | feat: add extrude primitive |
| [0de268c](https://github.com/jerometremblay/hyperfy/commit/0de268c3e7c735d081b129990f7735dd1be5dff9) | 2026-09-11 | Add app design rules and persistent snowman sync |
| [c88ca0c](https://github.com/jerometremblay/hyperfy/commit/c88ca0cbdf51df65db6c86772d6fa3de497da1ff) | 2026-07-06 | fix: give duplicated splat apps their own blueprint and apps-list entry |
| [a9882fa](https://github.com/jerometremblay/hyperfy/commit/a9882fa55704988a89123d34867d138f13b73dff) | 2026-07-06 | feat: re-enable postprocessing (bloom, AO, SMAA) alongside Spark splats |
| [7f7fe6a](https://github.com/jerometremblay/hyperfy/commit/7f7fe6a0e1fe9a0188e5966aab4b8ad07c745dea) | 2026-07-06 | fix: overhaul splat loading pipeline and remove dead code |
| [595898b](https://github.com/jerometremblay/hyperfy/commit/595898b11a46ce521ed8c4ca021fe859fb2e8b77) | 2026-07-06 | merge: integrate upstream/dev (Light node, audit patches, deployment docs) |
| [b4081eb](https://github.com/jerometremblay/hyperfy/commit/b4081eb14478972eb7070d3b5bc0bf2b9f8cf92a) | 2026-04-22 | feat: Add Light node for scene lighting (#157) |
| [7e63d0e](https://github.com/jerometremblay/hyperfy/commit/7e63d0e8466d5a9a1981902acc753b335e3ff510) | 2026-04-22 | chore: patch audit vulnerabilities and add deployment docs (#159) |
| [d27b493](https://github.com/jerometremblay/hyperfy/commit/d27b493304d9b2ce3d6c683c81c52b9202b37693) | 2026-04-21 | fix: prevent entity rebuild on select/deselect |
| [85765e5](https://github.com/jerometremblay/hyperfy/commit/85765e52020925d3801eabfc540c03f3f416b5ee) | 2026-04-21 | feat: upgrade Spark.js 2.0 with LOD, platform defaults, and loading UI |
| [9eb1bd3](https://github.com/jerometremblay/hyperfy/commit/9eb1bd3287723186ae15348e0d590384a2b9f661) | 2026-03-12 | feat: prepare spark 2.0 gaussian splat updates |
| [4c2016c](https://github.com/jerometremblay/hyperfy/commit/4c2016c4d49999faba061c588e7eaf51ef2035e6) | 2026-03-12 | merge: integrate hyperfy-xyz/dev with gaussian-splatting features |
| [9cd3af5](https://github.com/jerometremblay/hyperfy/commit/9cd3af54f0272ab70be1b04415b27cefe10afb76) | 2026-02-06 | imp: remove JWT_SECRET enforcement |
| [2dc2f8e](https://github.com/jerometremblay/hyperfy/commit/2dc2f8e909ed854f57f65095a4759946c9c26258) | 2026-02-06 | clean up readme |
| [502b10e](https://github.com/jerometremblay/hyperfy/commit/502b10e865d2a0ba83643bc73abad5b7096cd796) | 2026-02-06 | Merge pull request #154 from madjin/feat/hyperfy-skill |
| [b93035c](https://github.com/jerometremblay/hyperfy/commit/b93035c84351f9c12ae780903bc620a665fc83a2) | 2026-02-06 | Merge pull request #153 from madjin/fix/insecure-defaults |
| [af7a83e](https://github.com/jerometremblay/hyperfy/commit/af7a83eaeb3ab4105d9b1f103121b1f465608469) | 2026-02-06 | Merge branch 'jin-ux-improvements' into dev |
| [20b8d06](https://github.com/jerometremblay/hyperfy/commit/20b8d06f57a7eb333e4bbe3b008e1ac9789febe8) | 2026-02-06 | no word wrap on script editor |
| [873c5cc](https://github.com/jerometremblay/hyperfy/commit/873c5cccba44111ac2eada8e2e582d684fe1cae1) | 2026-02-06 | Merge pull request #151 from madjin/ui-improvements |
| [a6a6a89](https://github.com/jerometremblay/hyperfy/commit/a6a6a899d334cd57f8b3a0a526860fcda17b4ca6) | 2026-02-05 | revert: remove risky changes, keep only safe hardening |
| [9f39cc9](https://github.com/jerometremblay/hyperfy/commit/9f39cc9515e8a966630cc60fd0e285f72fc591e0) | 2026-02-05 | fix: harden insecure defaults across server endpoints |
| [7da71c1](https://github.com/jerometremblay/hyperfy/commit/7da71c14c704c8cfff74e094cdc3214ebde65516) | 2026-02-05 | feat: improve builder UI with tooltips, labels, and resizable script editor |
| [3d41e20](https://github.com/jerometremblay/hyperfy/commit/3d41e2056047cfc699d10959b912a0d0ba10a7b7) | 2026-02-05 | refactor: rename skill to building-hyperfy-apps, update README |
| [e05c2e2](https://github.com/jerometremblay/hyperfy/commit/e05c2e2b1da9e7f0e3279b27eb2ecd4f603cd60c) | 2026-02-05 | feat: add hyperfy-skill for Claude Code |
| [960243e](https://github.com/jerometremblay/hyperfy/commit/960243ed06bfe40b83fcb34acc116309d1f0f51a) | 2026-01-26 | feat: make drag-and-drop and UI-based Gaussian Splat creation consistent |
| [ca87e9f](https://github.com/jerometremblay/hyperfy/commit/ca87e9f9594893c6c8b247f0dc95a390519324de) | 2026-01-26 | refactor: complete Phase 2 Gaussian Splatting improvements |
| [8e8e7bd](https://github.com/jerometremblay/hyperfy/commit/8e8e7bdf8683ea7c9a74d67890df93a8b3a8e8db) | 2026-01-26 | feat: add Delete/Backspace keys for deleting selected entities |
| [86699a0](https://github.com/jerometremblay/hyperfy/commit/86699a0c736d3e202c5edc6373114b4e23b5c686) | 2026-01-26 | fix: apply 180° rotation internally for correct splat orientation |
| [a82d0ec](https://github.com/jerometremblay/hyperfy/commit/a82d0ec7207c9d375948e402fb83fe47a9338743) | 2026-01-24 | fix: compare raycast distances for splat selection |
| [11a64c7](https://github.com/jerometremblay/hyperfy/commit/11a64c7061f183017cf43741aeb9b7c215adbb96) | 2026-01-24 | docs: update todo - Phase 1 complete |
| [f56cbef](https://github.com/jerometremblay/hyperfy/commit/f56cbefde775117a88d969cab5c6d90a302980ac) | 2026-01-24 | fix: remove unused sortMode parameter and pendingHandle |
| [cd86423](https://github.com/jerometremblay/hyperfy/commit/cd86423e503a842dec8eaf441fb76c0074e1da46) | 2026-01-24 | refactor: extract duplicated splat handle code in Stage.js |
| [7fecc99](https://github.com/jerometremblay/hyperfy/commit/7fecc99ae5e492a2b21a0228bf323c3af41ddde9) | 2026-01-24 | docs: add refactoring plan and update implementation docs |
| [17ae7df](https://github.com/jerometremblay/hyperfy/commit/17ae7df57686344efc393bb91d6e648b8670f4a0) | 2026-01-24 | feat: add splat selection and fix rotation persistence |
| [f809597](https://github.com/jerometremblay/hyperfy/commit/f809597ad3eeb2e0080fbcf1053d2f6ec25eae9b) | 2026-01-24 | feat: add splat raycasting and fix ghost splat bug |
| [511f522](https://github.com/jerometremblay/hyperfy/commit/511f522b7211d9b81b830775e41359f762430e80) | 2026-01-24 | refactor: simplify splat loading to use Spark.js native handling |
| [7aac9b5](https://github.com/jerometremblay/hyperfy/commit/7aac9b564c51829e3a4f6e22ee6c2956fa4f25b0) | 2026-01-24 | feat: add streaming PLY loader with progressive rendering |
| [e17317c](https://github.com/jerometremblay/hyperfy/commit/e17317c98cbf5301ec1f128ff414cb86f6787509) | 2026-01-24 | Merge branch 'webviews' into dev |
| [da21a61](https://github.com/jerometremblay/hyperfy/commit/da21a613683c1d78d8b9709e4f467436a5c01532) | 2026-01-24 | fix: webview as a child incorrect size + iframe wobbles |
| [86421d2](https://github.com/jerometremblay/hyperfy/commit/86421d2a2bdcb081b19449f32991d5bb54976b0a) | 2026-01-24 | WebView (#147) |
| [444b3de](https://github.com/jerometremblay/hyperfy/commit/444b3de00d6dbb4556a8a03ef98440630e355fb7) | 2026-01-24 | fix: npm reported vulns |
| [e95f333](https://github.com/jerometremblay/hyperfy/commit/e95f33301f2ec9988f054b2967d40a40ebb726c0) | 2026-01-24 | feat: backup/restore world folder endpoints |
| [abc4bb8](https://github.com/jerometremblay/hyperfy/commit/abc4bb8a613c4e24500160ff03a806e4c4c80d7e) | 2026-01-23 | perf: add device-based LOD settings for mobile/Quest |
| [6ad13f6](https://github.com/jerometremblay/hyperfy/commit/6ad13f6beeb5faa06382e6132435614c7201445e) | 2026-01-23 | fix: attach SparkRenderer to camera for float16 precision |
| [202200b](https://github.com/jerometremblay/hyperfy/commit/202200b12de500686329f91f3885a1f2f249c812) | 2026-01-12 | feat: implement LOD system for Gaussian Splatting with Spark 0.1.10 |
| [38d93a0](https://github.com/jerometremblay/hyperfy/commit/38d93a00ffff24c9c63c34d7c26c1d6193dac1fe) | 2026-01-08 | feat: add gs.hyp template with default cube and file input support |
| [d869ddc](https://github.com/jerometremblay/hyperfy/commit/d869ddc21366bb30252cb9c2b0075e1646692c7f) | 2026-01-08 | Merge remote-tracking branch 'origin/dev' into feature/gaussian-splatting |
| [f77122e](https://github.com/jerometremblay/hyperfy/commit/f77122ea71fce6ff764e9bb3243dc9b9674bec8c) | 2025-12-19 | [imp] prim, keep shape in octree when opacity=0 for interaction |
| [6b837d0](https://github.com/jerometremblay/hyperfy/commit/6b837d06dfb6d47a5b321cdfbed216f2bbb9a485) | 2025-11-17 | Enhance OpenAIClient to support custom base URL configuration |
| [8177465](https://github.com/jerometremblay/hyperfy/commit/8177465401f66d3b7d01a8b20be43c4262c79a09) | 2025-10-16 | Fix float precision artifacts with 10x internal scaling |
| [ac5def5](https://github.com/jerometremblay/hyperfy/commit/ac5def556696dc18f897fbcac8cc73861c2d538a) | 2025-10-16 | Add SplatMesh Debug Information and Enhance Gaussian Splat Scaling |
| [6c22aa0](https://github.com/jerometremblay/hyperfy/commit/6c22aa05f0e600214921147214755b21807ac0e7) | 2025-10-16 | Enhance Gaussian Splat with Splat Scale Property |
| [771489b](https://github.com/jerometremblay/hyperfy/commit/771489b424a0e1a0b9984141093c97d73844b51a) | 2025-10-16 | Enhance SPZ Splat Renderer for Float Precision |
| [a2500ae](https://github.com/jerometremblay/hyperfy/commit/a2500ae77f6f8c54ca7eb598461135a860c336ea) | 2025-09-28 | Remove .claude/settings.local.json from tracking (should be gitignored) |
| [d01b815](https://github.com/jerometremblay/hyperfy/commit/d01b815fc04f89dd9f9dd5e60ac969a04bbf51be) | 2025-09-28 | Finalize Gaussian Splatting Integration with Hyperfy |
| [c1574e0](https://github.com/jerometremblay/hyperfy/commit/c1574e00aef4bf10d68ef036ed12524aeb56ea11) | 2025-09-27 | Enhance Splat File Handling and Loader Efficiency |
| [d02e0f5](https://github.com/jerometremblay/hyperfy/commit/d02e0f5e042219b7cdde79d286a0d6e902b051cd) | 2025-09-26 | WIP: Fix SOGS file loading and improve splat format detection |
| [0215ad0](https://github.com/jerometremblay/hyperfy/commit/0215ad07efb9a478fcb1f064cecee9f809eb535c) | 2025-09-26 | Merge origin/dev into feature/gaussian-splatting |
| [28386ad](https://github.com/jerometremblay/hyperfy/commit/28386ad354cbd420872588fb575dda47ca3beee4) | 2025-09-25 | chore: Update dependencies and .gitignore |
| [c671398](https://github.com/jerometremblay/hyperfy/commit/c6713984235724d007961e96ff97079b86e2c75e) | 2025-09-25 | fixed: Update Gaussian Splat visibility and auto-rotate functionality |
| [66305e3](https://github.com/jerometremblay/hyperfy/commit/66305e35ed36b2ce6d14f8732301d249b7c4f780) | 2025-09-24 | refactor: Remove falloff property from Gaussian Splat implementation |
| [1a4524a](https://github.com/jerometremblay/hyperfy/commit/1a4524ad38c8dbb3fbc785951e0104e02fc60194) | 2025-08-22 | feat: Add comprehensive SOGS support and enhanced Splat properties |
| [0437b5b](https://github.com/jerometremblay/hyperfy/commit/0437b5b5e715609123adc57cdf299a3014c0baa0) | 2025-08-21 | feat: Enhance Gaussian Splat functionality with color, opacity, and falloff properties; update related configurations |
| [406bb50](https://github.com/jerometremblay/hyperfy/commit/406bb50d7be9c6e3ec5c76dd34f5257bc4b6654f) | 2025-08-20 | refactor: Remove console logs for cleaner code and improved performance |
| [4baf48a](https://github.com/jerometremblay/hyperfy/commit/4baf48ae9c693b5b64e95c89d674cb35f6f894c5) | 2025-08-20 | fix: Prevent Spark.js server-side execution causing navigator undefined error |
| [db35c5f](https://github.com/jerometremblay/hyperfy/commit/db35c5fbb3bda40260d6170411cfd5e60fc24644) | 2025-08-20 | Merge remote-tracking branch 'origin/dev' into feature/gaussian-splatting |
| [d5b6349](https://github.com/jerometremblay/hyperfy/commit/d5b6349890fae02b07d97b38844c15a4711888c6) | 2025-08-20 | feat: Fix Cleaner deletion of Splat assets - WIP server restart issue |
| [fc77bf0](https://github.com/jerometremblay/hyperfy/commit/fc77bf0ebf264cc48891ba1063dde86700965bd1) | 2025-08-19 | feat: BREAKTHROUGH - All splat formats working via drag & drop! 🎉 |
| [804031f](https://github.com/jerometremblay/hyperfy/commit/804031f0249f7b38a9b22932216dd934e044849c) | 2025-08-19 | feat: Complete PLY and SPZ Gaussian Splat support with App List integration |
| [4819dd8](https://github.com/jerometremblay/hyperfy/commit/4819dd8f3124a6af35cdf9948fd613fbf74b1eef) | 2025-08-19 | feat: Enhance Gaussian Splat loading with timeout, progress tracking, and memory monitoring |
| [fb5fa11](https://github.com/jerometremblay/hyperfy/commit/fb5fa1180afcf403f65a2baf92b4446f6ea0d1fb) | 2025-08-19 | fix: Splat apps now appear in App List |
| [4a77cbb](https://github.com/jerometremblay/hyperfy/commit/4a77cbbff123418b2e09af1f40888aa3cf0e6d4b) | 2025-08-19 | debug log clean up |
| [7eb6aa5](https://github.com/jerometremblay/hyperfy/commit/7eb6aa5eb3fcde44841daba79c4762eb78684b74) | 2025-08-18 | WIP: Major fixes for Gaussian Splatting - SPZ and PLY working |
| [ed1cd76](https://github.com/jerometremblay/hyperfy/commit/ed1cd763e885001e7ce91b9e59f39ef08278c9bc) | 2025-08-18 | WIP |
| [fe66c8e](https://github.com/jerometremblay/hyperfy/commit/fe66c8ea0b7c8e7c267aa1b3b4b691fd1a3a8d27) | 2025-08-18 | feat: Clean up Gaussian Splatting with robust SPZ handling and client-server separation |
| [fdb0246](https://github.com/jerometremblay/hyperfy/commit/fdb02464207d777b754357eaf91a183bb82ffd9f) | 2025-08-17 | feat: Complete Spark.js Gaussian Splatting integration with drag & drop |

## Exact diff reproduction

```sh
git diff --name-status 5d20037435a1d86cda088382bb12737e9f18d5f6 192087f8bc776b3733573dad5156fb3e6d57d7d5
git diff --numstat 5d20037435a1d86cda088382bb12737e9f18d5f6 192087f8bc776b3733573dad5156fb3e6d57d7d5
git diff 5d20037435a1d86cda088382bb12737e9f18d5f6 192087f8bc776b3733573dad5156fb3e6d57d7d5 -- path/to/file
git log --oneline 5d20037435a1d86cda088382bb12737e9f18d5f6..192087f8bc776b3733573dad5156fb3e6d57d7d5
```

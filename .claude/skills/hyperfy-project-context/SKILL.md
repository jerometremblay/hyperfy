---
name: hyperfy-project-context
description: >
  Apply the project's Hyperfy platform direction when planning or reviewing
  changes. Use when choosing architecture, evaluating forks, or extending the
  world with programmable multiplayer, WebXR, AI-generated, or splat content.
---

# Hyperfy Project Context

This project uses the `moritzhckr/hyperfy-splatting` direction as an experiment
in a self-hosted, persistent, programmable multiplayer world. The world is made
of Hyperfy apps: JavaScript behavior, ordinary 3D assets, avatars, UI, physics,
and Gaussian-splat environments should coexist in one shared space.

## Architecture decisions

- Check the vanilla Hyperfy App/World APIs and the current fork before adding a
  new abstraction. Prefer a small app or an existing node over a parallel
  object, persistence, networking, or permissions system.
- Keep responsibilities separate: Hyperfy owns world state and multiplayer
  runtime; app scripts own local object behavior; external services are added
  only when the world API is not the right boundary.
- Treat JavaScript apps and source-controlled prototypes as the primary unit of
  experimentation. Preserve stable IDs and explicit server/client ownership
  when state must be shared.
- Keep static interactions event-driven. A frame callback that immediately
  returns still puts its app in the active loop on that runtime. Prefer action,
  trigger and effect-end callbacks; verify zero idle server and client frame
  callbacks using [App performance](../../../docs/scripting/performance.md).
- Treat Gaussian splats as another world content type, not as a replacement for
  normal Hyperfy apps. Test large-scene loading, LOD, interaction, persistence,
  duplication, and WebXR separately from ordinary GLB/VRM behavior.
- AI-generated assets or app code are inputs to the platform; validate their
  file type, runtime permissions, scale, performance, and multiplayer behavior
  before treating them as durable world content.

## Decision filter

Before implementing a feature, answer:

1. Does Hyperfy already expose this through an App, World, node, or editor flow?
2. Is the behavior per-object, per-player, or world/server-wide?
3. Does every player need the same state, including late joiners?
4. Is the change a throwaway prototype or a production feature?
5. What is the smallest browser/WebXR test that proves it works in the shared
   world?

Avoid turning a successful prototype into permanent infrastructure without
capturing the decision and its measured limits.

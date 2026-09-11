# Project Wiki

This wiki stores the design rules and architecture decisions that should guide changes to apps in this Hyperfy project.

## Start here

- [App design rules](app-design-rules.md) — the interaction, networking, persistence, and synchronization contract for world-affecting apps.

## Working rule

Read the app design rules before changing an app's user interactions, shared state, persistence, or multiplayer behavior. Keep the implementation close to Hyperfy's existing `App`, `app.send`, `app.on`, and world-storage APIs unless the project documents a reason to introduce something else.

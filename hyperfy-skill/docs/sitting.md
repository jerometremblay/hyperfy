# Sitting positions, action markers, and seat behavior

Sittable furniture should use explicit **seat anchors plus Hyperfy action markers**. Do not rely only on clicking arbitrary furniture geometry when a normal player interaction is appropriate.

Each physical sitting place is a separate seat.

Examples:

- a three-seat couch has three independent seats
- a two-seat couch has two
- every dining chair has one
- every sitting stump has one

Each seat needs its own:

- stable seat ID
- sitting anchor
- facing direction
- action marker
- occupancy state
- safe standing/exit position

### Use normal action markers

The expected interaction is the standard Hyperfy action prompt:

**Press E — Sit**

Place the action marker near the usable part of the seat, normally around the front of the cushion or sitting surface where the player naturally approaches it.

Do not put a single generic action in the center of a multi-seat couch. Each cushion needs its own action and anchor.

The marker should make it obvious which exact sitting position will be used.

### Seat anchors must match the furniture

The anchor determines the avatar's final seated position and orientation.

Place it according to the actual geometry of the seat rather than using a generic height.

For a couch:

- center the anchor on the individual cushion
- place it slightly toward the front of the cushion as appropriate for the sitting animation
- orient it so the avatar faces away from the backrest
- set the height so the avatar sits naturally on the cushion

For chairs, benches, logs, stools, etc., derive the anchor from their actual sitting surface and orientation.

Do not let the avatar sink deeply into the cushion. We found that the normal seated pose looked correct anatomically but needed to be raised slightly so only a small amount of the avatar intersects the cushion.

The pose should look supported by the furniture, not embedded in it or floating above it.

### Hide action markers while sitting

Once the local player successfully sits down, the sitting action marker must disappear.

For multi-seat furniture such as a couch, hide **all of that furniture's Sit markers while that local player is seated**, not just the marker belonging to the selected cushion.

This is important on three-seat couches. Leaving the other two `Sit` prompts visible while already seated is distracting and can cause incorrect interactions.

Conceptually:

```text
standing near couch
    ↓
three available "Press E — Sit" markers

player activates middle seat
    ↓
player becomes seated
    ↓
all couch Sit markers disappear locally

player stands / seated effect ends
    ↓
available Sit markers return
```

Do not permanently remove the actions. Temporarily disable or hide them and restore them when the seated state ends.

### Restore markers from the sitting effect's cleanup

Marker restoration must be tied to the actual lifetime of the seated effect.

Do not assume the only way to leave a seat is another explicit Sit/Stand interaction.

The sitting effect can end because of:

- movement
- jumping
- cancellation
- clicking/toggling the seat again
- another effect replacing the sitting effect
- destruction/rebuild of the app
- loss of the seat

Use the seated effect's `onEnd`/cleanup lifecycle as the authoritative place to restore local interaction state.

The basic rule is:

```text
sit starts
→ hide markers

seat effect ends for any reason
→ clear local seated state
→ release occupancy
→ restore appropriate markers
```

This avoids the bug where a Sit marker remains permanently hidden, or remains visible while the player is still sitting.

### Movement should stand the player up

Sitting should be cancellable.

Normal player movement should end the sitting effect. Jumping should also allow the player to leave naturally.

The player should not become trapped in a seat.

Activating the same seat again may also toggle the seated state and stand the player up.

### Provide a safe exit position

Each seat should have a separate exit/standing position.

When the sitting effect ends, place the player somewhere they can actually stand.

Do not simply teleport to the anchor itself, because that can leave the player:

- inside the couch
- inside a chair
- under a table
- inside another collider
- intersecting the backrest

Put the exit point beside or in front of the seat, outside the furniture's collision volume.

For a row of seats, calculate the exit position per seat so players do not all stand at the same point.

### Multi-seat furniture

Treat every cushion as an independent seat.

A three-seat couch should effectively be:

```text
couch
├── seat-left
│   ├── anchor
│   ├── action
│   └── exit
├── seat-middle
│   ├── anchor
│   ├── action
│   └── exit
└── seat-right
    ├── anchor
    ├── action
    └── exit
```

Use stable deterministic IDs such as:

```text
sofa-0
sofa-1
sofa-2
```

Do not derive seat identity from transient node ordering.

Seat spacing should follow the visible cushions rather than simply dividing the full bounding box blindly.

### Occupancy must be authoritative

In multiplayer, two players must not be able to claim the same seat.

Seat occupancy should be authoritative on the server and synchronized to clients.

A typical state is conceptually:

```js
{
  "sofa-0": playerId,
  "sofa-2": anotherPlayerId
}
```

The server should approve or reject seat claims.

Do not let the client independently decide that a seat has been successfully claimed.

When a player:

- stands up
- disconnects
- loses the effect
- changes seats
- or the furniture is destroyed

their seat claim must be released.

### Occupied-seat interaction

An occupied seat must not remain usable by another player.

Do not display a normal actionable `Press E — Sit` prompt for a seat that the local player cannot claim.

An occupied seat's action should therefore be hidden or disabled until the seat becomes available again.

Availability changes should update the marker without rebuilding the whole furniture object.

### Sitting direction matters

The anchor rotation is part of the seat definition.

For normal furniture, the avatar should face outward from the backrest.

For circular arrangements such as logs around a campfire, each anchor should face toward the center of the fire.

Do not use one global rotation for every seat unless all seats genuinely face the same direction.

### Use one sitting animation consistently

Furniture belonging to the same construction should normally use the same seated animation unless there is a reason to distinguish poses.

The anchor controls the placement and orientation; the emote controls the body pose.

Do not compensate for badly placed anchors by distorting the animation.

First get the anchor position, height, and rotation correct.

### Markers are interaction UI, not decoration

A Sit marker should exist only when activating it makes sense.

It should not be visible:

- while the local player is already seated on that furniture
- when its seat is occupied by another player
- while a claim for that seat is already pending
- after the app or seat has been destroyed

It should reappear when the corresponding seat becomes genuinely available again.

This prevents stale `Press E` prompts.

### Do not leave markers inside the avatar

Place the action marker slightly in front of or above the usable sitting surface rather than exactly at the avatar's seated pelvis position.

The seat anchor and interaction-marker position are separate concepts:

```text
action position = where the standing player interacts

anchor position = where the seated avatar is attached
```

Do not use the same coordinates blindly for both.

### Suggested sitting lifecycle

A robust seat interaction should follow this lifecycle:

```text
AVAILABLE
  action marker visible
  seat unoccupied

        ↓ Press E

CLAIMING
  prevent duplicate local requests
  wait for authoritative seat claim

        ↓ accepted

SEATED
  anchor player
  play seated emote
  hide this furniture's Sit markers
  mark seat occupied

        ↓ movement / jump / toggle / effect cancellation

ENDING
  seated effect onEnd runs
  release authoritative occupancy
  move player to safe exit position
  clear local sitting state

        ↓

AVAILABLE
  restore markers for seats that are actually free
```

If the claim is rejected, immediately return to `AVAILABLE`.

### Important cleanup rule

Treat `onEnd` as something that may run through many paths.

Cleanup should therefore be idempotent.

Do not:

- release the same seat incorrectly after switching seats
- restore stale markers from an older sitting effect
- teleport the player because an obsolete effect finished later
- let an old callback clear a newer seated state

Associate the effect with the exact seat/current sitting entry and verify it is still the active one before performing cleanup.

### General rule

A good Hyperfy seat should behave like a native interaction:

**approach seat → Press E → sit naturally → prompts disappear → move/jump to stand → safe exit → prompts return.**

For multi-seat furniture, every cushion remains an independent synchronized seat, but while the local player is sitting on that furniture the other Sit prompts should stay out of the way.
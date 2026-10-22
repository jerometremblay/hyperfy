# Pool practice requirements

These implementation requirements use short, direct sentences in the requested
STE100 style. This is not a formal ASD-STE100 conformance assessment. The linked
conversation's user messages were readable. Its assistant messages were reference
markers, so no unavailable assistant text is represented as an agreed requirement.

## Package and placement

1. Supply one importable Hyperfy `.hyp` file.
2. Include all app code and ball textures in this file.
3. Keep source modules separate during development.
4. Use the existing Hyperfy app and network APIs.
5. Do not use Hyperfy rigid-body physics for ball motion.
6. Supply a plain practice surface. Do not require a furniture model.
7. Let the builder hide this surface to use an artist's table.
8. Place the app origin at the centre of the cloth surface.
9. Use metres, seconds, kilograms, and radians.
10. Keep the app level and at scale 1 for regulation dimensions.
11. Supply the WPA 8-foot and 9-foot playing-surface sizes.
12. Use balls with a diameter of 57.15 mm and a mass of 170 g.

## Simulation

13. Use the pinned Tailuge physics model.
14. Run the simulation on the server only.
15. Use a fixed simulation step of 1/480 second.
16. Include ball collisions, spin, cloth friction, cushion rebound, and pockets.
17. Keep the upstream restitution and friction equations.
18. Document the model's numerical and geometric limits.
19. Do not claim exact or perfect collisions.
20. Limit shot speed to 5 m/s and cue offset to 0.45 ball radii.
21. Reject a new shot while a ball moves.
22. Reject a new shot when the cue ball is in a pocket.
23. Stop simulation work while all balls are at rest.
24. Limit simulation catch-up work after a slow server frame.
25. Show an error and allow a fresh rack after a solver failure.

## Shared play and controls

26. Let one nearby player control the table at a time.
27. Use the authenticated network sender to identify this player.
28. Reject input from an unknown, distant, or non-owning player.
29. Reject stale and duplicate state-changing requests.
30. Give the client the camera only after the server accepts the claim.
31. Supply aim, speed, spin, shot, rack-reset, and exit controls.
32. Allow cue-ball placement after a scratch.
33. Reject cue-ball positions outside the play area or on another ball.
34. Release ownership after disconnect, distance loss, or lease expiry.
35. Continue a shot when its player leaves.
36. Give late clients the current server snapshot.
37. Interpolate snapshots on clients. Do not simulate client ball collisions.
38. Stop rendering balls outside the viewing distance.
39. State that this version provides shared practice, not a complete 8-ball match.

## Acceptance

40. Check collisions, pockets, spin, friction, and a full-rack break.
41. Check repeatable simulation results for identical input.
42. Check two-client agreement and a late join.
43. Check claim conflicts, invalid input, stale input, and ownership release.
44. Check the actual Hyperfy node constructors and script sandbox.
45. Check every packaged asset against its content hash.
46. Inspect the exact package from six directions.
47. Run the app in a separate Hyperfy test world.
48. Keep the house world and unrelated source changes intact.
49. Deliver source and license notices with the package.

## Updated physical-cue interaction

50. Require a cue held from the existing wall rack before a player can aim or play.
51. Authenticate rack pickup and return from the network sender.
52. Put the aiming camera low behind the cue ball along the selected shot direction.
53. Align the actual held cue behind the ball. Do not show a trajectory line.
54. Show the aiming cue to other players and clients that join during aiming.
55. Release camera ownership and captured movement keys immediately on a strike.
56. Let the player walk and look normally while the balls continue to move.
57. Require a new click/E interaction after the balls stop to aim again.
58. Cancel aiming if the player returns the cue, disconnects or leaves the area.
59. Keep the rack's X return behavior and the table's existing placement.
60. Orbit the aiming camera around the cue ball with mouse movement.
61. Keep the avatar behind the cue, with its collision capsule outside the rails.
62. Preserve the last aiming orientation at a strike. Pull back behind the avatar
    at the nearest third-person zoom, initially focused on the pre-strike cue ball.
63. Keep mouse look and walking available in the follow-through view. Do not chase
    the moving cue ball. Move the camera/focus with the avatar when the player walks.
64. Ease from the aiming view to the third-person view over 0.45 seconds. Start
    at the exact aiming pose; keep input available and avoid a camera jump.
65. After a strike, return the camera pivot to the player's standard standing
    eye-height and shoulder offset. Aim toward the cue ball during the return.
    Thereafter orbit/follow the player; do not retain a ball-centred camera pivot.
    This replaces the earlier pre-strike-focus behavior.

66. After shooting, fully release every game camera/input control and return to
    Hyperfy's normal player mode, including native zoom and wall collision.
    This supersedes requirements 62-65 for custom post-shot camera behavior.
67. Name the table action Play and cover the whole table surface. Enable it only
    while the player holds a rack cue; otherwise hide it and silently ignore clicks.
    The player explicitly activates Play again for each shot.

68. When releasing a shot, initialize the native player camera at the closest
    third-person zoom (0.3 m) looking toward the pre-strike cue ball. Replace the
    old saved zoom and pitch, then immediately leave all normal input/collision
    with Hyperfy. Do not retain a custom camera or follow the moving ball.

69. Animate the native return from the aiming view to the close third-person
    view over 0.45 seconds, easing in and out without capturing input or disabling
    native camera collision.

70. Hide all Play actions while the local player is aiming, including actions
    attached to the visible furniture. Reset top and side spin to zero on each
    new aiming session.

71. After a scratch, retain the normal mouse/left-right-arrow orbit around the
    white ball. Use WASD to move its visible mesh relative to the viewing direction
    within the cloth boundaries. Space confirms through existing server placement
    validation and continues aiming at that position; Escape cancels the preview.

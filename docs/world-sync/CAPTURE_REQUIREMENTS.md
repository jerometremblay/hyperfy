# World Capture Requirements

## 1. Purpose

This document defines requirements for `worldsync capture`.

The command shall back up persistent world state to the world source
repository. It shall not change the live world.

The command shall capture all persistent scene content and all seat-pose data
by default. Destination identity reconciliation is later work.

## 2. Terms

**World profile**: A local name for one configured live world.

**Logical key**: A stable source ID for one resource in the source repository.

**Seat pose**: One saved Pose Editor configuration for one avatar and one seat.

**Seat-pose style**: One saved Pose Editor style collection for one user.

## 3. World capture requirements

**CAP-001** The command shall require one world profile and one scene key.

**CAP-002** The command shall read one consistent snapshot from the server.

**CAP-003** The snapshot shall include one world revision. The command shall
stop if the server cannot provide a consistent snapshot.

**CAP-004** The command shall capture all persistent, non-player scene
entities, their blueprints, the `$scene` environment, portable world settings,
spawn, and required assets.

**CAP-005** The command shall capture new persistent resources without a
separate adoption request.

**CAP-006** The command shall assign each new resource a unique logical key.
It shall save the key-to-runtime-ID mapping with the capture.

**CAP-007** The command shall use saved mappings for existing resources. It
shall not match a resource by name or position.

**CAP-008** The command shall report each resource that it cannot map. It shall
not drop the resource from the backup.

**CAP-009** The command shall capture position, rotation, scale, pinned state,
and logical key for each persistent placement.

**CAP-010** The command shall capture a deletion only when the server provides
a tombstone for the resource.

**CAP-011** The command shall write editable blueprint source only when it can
recover the source data exactly.

**CAP-012** When the command cannot recover editable source, it shall save the
blueprint as a native HYP file. It shall report this choice.

**CAP-013** The command shall capture only fields that the scene settings and
spawn schemas allow. It shall exclude private and transient settings.

**CAP-014** The command shall include every required asset. It shall verify
each asset hash before it writes the backup.

**CAP-015** The command shall compare the snapshot with the last captured or
deployed baseline.

**CAP-016** The command shall report conflicts between live changes and source
changes. It shall not replace either change without an explicit resolution.

**CAP-017** The command shall capture the same source files when the world has
not changed.

**CAP-018** The command shall include new persistent resources in every
capture. It shall not require a per-resource approval step.

## 4. Seat-pose requirements

**CAP-019** The command shall capture all seat poses and seat-pose styles by
default.

**CAP-020** The command shall support `--exclude-seat-poses`. This option shall
exclude all seat poses, profile poses, and seat-pose styles from that capture.

**CAP-021** The command shall not require user IDs or identity aliases to
capture seat-pose data.

**CAP-022** The command shall read only the `seatPose:`, `seatPoseProfile:`,
and `seatPoseStyles:` storage key groups. It shall not read the complete world
storage file.

**CAP-023** The command shall preserve every seat-pose record that the server
returns. This includes records for users and avatars that are not present in
the current scene.

**CAP-024** The command shall preserve source user IDs and avatar URLs in the
seat-pose backup. It shall not write these values to command logs.

**CAP-025** The command shall preserve the source anchor ID for each seat pose.
It shall also store a logical instance key and local anchor name when the
worldsync map can resolve them.

**CAP-026** The command shall preserve a seat pose when it cannot resolve its
anchor. It shall report the unresolved anchor. It shall not attach the pose to
another seat.

**CAP-027** The command shall preserve profile IDs for profile poses.

**CAP-028** The command shall store all captured seat-pose data in
`scenes/<scene>/seat-poses.json`.

**CAP-029** The Agent API shall return all seat-pose records to a caller with
the world capture permission. It shall not expose other storage key groups.

**CAP-030** The Agent API shall check capture permission on the server. It
shall not trust a user ID from browser input.

**CAP-031** The command shall not reconcile source user IDs with destination
user IDs. Destination identity reconciliation is out of scope for this work.

## 5. Write and report requirements

**CAP-032** `capture --dry-run` shall report planned file changes. It shall not
write files or change the live world.

**CAP-033** `capture --write` shall write only to the selected local source
repository. It shall not commit or push changes.

**CAP-034** `capture --propose` shall create a reviewable change. It shall not
write to the protected default branch.

**CAP-035** The command shall not write credentials to tracked files or logs.

**CAP-036** The command shall preserve unrelated dirty files. It shall stop
when a capture would overwrite a local change.

**CAP-037** The command shall report the world profile, scene key, snapshot
revision, resource counts, seat-pose count, and planned file changes.

**CAP-038** The command shall report when `--exclude-seat-poses` is active.

## 6. Acceptance checks

Capture is ready when all checks pass:

1. A dry run reports the selected world and planned changes. It changes no file
   and no live world state.
2. A capture includes every new persistent resource without a separate
   adoption request.
3. A capture with no exclusion option saves seat poses and styles for all
   users and avatars.
4. A capture with `--exclude-seat-poses` saves no seat-pose data.
5. The backup preserves source user IDs, avatar URLs, source anchor IDs, pose
   values, profile IDs, and style data.
6. A pose with an unresolved anchor stays in the backup and appears in the
   report. The command does not attach it to another seat.
7. A repeated capture of unchanged world state produces no source diff.
8. A capture does not read, export, replace, or delete unrelated world
   storage.
9. A capture does not commit, push, or change the live world.

## 7. Command examples

```sh
worldsync capture --root ../hyperfy-world-jerome \
  --scene local-world --profile local-3333 --dry-run

worldsync capture --root ../hyperfy-world-jerome \
  --scene local-world --profile local-3333 --write

worldsync capture --root ../hyperfy-world-jerome \
  --scene local-world --profile local-3333 \
  --exclude-seat-poses --write
```

Use `--bootstrap` only when the profile has no worldsync map. The command shall
still capture all persistent resources in that world.

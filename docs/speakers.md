# External audio speakers

The Hyperfy Speaker app receives an external LiveKit audio stream associated
with its app instance. The native receiver positions the sound at the app's
world transform, so moving the speaker moves the sound source. This is separate
from playing an uploaded file with an Audio node.

Select the speaker in the builder to configure:

| Control | Default | Behavior |
| --- | --- | --- |
| Volume | 1 | Overall level, from 0 to 1. |
| Localized sound | Yes | Blend nearby stereo into a directional mono point source with distance. Turn off for stereo everywhere without distance attenuation. |
| Near — full volume & stereo (m) | 2 | Full stereo and volume inside this radius; adjustable from 1 to 20 m. |
| Far — maximum range (m) | 30 | Sound fades to silence at this distance; adjustable from 5 to 100 m. The receiver enforces at least 1 m beyond Near. |

Between Near and Far, volume falls linearly while a smooth blend shifts stereo
into spatial playback. Volume still applies when localization is off. Both
paths pass through the listener's **Music** volume group. A disabled, crashed,
or rebuilding speaker is muted, as is a muted incoming track.

Keep the external publisher running while streaming. The engine needs its
LiveKit connection configured; adding a speaker model alone does not capture
system audio. The Mac helper workflow and deployment-specific setup are in the
[connected speaker notes](../outputs/hyperfy-speaker/README.md).

Implementation: [receiver and mixing](../src/core/extras/SpeakerAudio.js) and
[speaker app fields](../outputs/hyperfy-speaker/speaker.js).

# Commands

There are a few commands that can be used by entering them in the chat.

### `/admin <code>`

If your world has an admin code set, the only way to become an admin is to use this command with your code (see your .env file).

If your .env doesn't have an ADMIN_CODE set, then all players are treated as an admin.

### `/spawn set`

Sets the spawn point for all future players entering the world, to the current position and direction you are facing. Requires builder rank.

### `/spawn clear`

Resets the spawn point back to origin. Requires builder rank.

### `/name <name>`

Sets your player name.

### `/time set 13h23`

Smoothly fast-forwards the day–night cycle to the next 13:23 in the shared **World Time
Zone** (default `America/Toronto`) over up to five seconds, then continues at normal speed. An earlier time moves
forward through midnight. Accepts `00h00` through `23h59`. Requires builder rank.
Enables the day–night cycle and applies to everyone, including visitors who join later.
The shared transition and offset persist across server restarts. Another time command
starts from the current animated time without a jump.
The server interprets the command and synchronizes the clock for every player. The success
message is shared in chat. A player's device clock or timezone does not change the result.

### `/time reset`

Returns the day–night cycle to the current real time. Requires builder rank.

### `/chat clear`

Clears all chat messages. Requires builder rank.

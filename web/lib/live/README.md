The room's LIVE page initializes `/api/live`, then opens an authenticated,
same-origin Socket.IO connection at `/live-ws` using WebSocket transport only.
The Node HTTP server relays a dedicated authenticated WebSocket to the room's
mapped core host. Core frames are scoped to `live:<ruid>`. Host URLs and JWTs
stay on the server. Existing admin SSE events are unchanged.

Run with `next start` or `next dev` on a persistent Node process. Forward
WebSocket upgrades for `/live-ws` through the reverse proxy and allow outbound
WebSockets to core's `/ws`. Serverless platforms that cannot retain WebSocket
connections do not support this relay. No additional port or environment
variable is required.

Core captures public scores, shot-button state, player positions, and disc positions on every
`onGameTick`, with a one-second heartbeat during pauses/stops. Stadium metadata
is sent reliably on change and subscription; transient frames are volatile so
slow connections do not accumulate stale updates. IPC skips frames while a prior
send is pending. The canvas uses an 80 ms interpolation buffer and freezes at
the latest known position during outages. Shot presses/releases also trigger snapshots
through `onPlayerInput`; players have a white outline while holding shot, including
away from the ball. This uses `player.input & room.InputFlags.kick` from haxball.js
5.1.0 rather than inferring input from successful ball kicks. Only the derived
`kicking` boolean is transmitted, not the other input flags.

Headless Host has no stadium geometry getter. RoomService retains HBS data for
maps loaded by this application, resolves bundled maps selected in-game, and
labels other external stadiums as having unavailable geometry. Such maps use
a generic camera frame with real player/disc positions. The renderer resolves
HBS segment traits and draws straight/curved segments, markings, discs, and
player labels. It currently uses default red/blue team discs; custom jersey
stripes and avatars are not reproduced.

`types.ts` mirrors core's public `LiveProtocol.ts`; update both for protocol
changes. Frames exclude auth, IP/connection data, passwords and room configs.

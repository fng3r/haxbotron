The public broadcast page initializes `/api/public/live`, then opens a
same-origin Socket.IO connection at `/public-live-ws` using WebSocket transport only.
The Node HTTP server shares one authenticated upstream WebSocket per room
to its mapped core host. Core frames are scoped to `live:<ruid>`. Host URLs and JWTs
stay on the server. Existing admin SSE events are unchanged.

Run with `next start` or `next dev` on a persistent Node process. Forward
WebSocket upgrades for `/public-live-ws` through the reverse proxy and allow outbound
WebSockets to core's `/ws`. Serverless platforms that cannot retain WebSocket
connections do not support this relay. No additional port or environment
variable is required.

Public viewing is available at `/live` (directory) and `/live/<ruid>` (broadcast).
The directory exposes only online rooms mapped to enabled, healthy hosts that
advertise `capabilities.liveBroadcast: true` in their authenticated system API.
Older hosts are excluded until updated. Room discovery returns only room IDs,
names, online player counts and viewer counts. All such rooms are publicly watchable.

The public viewer initializes `/api/public/live` and uses the broadcast
`/public-live-ws` WebSocket relay. Also forward upgrades for this path through
the reverse proxy. The public socket accepts broadcast subscriptions and viewer chat;
upstream core JWTs remain on the web server. `/api/public/rooms` and
`/api/public/live` are the only public API exceptions. Admin pages,
control APIs and administrative SSE remain authenticated; the SSE
provider is mounted only in the admin layout.

Run `npm run build && npm run test:public-live` in web for a production
HTTP/WebSocket check. It uses temporary storage, synthetic hosts and test-only
credentials, without modifying the configured room/host state.

The first browser subscription creates a room relay. Other viewers share that
upstream, including while its initial connection is pending. The relay caches
the latest positions, stadium geometry and current match timeline and replays
these reliably to new viewers. Ordinary movement frames remain volatile.
Reconnection is shared and restores all viewers; stale cached state is cleared
on outages. Source initialization/authentication failures retry with fresh host
mapping and credentials. Browser commands are never forwarded to core.

The last viewer leaving starts a 30-second grace period (`LIVE_RELAY_GRACE_MS`
in `relay-pool.ts`). A returning viewer cancels closure and reuses the warm
stream. Otherwise the upstream is disconnected and its cached state is removed.
Unwatched rooms have no broadcast upstream once grace expires. This stops
unnecessary core-to-web traffic but does not disable worker snapshot capture or
match-event recording. Chat history is independent of relay connection lifetime.

Viewer counts now belong entirely to the single web process. Each subscribed
browser tab counts once, even during an upstream outage; raw connections without
a room subscription do not count. Leaving, disconnecting or switching rooms
updates counts immediately, and repeated subscriptions do not increment them.
Web emits `live:viewers` to room viewers. The public directory reads these same
in-memory counts without waiting for core health snapshots and polls every five
seconds. A retained upstream with no browsers counts as zero viewers. Core no
longer emits viewer counts or exposes them in room info. Old-core count events
are ignored. Counts, like chat, are local to one web process and reset on restart.

The collapsible broadcast side panel has Events and Chat tabs. Viewer chat is
separate from the in-game chat and shared by viewers of the same
room on one web process. It uses the existing WebSocket connection; no core or
nginx changes are needed. A successful broadcast subscription is required to
send or receive chat. Messages are handled locally and never forwarded to core.
Nicknames are self-chosen (not authenticated or reserved), 1–24 characters,
and remembered in browser local storage. Messages are plain text, 1–500
characters, with at most one accepted message per second per connection.
The web process keeps the latest 100 messages per room (up to 500 recently
active rooms) and replays them on reload/reconnect. History resets on web
restart; separate web processes do not share chat history or delivery.

Core captures public scores, shot-button state, player positions, and disc positions
after each simulation step, scheduled from `onGameTick`, with a one-second heartbeat
during pauses/stops. Stadium metadata
is sent reliably on change and subscription; transient frames are volatile so
slow connections do not accumulate stale updates. IPC skips frames while a prior
send is pending. The canvas uses an 80 ms interpolation buffer and freezes at
the latest known position during outages. `onPlayerInput` updates kick readiness
without publishing an intermediate snapshot. The white outline mirrors kick readiness: a press arms
it, a successful `onPlayerBallKick` consumes it, and a release/new press rearms
it. Minimum kick cooldown and rate/burst budgets suppress the outline until the
player is ready again. Counters advance on simulation ticks only; paused games
show no kick outline. The indicator uses actual kick events, including custom
kickable discs, rather than estimating contact from interpolated positions.
Only the derived `kicking` readiness boolean is transmitted, not raw input flags.
The tick hook runs before physics. Outline readiness is committed for that step
and cleared by successful kicks. The host can apply further inputs after its last
physics step in a simulation batch; these wait for the next tick rather than
rearming the outline against positions from the previous step.
A microtask takes the snapshot after the
synchronous step/batch has finished, so a press consumed immediately by a kick
never becomes a visible white-outline frame. Catch-up steps are coalesced.

Successful `onPlayerBallKick` events also send a separate `liveKick` worker IPC
event, forwarded as reliable `live:kick` over the shared upstream and to current
viewers only. Each carries a UUID, timestamp, player ID and match ID. Kicks are
not added to frame caches or timeline history and are not replayed on subscribe.
The volume bar provides a 0–100% slider and mute button. Volume and mute state
are stored in local storage (`live-sound-settings`), shared between rooms and
synchronized across tabs. First-time viewers start muted. Saved audio is restored
on reload; if the browser blocks autoplay, the first pointer/keyboard interaction
activates it without overwriting the preference. Web Audio loads and decodes the
original locally served HaxBall kick and goal WAVs once and routes overlapping one-shot
playback through a shared gain node, so volume changes affect active sounds. Playback follows the 80 ms visual
delay, including in background tabs. Duplicate, stale and previous-match sounds are suppressed;
muting, disconnects and match resets cancel pending audio. Asset provenance and
checksum are in `public/audio/README.md`.

Headless Host has no stadium geometry getter. On stadium changes while stopped,
RoomService synchronously starts/stops a separate zero-frame recording and
decodes its initial custom stadium asynchronously using
[`@hax-brasil/replay-decoder`](https://github.com/haxbrasil/node-haxball-replay-decoder).
Only public geometry is retained for the active map; replay/player data is never
sent to viewers. Revision checks discard results from maps replaced during decoding,
including maps with identical names. Match recording ownership is tracked separately:
probes never run during an active match or replace its complete recording.
No bundled HaxBall engine modifications are needed.

Retained bot-loaded HBS and bundled map lookups provide immediate geometry before
decoding finishes. Native built-in stadiums encode only an ID in replays, so they
still use the bundled lookup. Unknown maps use an approximate camera frame until
extraction succeeds. Unsupported replay formats or unavailable native decoder
binaries log a warning and retain this fallback without stopping the room.
Install core dependencies normally (`npm ci`); the decoder includes prebuilt
binaries for Linux glibc x64/arm64, macOS x64/arm64 and Windows x64.
The renderer resolves
HBS segment traits and draws straight/curved segments, markings, discs, and
player labels. It currently uses default red/blue team discs; custom jersey
stripes and avatars are not reproduced.

Grass and hockey backgrounds have dedicated procedural textures. Grass uses
green diagonal mowing bands and grain inside the rounded `bg.width`/`bg.height`
pitch, with `bg.color` (default `718C5A`) across the surrounding viewport. Hockey
uses lighter concrete inside and darker concrete outside. Plain backgrounds
use their color across the viewport. Textures are generated once per renderer
and the stadium layer is cached until the map or canvas dimensions change.

Broadcast defaults to full-field fit mode (key 0), keeping the entire stadium
visible and centered at any viewport size. Other zooms use native world scale:
1 game unit per CSS pixel at 1×, with
1×/1.25×/1.5×/1.75×/2× levels selected by keys 1–5 or the canvas zoom button.
Shortcuts ignore editable controls and modifier combinations. The camera follows
the interpolated ball and clamps to stadium bounds; maps that fit remain centered.
Zoom also works in theater/fullscreen mode. The stadium cache is rebuilt on zoom
changes, with a maximum texture dimension of 4096 pixels, and reused while panning.

`types.ts` mirrors core's public `LiveProtocol.ts`; update both for protocol
changes. Frames exclude auth, IP/connection data, passwords and room configs.

Fresh score increases trigger a 3-second team-colored goal celebration,
synchronized with the renderer's interpolation delay. Initial subscriptions,
reconnections, stale frames and match resets do not replay old goals. The
celebration respects reduced-motion preferences. Run `npm run test:live` for
the goal-detection checks (Node 22.18+).

Goal snapshots include public scorer/assist names from the same consumed touch
history used by match statistics. Credits survive dropped snapshots and later
nickname changes; a new goal's metadata is forwarded reliably by both WebSocket
hops. Own goals are labelled and omit assists. Unknown/departed players use the
existing statistics fallback, and credits are cleared when a new game starts.

The public broadcast page also shows a match events timeline beside the pitch (below it on
small screens). The room worker owns the current match's full history, so a new
page subscription restores events recorded before the viewer joined or while
the page was closed. Events cover kickoff, goals/own goals with assists,
pause/resume, victory/manual stop, and team changes. Joins and departures are not
recorded; any legacy entries are hidden from the timeline and event counts.
Only public names and IDs are stored, with the match-clock time at each event.

Every kickoff generates a unique `matchId`. `timeline` metadata is sent reliably
when its revision changes, cached by core, and included in new WebSocket
subscriptions; ordinary position frames carry only `matchId`. The browser
replaces older revisions, avoiding duplicate events, and clears history when a
different match begins. The completed match is retained until the next kickoff.
This retention survives browser/web restarts while the room worker remains
alive; closing/restarting the room ends this history. No host code patches,
browser storage or additional database service are involved.

The former admin LIVE page, its navigation entry, `/api/live`, and `/live-ws`
relay have been removed. Broadcasts are accessed exclusively at `/live/<ruid>`.

Standard broadcast controls use local shadcn/ui components: Tabs for Chat/Events,
Toggle Group for event filters, Slider for volume, Input/Label for chat forms,
and Card/Alert/Button for containers and feedback. Tabs are force-mounted and
inactive panels are hidden so drafts and filters survive tab changes. Native
scroll containers preserve chat auto-follow and bounded sidebar/fullscreen
layout. The volume hover container stays inside the fullscreen element; it does
not portal outside the broadcast. Canvas rendering and event rows remain custom.

Goal audio uses the existing guarded score-increase detection, scheduled with
the same 80 ms interpolation delay as the goal celebration. Cached frames,
reconnects and attribution updates do not replay it. Goals and kicks share the
volume bar, persisted preferences, gain node, and mute/cleanup behavior.

Theater mode fills the browser viewport with the broadcast and collapsible
Chat/Events sidebar without invoking the Fullscreen API. Fullscreen mode shows
only the broadcast card, using native fullscreen when available and a viewport
fallback otherwise. Both fit the pitch to the available height. The sidebar
stays mounted while hidden, preserving chat drafts and tab/filter state. Leaving
fullscreen restores the previous normal/theater layout and sidebar preference;
Escape exits theater mode when native fullscreen is not active.

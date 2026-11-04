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

Public viewing is available at `/live` (directory) and `/live/<ruid>` (broadcast).
The directory exposes only online rooms mapped to enabled, healthy hosts that
advertise `capabilities.liveBroadcast: true` in their authenticated system API.
Older hosts are excluded until updated. Room discovery returns only room IDs,
names and online player counts. All such rooms are publicly watchable.

The public viewer initializes `/api/public/live` and uses the read-only
`/public-live-ws` WebSocket relay. Also forward upgrades for this path through
the reverse proxy. The public socket accepts only broadcast subscriptions;
upstream core JWTs remain on the web server. `/api/public/rooms` and
`/api/public/live` are the only public API exceptions. Admin pages, private
WebSockets, control APIs and administrative SSE remain authenticated; the SSE
provider is mounted only in the admin layout.

Run `npm run build && npm run test:public-live` in web for a production
HTTP/WebSocket check. It uses temporary storage, synthetic hosts and test-only
credentials, without modifying the configured room/host state.

Viewer counts are active core `live:<ruid>` subscriptions, shared across public
and admin broadcasts and across web processes. Each open broadcast tab counts
once; players and administrative control connections do not count. Core emits
`live:viewers` when subscriptions join/leave, including disconnect cleanup;
the relay forwards it to the broadcast page. Public discovery includes the
count from core room info and refreshes every five seconds (subject to core
health snapshot caching). Repeated subscriptions do not increment the count.

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
The tick hook runs before physics; a microtask takes the snapshot after the
synchronous step/batch has finished, so a press consumed immediately by a kick
never becomes a visible white-outline frame. Catch-up steps are coalesced.

Headless Host has no stadium geometry getter. RoomService retains HBS data for
maps loaded by this application, resolves bundled maps selected in-game, and
labels other external stadiums as having unavailable geometry. Such maps use
a generic camera frame with real player/disc positions. The renderer resolves
HBS segment traits and draws straight/curved segments, markings, discs, and
player labels. It currently uses default red/blue team discs; custom jersey
stripes and avatars are not reproduced.

`types.ts` mirrors core's public `LiveProtocol.ts`; update both for protocol
changes. Frames exclude auth, IP/connection data, passwords and room configs.

Fresh score increases trigger a 2.4-second team-colored goal celebration,
synchronized with the renderer's interpolation delay. Initial subscriptions,
reconnections, stale frames and match resets do not replay old goals. The
celebration respects reduced-motion preferences. Run `npm run test:live` for
the goal-detection checks (Node 22.18+).

Goal snapshots include public scorer/assist names from the same consumed touch
history used by match statistics. Credits survive dropped snapshots and later
nickname changes; a new goal's metadata is forwarded reliably by both WebSocket
hops. Own goals are labelled and omit assists. Unknown/departed players use the
existing statistics fallback, and credits are cleared when a new game starts.

The LIVE page also shows a match events timeline beside the pitch (below it on
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

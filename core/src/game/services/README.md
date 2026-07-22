# Service Layer

This directory contains the room-scoped services used by the Node runtime.

## Runtime Model

There is no global `ServiceContainer`.

Each room worker builds a `RoomRuntime` in [RoomRuntime.ts](../runtime/RoomRuntime.ts), and that object is passed explicitly into commands, event handlers, and room RPC handlers. This keeps dependencies visible and avoids hidden ambient state.

Current `RoomRuntime` members:
- `config`
- `room`
- `player`
- `playerRole`
- `playerOnboarding`
- `match`
- `ban`
- `chat`
- `social`
- `notification`
- `logger`

## Service Boundaries

- `RoomService`: wrapper around the native Haxball `RoomObject` plus room-derived state like link, notice, and team colours.
- `PlayerService`: in-memory player registry and lookup helpers.
- `PlayerRoleService`: role assignment and admin-restoration policy.
- `PlayerOnboardingService`: join-time hydration, persistence, and whitelist/role resolution.
- `MatchService`: match state, ball touch tracking, possession, and score snapshots.
- `BanService`: ban creation, storage, lookup, and join-time ban evaluation.
- `ChatService`: mute/freeze/flood logic and message validation.
- `ConfigService`: room config, admin password, and banned words.
- `SocialService`: Discord webhook configuration and replay/password webhook integration.
- `NotificationService`: transient room notices.
- `Logger`: room-scoped log sink that forwards worker events to the parent process.

## Design Rules

- Keep services focused on one domain concern.
- Pass `RoomRuntime` explicitly instead of reaching through globals.
- Keep native Haxball API types as the source of truth.
- Put room-local state inside services, not module-level globals, unless the singleton is intentionally worker-scoped.
- Prefer pure helpers when state is not required.

## Adding a Service

1. Add the service file under `game/services/`.
2. Add it to `RoomRuntime` and initialize it in `createRoomRuntime(...)`.
3. Pass `runtime` into the places that need it instead of introducing a new global.

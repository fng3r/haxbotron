# Control Plane Architecture

## Overview

The `web` app acts as a control plane and browser-facing backend for a cluster of backend hosts.

The control plane is responsible for:

- managing host records and exact `ruid -> hostId` mappings
- persisting that configuration locally in the `web` app
- routing room-scoped API requests to the mapped host
- polling all configured hosts for health and runtime room presence
- aggregating realtime events from all hosts into one browser-facing stream
- exposing admin UI for host and mapping CRUD

The configured mapping is authoritative. Runtime observations are used for health and integrity reporting only. They do not change routing.

## High-Level Topology

```text
Browser
  |
  | same-origin HTTP + SSE
  v
Next.js web app
  |
  | control-plane service
  | - persisted hosts + mappings
  | - runtime polling
  | - room routing
  | - global request forwarding
  | - event aggregation
  v
Multiple backend hosts
```

Data paths:

- The browser calls `/api/v1/...` on the `web` app only.
- The `web` app resolves the target host from persisted mapping data and forwards requests to that host.
- The `web` app polls every enabled host for `/api/v1/system` and `/api/v1/room`.
- The `web` app opens one Socket.IO client connection per enabled host and republishes normalized events to browsers over Server-Sent Events.

## Architectural Boundaries

### Server-only control-plane modules

These modules must never enter the browser bundle:

- [storage.ts](/home/fng3r/dev/haxbotron/web/lib/control-plane/storage.ts)
- [service.ts](/home/fng3r/dev/haxbotron/web/lib/control-plane/service.ts)
- [event-bus.ts](/home/fng3r/dev/haxbotron/web/lib/control-plane/event-bus.ts)
- [control-plane.ts](/home/fng3r/dev/haxbotron/web/lib/server/control-plane.ts)

[storage.ts](/home/fng3r/dev/haxbotron/web/lib/control-plane/storage.ts) and [service.ts](/home/fng3r/dev/haxbotron/web/lib/control-plane/service.ts) are marked with `import 'server-only';` because `node-persist` depends on Node APIs such as `fs`.

### Client-safe API/query modules

Client components only talk to the `web` app’s own API routes through:

- [api-client.ts](/home/fng3r/dev/haxbotron/web/lib/api-client.ts)
- [control.ts](/home/fng3r/dev/haxbotron/web/lib/api/control.ts)
- [room.ts](/home/fng3r/dev/haxbotron/web/lib/api/room.ts)
- [player.ts](/home/fng3r/dev/haxbotron/web/lib/api/player.ts)
- [roles.ts](/home/fng3r/dev/haxbotron/web/lib/api/roles.ts)
- [server.ts](/home/fng3r/dev/haxbotron/web/lib/api/server.ts)

These modules do not import the control-plane service directly.

### Server component prefetch boundary

Server-rendered admin pages prefetch through [control-plane.ts](/home/fng3r/dev/haxbotron/web/lib/server/control-plane.ts), which is a server-only wrapper around the singleton control-plane service.

## Persistent Configuration Model

The control plane persists configuration in `node-persist` under the single key `control-plane-state`.

Source:

- [storage.ts](/home/fng3r/dev/haxbotron/web/lib/control-plane/storage.ts)

Stored shape:

```ts
type HostNode = {
  id: string;
  name: string;
  baseUrl: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

type RoomMapping = {
  ruid: string;
  hostId: string;
  createdAt: string;
  updatedAt: string;
};

type ControlPlaneState = {
  hosts: HostNode[];
  mappings: RoomMapping[];
};
```

Operational behavior:

- If no state exists yet, an empty `{ hosts: [], mappings: [] }` state is created automatically.
- The implementation keeps an in-memory copy inside the singleton service for routing speed.
- Every successful mutation persists the full sorted state and then rebuilds the runtime snapshot.
- No process restart is required after adding or editing hosts or mappings.
- The storage lives in the web project’s `.node-persist/` directory.

Migration behavior:

- `storage.ts` still reads legacy `cores` and `mapping.coreId` fields if they exist.
- The loaded data is normalized into the current `hosts` and `hostId` shape before being returned.
- New writes always persist the renamed host-based structure.

## Control Plane Service

The main implementation lives in [service.ts](/home/fng3r/dev/haxbotron/web/lib/control-plane/service.ts).

It is instantiated as a singleton on `globalThis`:

```ts
globalThis.__controlPlaneService
```

This service owns four responsibilities:

- configuration load, validation, and persistence
- runtime polling and snapshot building
- HTTP routing and proxying to the correct host
- realtime event fan-in from all configured hosts

### Configuration validation

`validateState()` enforces:

- unique host IDs
- unique host names
- unique normalized host base URLs
- valid host URLs
- unique mapped RUIDs
- every mapping pointing to an existing host

### Shared authentication to hosts

Every outbound HTTP request from the control plane to a host uses the same `CORE_API_KEY` from the `web` app environment.

Behavior:

- `getSharedApiKey()` fails fast if `CORE_API_KEY` is missing.
- `getClient()` creates an Axios client with `x-api-key` set for the target host.
- There is no per-host API key configuration.

### Runtime snapshot

The control plane maintains an in-memory runtime snapshot:

```ts
type RuntimeSnapshot = {
  generatedAt: number;
  hosts: Map<string, {
    healthy: boolean;
    lastSeenAt: string | null;
    system?: HostSystemInfo;
    onlineRooms: Set<string>;
    integrityIssues: number;
  }>;
  rooms: Map<string, RuntimeRoomInfo>;
  unmappedOnlineRooms: Array<{ ruid: string; hostId: string }>;
};
```

Polling policy:

- health/system TTL: 15 seconds
- room inventory TTL: 5 seconds
- the service reuses the cached snapshot until the minimum TTL window expires

Refresh process:

1. Load the persisted hosts and mappings.
2. Initialize a default snapshot with every configured host marked unhealthy.
3. For each enabled host, call:
   - `GET /api/v1/system`
   - `GET /api/v1/room`
4. Mark the host healthy if both calls succeed.
5. For every online room reported by that host:
   - if the room is not mapped, record it as `unmappedOnlineRooms`
   - if the room is mapped, try `GET /api/v1/room/:ruid/info` to enrich room details
6. Compare configured owner host vs actual online host for every mapped room and compute integrity.

### Integrity model

Room integrity states:

- `ok`
- `wrong_host`
- `offline`
- `host_unreachable`

Meaning:

- `ok`: the room is online on its configured host
- `wrong_host`: the room is online, but on a different host than configured
- `offline`: the configured host is healthy, but the room is not online there
- `host_unreachable`: the configured host is disabled or currently unreachable

Important rule:

- Integrity signals never change routing. Routing always uses the persisted mapping.

### Request routing model

Room routing is configuration-driven:

- `getMapping(ruid)` resolves the mapped `hostId`
- `getMappedHost(ruid)` resolves the concrete host record
- disabled hosts are treated as unavailable
- there is no runtime discovery-based rerouting
- there is no target-host override for room creation

`requestRoom()` also checks the current runtime snapshot. If the mapped host is unhealthy, the request fails instead of being retried on another host.

### Global request routing

Some endpoints are logically global because their data is shared through the database.

Examples:

- `/api/v1/ruidlist`
- `/api/v1/playerlist/...`
- `/api/v1/banlist/...`
- `/api/v1/roleslist/...`

These use `requestGlobal()`, which selects:

- the first enabled healthy host, if any exist
- otherwise the first enabled host

This assumes those endpoints behave consistently no matter which host serves them.

## Browser-Facing API Surface

The browser still calls `/api/v1/...` on the `web` app. Those routes are now implemented inside the `web` app instead of being rewritten to one fixed upstream.

### Catch-all proxy route

Source:

- [route.ts](/home/fng3r/dev/haxbotron/web/app/api/v1/[...path]/route.ts)

This route forwards supported existing APIs through the control-plane service:

- room-scoped routes under `/api/v1/room/...`
- global shared-data routes under `/api/v1/playerlist/...`
- `/api/v1/banlist/...`
- `/api/v1/roleslist/...`
- `/api/v1/ruidlist`

Special handling:

- `GET /api/v1/room` returns all online mapped RUIDs across the cluster
- `POST /api/v1/room` creates a room only on the mapped host for the submitted `ruid`

Error mapping:

- not found and unmapped conditions map to `404`
- disabled and unavailable conditions map to `503`
- duplicate conditions map to `409`
- everything else maps to `400`

### Control-plane admin routes

Sources:

- [summary](/home/fng3r/dev/haxbotron/web/app/api/v1/control/summary/route.ts)
- [hosts](/home/fng3r/dev/haxbotron/web/app/api/v1/control/hosts/route.ts)
- [hostId](/home/fng3r/dev/haxbotron/web/app/api/v1/control/hosts/[hostId]/route.ts)
- [mappings](/home/fng3r/dev/haxbotron/web/app/api/v1/control/mappings/route.ts)
- [ruid](/home/fng3r/dev/haxbotron/web/app/api/v1/control/mappings/[ruid]/route.ts)
- [rooms](/home/fng3r/dev/haxbotron/web/app/api/v1/control/rooms/route.ts)
- [location](/home/fng3r/dev/haxbotron/web/app/api/v1/control/rooms/[ruid]/location/route.ts)

Supported operations:

- `GET /api/v1/control/summary`
- `GET /api/v1/control/hosts`
- `POST /api/v1/control/hosts`
- `PUT /api/v1/control/hosts/:hostId`
- `DELETE /api/v1/control/hosts/:hostId`
- `GET /api/v1/control/mappings`
- `POST /api/v1/control/mappings`
- `PUT /api/v1/control/mappings/:ruid`
- `DELETE /api/v1/control/mappings/:ruid`
- `GET /api/v1/control/rooms`
- `GET /api/v1/control/rooms/:ruid/location`

Mutation guard rules enforced by the service:

- a host cannot be deleted while mappings still reference it
- a mapping cannot be moved while the room is online
- a mapping cannot be deleted while the room is online
- a host cannot be disabled while one of its mapped rooms is online
- a host base URL cannot be changed while one of its mapped rooms is online

## Realtime Architecture

The runtime event path has two separate protocols.

### Host to web: Socket.IO client fan-in

The `web` app opens one Socket.IO client connection per enabled host.

Connection details:

- target path: `/ws`
- transport: `websocket`
- auth: a JWT generated by `generateToken('control-plane')` and attached as `access_token` cookie in `extraHeaders`

Inbound events from each host:

- `roomct`
- `joinleft`
- `statuschange`
- `log`

Each inbound event is normalized by adding `hostId`.

### Web internal fan-out: in-memory event bus

The service emits normalized events through [event-bus.ts](/home/fng3r/dev/haxbotron/web/lib/control-plane/event-bus.ts), a singleton `EventEmitter` wrapper stored on `globalThis`.

### Web to browser: Server-Sent Events

The browser does not connect to a web-hosted Socket.IO server. Instead, it connects to:

- `GET /api/v1/control/events`

Source:

- [route.ts](/home/fng3r/dev/haxbotron/web/app/api/v1/control/events/route.ts)

Behavior:

- opens a `ReadableStream`
- sends a `ready` event immediately
- forwards every normalized control-plane event from the in-memory event bus
- sends a `heartbeat` event every 25 seconds
- closes cleanly when the client aborts the request

The browser-facing realtime transport is SSE because it fits the current Next.js app-router setup without adding a custom websocket server.

### Browser event client

Source:

- [ws.tsx](/home/fng3r/dev/haxbotron/web/context/ws.tsx)

The browser uses a `ControlPlaneSocket` abstraction backed by `EventSource`. It exposes:

- `connect()`
- `disconnect()`
- `on(event, handler)`
- `off(event, handler)`

React Query invalidation currently happens on:

- `roomct`
- `joinleft`

Those events invalidate room and control-plane queries so dashboards and room lists refresh after runtime changes.

## Admin UI

The control plane is fully manageable from the `web` admin UI.

### Navigation

Source:

- [AppSidebar.tsx](/home/fng3r/dev/haxbotron/web/components/common/AppSidebar.tsx)

Admin routes:

- `/admin/control`
- `/admin/control/hosts`
- `/admin/control/mappings`

### Overview page

Source:

- [ControlOverview.tsx](/home/fng3r/dev/haxbotron/web/components/Admin/ControlOverview.tsx)

Purpose:

- show host count
- show healthy host count
- show configured room count
- show integrity issue count
- show a simple host health table
- provide quick links into host and mapping management

### Host management

Source:

- [ControlHosts.tsx](/home/fng3r/dev/haxbotron/web/components/Admin/ControlHosts.tsx)

Capabilities:

- create host records
- edit host name, base URL, and enabled flag
- delete unused hosts
- display health, mapped-room counts, and blocking reasons

### Mapping management

Source:

- [ControlMappings.tsx](/home/fng3r/dev/haxbotron/web/components/Admin/ControlMappings.tsx)

Capabilities:

- create exact `ruid -> hostId` mappings
- reassign mappings to another host while the room is offline
- delete mappings while the room is offline
- display room online state and integrity status
- display blocking reasons from the backend

### Existing room/admin pages made cluster-aware

Examples:

- [RoomList.tsx](/home/fng3r/dev/haxbotron/web/components/Admin/RoomList.tsx)
- [newroom/page.tsx](/home/fng3r/dev/haxbotron/web/app/admin/newroom/page.tsx)
- [serverinfo/page.tsx](/home/fng3r/dev/haxbotron/web/app/admin/serverinfo/page.tsx)
- [logs/page.tsx](/home/fng3r/dev/haxbotron/web/app/admin/room/[ruid]/logs/page.tsx)

Behavior changes:

- room lists now show assigned host information
- room detail pages are resolved through the control plane
- room creation validates that the entered `ruid` has a configured mapping
- the create-room page shows which host the room will launch on

## Query Layer

Control-plane queries and mutations live in:

- [control.ts](/home/fng3r/dev/haxbotron/web/lib/queries/control.ts)

This layer:

- fetches summary, host records, mappings, and managed room lists
- performs CRUD mutations for hosts and mappings
- invalidates both control-plane queries and room-list queries after mutations

## Authentication and Access Control

Browser access to both admin pages and `/api` routes is gated by [proxy.ts](/home/fng3r/dev/haxbotron/web/proxy.ts).

Behavior:

- looks for `access_token` cookie
- verifies it with the local JWT auth implementation
- redirects unauthenticated users to `/login`

There are two distinct auth paths:

- browser to web: JWT cookie verified by the `web` app
- web to host: shared `CORE_API_KEY` header for HTTP and JWT cookie for Socket.IO websocket subscription

## Request and Data Flow Examples

### Example: creating a room

1. The browser submits `POST /api/v1/room`.
2. The catch-all route passes the request to `service.proxyRequest()`.
3. `proxyRequest()` extracts `ruid` from the payload.
4. `requestRoom()` resolves the mapped host from persisted state.
5. If the mapped host is disabled or unhealthy, the request fails.
6. Otherwise the request is forwarded to that host’s `POST /api/v1/room`.
7. The browser receives the upstream response from the `web` app.

### Example: loading room list

1. The browser requests room list data from the `web` app.
2. The service loads or refreshes the runtime snapshot.
3. The snapshot combines persisted mappings with live per-host room inventories.
4. The UI receives a cluster-wide list of online rooms, each enriched with assigned host metadata.

### Example: reacting to room changes

1. A host emits `roomct` over its `/ws` Socket.IO endpoint.
2. The control-plane Socket.IO client receives the event and tags it with `hostId`.
3. The event is emitted into the in-memory control-plane event bus.
4. The SSE route forwards it to connected browsers.
5. The browser invalidates relevant React Query caches and fetches fresh room and control-plane data.

## Operational Notes and Limitations

- The control-plane configuration is local to one `web` deployment. It is not shared across multiple `web` instances.
- The runtime snapshot is in-memory only and is rebuilt after process restart.
- Browser realtime uses SSE, not a web-hosted websocket server.
- The control plane is authoritative for routing, even when runtime integrity says the room is online on the wrong host.
- Global endpoints are served by any enabled host and assume shared persistent backing data.
- Integrity information for unmapped online rooms is tracked in the runtime snapshot and summary counts, but there is no dedicated UI table for unmapped rooms yet.
- `node-persist` is server-only, so client code must never import from `web/lib/control-plane/*`.

## Relevant Files

Backend/control-plane pieces:

- [service.ts](/home/fng3r/dev/haxbotron/web/lib/control-plane/service.ts)
- [storage.ts](/home/fng3r/dev/haxbotron/web/lib/control-plane/storage.ts)
- [types.ts](/home/fng3r/dev/haxbotron/web/lib/control-plane/types.ts)
- [event-bus.ts](/home/fng3r/dev/haxbotron/web/lib/control-plane/event-bus.ts)
- [control-plane.ts](/home/fng3r/dev/haxbotron/web/lib/server/control-plane.ts)

API routes:

- [route.ts](/home/fng3r/dev/haxbotron/web/app/api/v1/[...path]/route.ts)
- [route.ts](/home/fng3r/dev/haxbotron/web/app/api/v1/control/summary/route.ts)
- [route.ts](/home/fng3r/dev/haxbotron/web/app/api/v1/control/hosts/route.ts)
- [route.ts](/home/fng3r/dev/haxbotron/web/app/api/v1/control/hosts/[hostId]/route.ts)
- [route.ts](/home/fng3r/dev/haxbotron/web/app/api/v1/control/mappings/route.ts)
- [route.ts](/home/fng3r/dev/haxbotron/web/app/api/v1/control/mappings/[ruid]/route.ts)
- [route.ts](/home/fng3r/dev/haxbotron/web/app/api/v1/control/rooms/route.ts)
- [route.ts](/home/fng3r/dev/haxbotron/web/app/api/v1/control/rooms/[ruid]/location/route.ts)
- [route.ts](/home/fng3r/dev/haxbotron/web/app/api/v1/control/events/route.ts)

Frontend integration:

- [api-client.ts](/home/fng3r/dev/haxbotron/web/lib/api-client.ts)
- [control.ts](/home/fng3r/dev/haxbotron/web/lib/api/control.ts)
- [control.ts](/home/fng3r/dev/haxbotron/web/lib/queries/control.ts)
- [ws.tsx](/home/fng3r/dev/haxbotron/web/context/ws.tsx)
- [AppSidebar.tsx](/home/fng3r/dev/haxbotron/web/components/common/AppSidebar.tsx)
- [ControlOverview.tsx](/home/fng3r/dev/haxbotron/web/components/Admin/ControlOverview.tsx)
- [ControlHosts.tsx](/home/fng3r/dev/haxbotron/web/components/Admin/ControlHosts.tsx)
- [ControlMappings.tsx](/home/fng3r/dev/haxbotron/web/components/Admin/ControlMappings.tsx)

## Environment Requirements

At minimum, the `web` app needs:

- `CORE_API_KEY`
- `JWT_SECRET`

`NEXT_PUBLIC_API_URL` is optional and defaults to same-origin in [api-client.ts](/home/fng3r/dev/haxbotron/web/lib/api-client.ts).

After startup, host records and room mappings are configured from the admin UI rather than environment variables.

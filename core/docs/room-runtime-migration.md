# Room Runtime Migration Notes

## Major decisions

- Rooms now run in dedicated Node child processes instead of Puppeteer pages.
- The main process keeps the HTTP API and Socket.IO connections and talks to workers over typed IPC.
- Room dependencies are composed once per worker in `RoomRuntime` and then passed explicitly into commands, event handlers, and RPC handlers.
- Worker code emits room events directly to the parent process; the parent preserves the existing `roomct`, `log`, `joinleft`, and `statuschange` Socket.IO contract.
- Player/ban/role persistence no longer crosses a browser bridge. The worker uses a room-scoped repository that calls the DB adapter directly.
- Parent-process room services are composed explicitly in `app.ts`; controllers and routers receive `RoomOperationsAPI` through factory functions instead of pulling module globals.
- The worker IPC protocol is now discriminated by `command`, and post-bootstrap room commands are dispatched through a typed handler table rather than a `switch` over loosely typed payloads.

## Important implementation details

- One worker hosts exactly one room and exits when that room is closed.
- `haxball.js` is initialized inside the worker and the parent process never calls `HBInit`.
- The room-open API only resolves after the worker reports `roomReady`, which is emitted from the room link callback.
- Shutdown is graceful first (`closeRoom` RPC) and forced only if the worker fails to exit in time.
- Browser-only bootstrap paths such as `localStorage`, `page.evaluate`, and injected `window._*` functions are removed from the room runtime.
- The old service locator is removed; the remaining shared runtime object is per-room, not global.
- `Logger`, `KickStack`, and the room DB repository are ordinary room-scoped objects now; they are no longer accessed through worker-global singleton helpers.
- Worker responses echo the command name back to the parent so request/result typing stays correlated across the IPC boundary.
- `WorkerEventBridge` is the only `process.send(...)` wrapper in the worker runtime. Both room events and RPC responses go through that boundary.

## Remaining intentional limitations

- The current migration does not attempt multi-room-in-one-process support.

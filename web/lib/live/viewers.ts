// Shared across Next's Pages API relay and App Router directory bundles in one process.
const state = globalThis as typeof globalThis & { haxbotronLiveViewers?: Map<string, number> };
const counts = (state.haxbotronLiveViewers ??= new Map<string, number>());

export function setLiveViewerCount(ruid: string, viewers: number): void {
  if (viewers > 0) counts.set(ruid, viewers);
  else counts.delete(ruid);
}

export function getLiveViewerCount(ruid: string): number {
  return counts.get(ruid) ?? 0;
}

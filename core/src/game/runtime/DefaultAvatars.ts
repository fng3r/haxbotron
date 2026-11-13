import type { RoomRuntime } from './RoomRuntime.js';

type PlayerTeam = { id: number; team: number };

/** Public-event equivalent of native avatarNumber assignment, without engine patches. */
export class DefaultAvatars {
    private players = new Map<number, { team: number; number: number }>();

    /** Native position resets assign sequential numbers in current room-list order. */
    reset(players: readonly PlayerTeam[]): void {
        this.players.clear();
        const counts = [0, 0, 0];
        for (const player of players) {
            this.players.set(player.id, { team: player.team,
                number: player.team === 0 ? 0 : ++counts[player.team] });
        }
    }

    /** Team changes fill a vacancy without renumbering the other players. */
    change(id: number, team: number): void {
        if (this.players.get(id)?.team === team) return;
        this.players.delete(id);
        const used = new Set([...this.players.values()].filter(p => p.team === team).map(p => p.number));
        let number = 1;
        while (used.has(number)) number++;
        this.players.set(id, { team, number });
    }

    remove(id: number): void { this.players.delete(id); }
    clear(): void { this.players.clear(); }
    number(id: number): number | undefined { return this.players.get(id)?.number; }
}

const trackers = new WeakMap<RoomRuntime, DefaultAvatars>();
export function getDefaultAvatars(runtime: RoomRuntime): DefaultAvatars {
    let tracker = trackers.get(runtime);
    if (!tracker) { tracker = new DefaultAvatars(); trackers.set(runtime, tracker); }
    return tracker;
}
